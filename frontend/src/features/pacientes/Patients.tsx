import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, Plus, AlertTriangle, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useData, useDebounce, useSave } from '../../shared/hooks/query';
import { Patient } from '../../shared/types';
import { Input, Button, Field, Table, Badge, Loading, ErrorBox, Empty, MedicalAlert, Modal } from '../../shared/components/ui';
import { fecha, age, today } from '../../shared/utils/format';
import { download } from '../../shared/services/api';
import { Anamnesis, History } from '../historia-clinica/Clinical';
import { Odontogram } from '../odontograma/Odontogram';
import { Treatments } from '../tratamientos/Treatments';
import { Payments } from '../pagos/Payments';
import { PatientAppointments } from '../agenda/Agenda';
export function Patients() {
  const [search, setSearch] = useState('');
  const query = useDebounce(search);
  const q = useData<Patient[]>('/pacientes?query=' + encodeURIComponent(query));
  return <><div className="page-head"><div><h1>Pacientes</h1><p className="muted">Cada historia, un cuidado continuo.</p></div><Link className="btn" to="/pacientes/nuevo"><Plus size={18} /> Nuevo paciente</Link></div><div className="card"><div className="search"><Search size={18} /><Input aria-label="Buscar pacientes" placeholder="Buscar por nombre, documento o teléfono" value={search} onChange={e => setSearch(e.target.value)} /></div><ErrorBox error={q.error} />{q.isLoading ? <Loading /> : q.data?.length ? <Table headers={['Historia clínica', 'Paciente', 'Documento', 'Teléfono', 'Última atención', '']}>{q.data.map(p => <tr key={p.id}><td className="muted">{p.historia.numero}</td><td><Link to={'/pacientes/' + p.id}><strong>{p.nombres} {p.apellidos}</strong></Link>{(p.historia.alergias.length > 0 || p.historia.antecedentes.some(a => !a.controlado)) && <AlertTriangle aria-label="Alerta médica" className="alert-icon" size={16} />}</td><td>{p.documento}</td><td>{p.telefono}</td><td>{p.historia.atenciones[0] ? fecha(p.historia.atenciones[0].fecha) : 'Sin atenciones'}</td><td><Link className="text-link" to={'/pacientes/' + p.id}>Ver ficha →</Link></td></tr>)}</Table> : <Empty>No se encontraron pacientes.</Empty>}</div></>;
}
const schema = z.object({
  nombres: z.string().trim().min(1, 'Campo obligatorio'),
  apellidos: z.string().trim().min(1, 'Campo obligatorio'),
  tipoDocumento: z.enum(['DNI', 'CE', 'Pasaporte']),
  documento: z.string().min(8, 'Mínimo 8 caracteres').max(20),
  nacimiento: z.string().min(1, 'Campo obligatorio').refine(v => v <= today(), 'Fecha futura inválida'),
  sexo: z.enum(['Femenino', 'Masculino', 'Otro']),
  telefono: z.string().regex(/^(\+?51)?9\d{8}$/, 'Ingresa un celular peruano de 9 dígitos'),
  direccion: z.string().min(1, 'Campo obligatorio'),
  correo: z.union([z.string().email('Correo inválido'), z.literal('')])
}).superRefine((v, ctx) => {
  if (v.tipoDocumento === 'DNI' && !/^\d{8}$/.test(v.documento)) ctx.addIssue({
    code: 'custom',
    path: ['documento'],
    message: 'El DNI debe tener 8 dígitos'
  });
});
export function NewPatient() {
  const nav = useNavigate(),
    save = useSave('/pacientes');
  const {
    register,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      tipoDocumento: 'DNI',
      sexo: 'Femenino',
      correo: ''
    }
  });
  const existing = (save.error as {
    response?: {
      data?: {
        data?: {
          existingId?: string;
        };
      };
    };
  })?.response?.data?.data?.existingId;
  return <><Link className="text-link" to="/pacientes">← Pacientes</Link><h1>Nuevo paciente</h1><p className="muted">El número de historia clínica se generará automáticamente.</p><form className="card" onSubmit={handleSubmit(v => save.mutate(v, {
      onSuccess: p => nav('/pacientes/' + p.id, {
        state: {
          message: 'Paciente registrado correctamente'
        }
      })
    }))}><div className="form-grid">{(['nombres', 'apellidos'] as const).map(k => <Field key={k} label={(k === 'nombres' ? 'Nombres' : 'Apellidos') + ' *'} error={errors[k]?.message}><Input {...register(k)} /></Field>)}<Field label="Tipo de documento *"><select {...register('tipoDocumento')}><option>DNI</option><option>CE</option><option>Pasaporte</option></select></Field><Field label="N° de documento *" error={errors.documento?.message}><Input {...register('documento')} /></Field><Field label="Fecha de nacimiento *" error={errors.nacimiento?.message}><Input type="date" max={today()} {...register('nacimiento')} /></Field><Field label="Sexo *"><select {...register('sexo')}><option>Femenino</option><option>Masculino</option><option>Otro</option></select></Field><Field label="Teléfono *" error={errors.telefono?.message}><Input type="tel" {...register('telefono')} /></Field><Field label="Correo (opcional)" error={errors.correo?.message}><Input type="email" {...register('correo')} /></Field><Field label="Dirección *" error={errors.direccion?.message}><Input {...register('direccion')} /></Field></div><ErrorBox error={save.error} />{existing && <Link className="text-link" to={'/pacientes/' + existing}>Abrir la ficha existente</Link>}<div className="actions"><Link className="btn secondary" to="/pacientes">Cancelar</Link><Button disabled={save.isPending}>{save.isPending ? 'Registrando…' : 'Registrar paciente'}</Button></div></form></>;
}
const tabs = ['Anamnesis', 'Historial de atenciones', 'Odontograma', 'Tratamientos', 'Pagos y saldos', 'Citas'];
export function PatientDetail() {
  const {
    id
  } = useParams();
  const q = useData<Patient>('/pacientes/' + id + '/resumen');
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'Anamnesis';
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [archive, setArchive] = useState(false);
  const nav = useNavigate(),
    remove = useSave('/pacientes/' + id, 'delete', () => nav('/pacientes'));
  if (q.isLoading) return <Loading />;
  if (!q.data) return <ErrorBox error={q.error} />;
  const p = q.data;
  return <><Link className="text-link" to="/pacientes">← Todos los pacientes</Link><div className="page-head"><div><h1>{p.nombres} {p.apellidos}</h1><p className="muted"><Badge>{p.historia.numero}</Badge> · {age(p.nacimiento)} años · {p.tipoDocumento} {p.documento}</p></div><Button secondary disabled={busy} onClick={async () => {
        setBusy(true);
        setError(null);
        try {
          await download(`/pacientes/${id}/historia-clinica/pdf`, p.historia.numero + '.pdf');
        } catch (e) {
          setError(e);
        } finally {
          setBusy(false);
        }
      }}><Download size={17} />{busy ? 'Generando…' : 'Exportar PDF'}</Button></div><MedicalAlert allergies={p.historia.alergias.map(a => a.nombre)} conditions={p.historia.antecedentes.filter(a => !a.controlado).map(a => a.nombre)} /><ErrorBox error={error} /><div className="tabs" role="tablist">{tabs.map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setParams({
        tab: t
      })}>{t}</button>)}</div><div role="tabpanel">{tab === tabs[0] ? <Anamnesis id={id!} /> : tab === tabs[1] ? <History id={id!} /> : tab === tabs[2] ? <Odontogram id={id!} /> : tab === tabs[3] ? <Treatments id={id!} /> : tab === tabs[4] ? <Payments id={id!} /> : <PatientAppointments patient={p} />}</div><button className="muted small archive" onClick={() => setArchive(true)}>Archivar historia clínica</button>{archive && <Modal title="Archivar historia clínica" onClose={() => setArchive(false)}><p>La ficha dejará de aparecer en el listado. Sus datos clínicos se conservarán mediante borrado lógico.</p><ErrorBox error={remove.error} /><div className="actions"><Button secondary onClick={() => setArchive(false)}>Volver</Button><Button disabled={remove.isPending} onClick={() => remove.mutate({})}>Confirmar archivo</Button></div></Modal>}</>;
}
