import {PatientRegistration} from './PatientRegistration';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, Plus, AlertTriangle, Download } from 'lucide-react';
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
export function NewPatient(){return <PatientRegistration/>;}
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
