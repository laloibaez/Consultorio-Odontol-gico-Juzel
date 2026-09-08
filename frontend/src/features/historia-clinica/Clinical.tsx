import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { anamnesisFormSchema } from '../../shared/utils/schemas';
import { useData, useSave } from '../../shared/hooks/query';
import { Antecedente, Attention, Treatment } from '../../shared/types';
import { Input, Button, Field, ErrorBox, Loading, Empty, Badge } from '../../shared/components/ui';
import { fecha, FDI, today } from '../../shared/utils/format';
interface Anam {
  antecedentes: Antecedente[];
  alergias: {
    nombre: string;
  }[];
  medicacion: string;
  derivacionMedico: string;
  derivacionMotivo: string;
}
export function Anamnesis({
  id
}: {
  id: string;
}) {
  const q = useData<Anam>(`/pacientes/${id}/anamnesis`);
  const [antecedentes, setAnt] = useState<Antecedente[]>([]),
    [allergies, setAll] = useState<string[]>([]),
    [tag, setTag] = useState(''),
    [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    reset
  } = useForm<{
    medicacion: string;
    derivacionMedico: string;
    derivacionMotivo: string;
  }>({
    resolver: zodResolver(anamnesisFormSchema),
    defaultValues: {
      medicacion: '',
      derivacionMedico: '',
      derivacionMotivo: ''
    }
  });
  useEffect(() => {
    if (q.data) {
      setAnt(q.data.antecedentes);
      setAll(q.data.alergias.map(a => a.nombre));
      reset(q.data);
    }
  }, [q.data, reset]);
  const save = useSave(`/pacientes/${id}/anamnesis`, 'put', () => setMessage('Anamnesis guardada correctamente'));
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error}/>;
  return <form className="card" onSubmit={handleSubmit(v => save.mutate({
    ...v,
    antecedentes,
    alergias: allergies
  }))}><h2>Antecedentes y salud general</h2><p className="muted">Mantén actualizada la información antes de cada atención.</p><div className="conditions">{['Diabetes', 'Hipertensión', 'Cardiopatía', 'Asma', 'Trastornos de coagulación', 'Embarazo'].map(nombre => {
        const a = antecedentes.find(a => a.nombre === nombre);
        return <div className="condition" key={nombre}><label><Input type="checkbox" checked={!!a} onChange={e => setAnt(e.target.checked ? [...antecedentes, {
              nombre,
              controlado: true
            }] : antecedentes.filter(a => a.nombre !== nombre))} />{nombre}</label>{a && <select aria-label={'Estado de ' + nombre} value={String(a.controlado)} onChange={e => setAnt(antecedentes.map(x => x.nombre === nombre ? {
            ...x,
            controlado: e.target.value === 'true'
          } : x))}><option value="true">Controlado</option><option value="false">No controlado</option></select>}</div>;
      })}</div><Field label="Alergias"><div className="tag-entry"><Input value={tag} placeholder="Ej. Penicilina" onChange={e => setTag(e.target.value)} onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (tag.trim()) setAll([...new Set([...allergies, tag.trim()])]);
            setTag('');
          }
        }} /><Button type="button" secondary onClick={() => {
          if (tag.trim()) setAll([...new Set([...allergies, tag.trim()])]);
          setTag('');
        }}>Añadir</Button></div></Field><div className="tags">{allergies.map(a => <span className="badge" key={a}>{a}<button type="button" aria-label={'Quitar ' + a} onClick={() => setAll(allergies.filter(x => x !== a))}>×</button></span>)}</div><Field label="Medicación actual"><textarea {...register('medicacion')} /></Field><div className="form-grid"><Field label="Derivación médica · Profesional"><Input {...register('derivacionMedico')} /></Field><Field label="Motivo de derivación"><textarea {...register('derivacionMotivo')} /></Field></div><ErrorBox error={q.error || save.error} />{message && <p className="success" role="status">{message}</p>}<div className="actions"><Button disabled={save.isPending}>{save.isPending ? 'Guardando…' : 'Guardar anamnesis'}</Button></div></form>;
}
export function History({
  id
}: {
  id: string;
}) {
  const q = useData<Attention[]>(`/pacientes/${id}/atenciones`);
  return <div className="card"><div className="page-head"><h2>Historial de atenciones</h2><Link className="btn" to={`/pacientes/${id}/atencion/nueva`}>+ Registrar atención</Link></div><ErrorBox error={q.error} />{q.isLoading ? <Loading /> : q.data?.length ? q.data.map(a => <article className="timeline" key={a.id}><div><Badge>{fecha(a.fecha)}</Badge>{a.sesion && <span className="muted"> {a.sesion.tratamiento.nombre} · Sesión {a.sesion.numero}</span>}</div><h3>{a.diagnostico}</h3><p>{a.procedimiento}</p><p className="muted">Piezas: {a.piezas.join(', ') || 'No aplica'} · Anestésico: {a.anestesico}</p><p><strong>Indicaciones:</strong> {a.indicaciones}</p></article>) : <Empty />}</div>;
}
const schema = z.object({
  fecha: z.string().min(1),
  diagnostico: z.string().min(1, 'Campo obligatorio'),
  procedimiento: z.string().min(1, 'Campo obligatorio'),
  anestesico: z.string().min(1, 'Especifica el anestésico'),
  indicaciones: z.string().min(1, 'Campo obligatorio')
});
export function NewAttention() {
  const {
      id
    } = useParams(),
    nav = useNavigate(),
    save = useSave(`/pacientes/${id}/atenciones`, 'post', () => nav(`/pacientes/${id}?tab=Historial+de+atenciones`,{state:{message:'Atención registrada correctamente'}}));
  const plans = useData<Treatment[]>(`/pacientes/${id}/tratamientos`);
  const [piezas, setPiezas] = useState<number[]>([]),
    [linked, setLinked] = useState(false),
    [plan, setPlan] = useState(''),
    [session, setSession] = useState(''),
    [anesthesia, setAnesthesia] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: {
      errors
    }
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: today(),
      anestesico: 'No'
    }
  });
  return <><h1>Registrar atención clínica</h1><form className="card" onSubmit={handleSubmit(v => save.mutate({
      ...v,
      piezas,
      ...(linked ? {
        sesionId: session
      } : {})
    }))}><div className="form-grid"><Field label="Fecha *"><Input type="date" {...register('fecha')} /></Field><Field label="Diagnóstico *" error={errors.diagnostico?.message}><Input list="diagnosticos" {...register('diagnostico')} /><datalist id="diagnosticos"><option>Caries dental</option><option>Gingivitis</option><option>Pulpitis</option><option>Periodontitis</option></datalist></Field></div><Field label="Procedimiento realizado *" error={errors.procedimiento?.message}><textarea {...register('procedimiento')} /></Field><Field label="Piezas tratadas (FDI)"><div className="tooth-select">{FDI.map(n => <button key={n} type="button" className={piezas.includes(n) ? 'selected' : ''} onClick={() => setPiezas(piezas.includes(n) ? piezas.filter(x => x !== n) : [...piezas, n])}>{n}</button>)}</div></Field><Field label="¿Se utilizó anestésico?"><select value={String(anesthesia)} onChange={e => {
          setAnesthesia(e.target.value === 'true');
          setValue('anestesico', e.target.value === 'true' ? 'Lidocaína' : 'No');
        }}><option value="false">No</option><option value="true">Sí</option></select></Field>{anesthesia && <Field label="Tipo de anestésico *" error={errors.anestesico?.message}><Input list="anestesicos" {...register('anestesico')} /><datalist id="anestesicos"><option>Lidocaína</option><option>Articaína</option><option>Mepivacaína</option></datalist></Field>}<Field label="Indicaciones post-atención *" error={errors.indicaciones?.message}><textarea {...register('indicaciones')} /></Field><label className="check"><Input type="checkbox" checked={linked} onChange={e => setLinked(e.target.checked)} />Vincular a plan de tratamiento existente</label>{linked && <div className="form-grid"><Field label="Tratamiento"><select required value={plan} onChange={e => {
            setPlan(e.target.value);
            setSession('');
          }}><option value="">Selecciona un tratamiento</option>{plans.data?.filter(p => p.estado === 'En curso').map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></Field><Field label="Sesión pendiente"><select required value={session} onChange={e => setSession(e.target.value)}><option value="">Selecciona una sesión</option>{plans.data?.find(p => p.id === plan)?.sesiones.filter(s => !s.completada).map(s => <option key={s.id} value={s.id}>Sesión {s.numero}</option>)}</select></Field></div>}<ErrorBox error={save.error || plans.error} /><div className="actions"><Link className="btn secondary" to={'/pacientes/' + id}>Cancelar</Link><Button disabled={save.isPending}>{save.isPending ? 'Guardando…' : 'Guardar atención'}</Button></div></form></>;
}
