import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentFormSchema } from '../../shared/utils/schemas';
import { useData, useDebounce, useSave } from '../../shared/hooks/query';
import { get } from '../../shared/services/api';
import { Appointment, Patient } from '../../shared/types';
import { Input, Button, Field, Modal, ErrorBox, Loading, Empty, Badge, Table } from '../../shared/components/ui';
import { today, fecha, hora, localDate } from '../../shared/utils/format';
const add = (s: string, n: number) => {
  const d = new Date(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export function Agenda() {
  const [day, setDay] = useState(today()),
    [view, setView] = useState('Semana'),
    [create, setCreate] = useState(false),
    [selected, setSelected] = useState<Appointment | null>(null);
  const d = new Date(day),
    week = add(day, -((d.getUTCDay() + 6) % 7)),
    start = view === 'Mes' ? day.slice(0, 7) + '-01' : view === 'Semana' ? week : day,
    end = view === 'Mes' ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10) : view === 'Semana' ? add(start, 6) : day;
  const q = useData<Appointment[]>(`/agenda?desde=${start}&hasta=${end}`);
  const days = Array.from({
    length: view === 'Mes' ? new Date(end).getUTCDate() : view === 'Semana' ? 7 : 1
  }, (_, i) => add(start, i));
  return <><div className="page-head"><div><h1>Agenda</h1><p className="muted">Organiza el día, dedica tiempo a cada sonrisa.</p></div><Button onClick={() => setCreate(true)}>+ Nueva cita</Button></div><div className="card"><div className="calendar-toolbar"><div className="segmented">{['Día', 'Semana', 'Mes'].map(v => <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>{v}</button>)}</div><div className="inline"><Button secondary onClick={() => setDay(add(day, view === 'Mes' ? -30 : view === 'Semana' ? -7 : -1))}>←</Button><Input aria-label="Fecha de agenda" type="date" value={day} onChange={e => e.target.value && setDay(e.target.value)} /><Button secondary onClick={() => setDay(add(day, view === 'Mes' ? 30 : view === 'Semana' ? 7 : 1))}>→</Button><Button secondary onClick={() => setDay(today())}>Hoy</Button></div></div><p className="muted small">Turnos: 09:00–13:00 y 15:00–20:00 · Hora de Perú</p><ErrorBox error={q.error} />{q.isLoading ? <Loading /> : view === 'Mes' ? <div className="month-grid">{days.map(date => <div className="month-day" key={date}><strong>{fecha(date)}</strong>{q.data?.filter(c => localDate(c.inicio) === date).map(c => <button className={'appointment ' + (c.estado === 'Cancelada' ? 'cancelled' : '')} key={c.id} onClick={() => setSelected(c)}>{hora(c.inicio)} {c.paciente.nombres}<small>{c.tipo}{c.estado!=='Confirmada'?' · '+c.estado:''}</small></button>)}</div>)}</div> : <div className="calendar-scroll"><div className="calendar" style={{
          gridTemplateColumns: `55px repeat(${days.length}, minmax(115px,1fr))`
        }}><div className="time-column"><div className="day-heading" />{Array.from({
              length: 12
            }, (_, i) => <div className="time-label" key={i}>{String(i + 8).padStart(2, '0')}:00</div>)}</div>{days.map(date => <div key={date}><div className={'day-heading ' + (date === today() ? 'is-today' : '')}>{new Date(date).toLocaleDateString('es-PE', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                timeZone: 'UTC'
              })}</div><div className="day-slots">{Array.from({
                length: 12
              }, (_, i) => <div key={i} className={'hour-slot ' + ([8, 13, 14].includes(i + 8) ? 'closed' : '')} />)}{q.data?.filter(c => localDate(c.inicio) === date && c.estado !== 'Cancelada').map(c => {
                const local = new Date(new Date(c.inicio).getTime() - 5 * 3600000),
                  minutes = local.getUTCHours() * 60 + local.getUTCMinutes() - 480,
                  duration = (+new Date(c.fin) - +new Date(c.inicio)) / 60000;
                return <button key={c.id} className="appointment positioned" style={{
                  top: minutes,
                  height: Math.max(duration, 24)
                }} onClick={() => setSelected(c)}><strong>{hora(c.inicio)} · {c.paciente.nombres}</strong><small>{c.tipo}{c.estado!=='Confirmada'?' · '+c.estado:''}</small></button>;
              })}</div></div>)}</div></div>}</div>{create && <AppointmentModal initialDay={day} onClose={() => setCreate(false)} />} {selected && <AppointmentDetail appointment={selected} onClose={() => setSelected(null)} />}</>;
}
export function PatientAppointments({
  patient
}: {
  patient: Patient;
}) {
  const [create, setCreate] = useState(false),
    [selected, setSelected] = useState<Appointment | null>(null);
  const q = useData<Appointment[]>(`/agenda?pacienteId=${patient.id}&desde=1900-01-01&hasta=2100-12-31`);
  return <div className="card"><div className="page-head"><h2>Citas del paciente</h2><Button onClick={() => setCreate(true)}>+ Nueva cita</Button></div><ErrorBox error={q.error} />{q.isLoading ? <Loading /> : q.data?.length ? <Table headers={['Fecha', 'Hora', 'Atención', 'Estado', '']}>{q.data.map(c => <tr key={c.id}><td>{fecha(localDate(c.inicio))}</td><td>{hora(c.inicio)}</td><td>{c.tipo}</td><td><Badge>{c.estado}</Badge></td><td><Button secondary onClick={() => setSelected(c)}>Ver detalle</Button></td></tr>)}</Table> : <Empty />}{create && <AppointmentModal patient={patient} onClose={() => setCreate(false)} />} {selected && <AppointmentDetail appointment={selected} onClose={() => setSelected(null)} />}</div>;
}
export function AppointmentModal({
  patient,
  appointment,
  onClose,
  initialDay
}: {
  patient?: Patient;
  appointment?: Appointment;
  onClose: () => void;
  initialDay?: string;
}) {
  const [search, setSearch] = useState(''),
    [chosen, setChosen] = useState<Patient | undefined>(patient || appointment?.paciente);
  const debounced = useDebounce(search);
  const patients = useQuery({
    queryKey: ['patient-search', debounced],
    queryFn: () => get<Patient[]>('/pacientes?query=' + encodeURIComponent(debounced)),
    enabled: !chosen
  });
  const {
    register,
    handleSubmit,
    watch
  } = useForm({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      fecha: appointment ? localDate(appointment.inicio) : initialDay || today(),
      hora: appointment ? hora(appointment.inicio) : '09:00',
      duracion: appointment ? (+new Date(appointment.fin) - +new Date(appointment.inicio)) / 60000 : 30,
      tipo: appointment?.tipo || ''
    }
  });
  const v = watch(),
    start = v.fecha + 'T' + v.hora + ':00-05:00';
  const key = useDebounce(start + '|' + v.duracion);
  const availability = useQuery({
    queryKey: ['availability', key, appointment?.id],
    queryFn: () => get<{
      disponible: boolean;
    }>(`/agenda/validar-solapamiento?inicio=${encodeURIComponent(key.split('|')[0])}&duracion=${key.split('|')[1]}${appointment ? '&exclude=' + appointment.id : ''}`),
    enabled: !!v.fecha && !!v.hora,
    retry: false,
    staleTime: 0
  });
  const save = useSave('/citas' + (appointment ? '/' + appointment.id : ''), appointment ? 'put' : 'post', onClose);
  return <Modal title={appointment ? 'Reprogramar cita' : 'Nueva cita'} onClose={onClose}><form onSubmit={handleSubmit(data => save.mutate({
      pacienteId: chosen?.id,
      inicio: start,
      duracion: Number(data.duracion),
      tipo: data.tipo
    }))}><Field label="Paciente *">{chosen ? <div className="selected-patient">{chosen.nombres} {chosen.apellidos}{!patient && !appointment && <button type="button" onClick={() => setChosen(undefined)}>Cambiar</button>}</div> : <><Input placeholder="Buscar nombre o documento" value={search} onChange={e => setSearch(e.target.value)} /><div className="autocomplete">{patients.data?.map(p => <button type="button" key={p.id} onClick={() => setChosen(p)}>{p.nombres} {p.apellidos} · {p.documento}</button>)}</div></>}</Field><div className="form-grid"><Field label="Fecha *"><Input required type="date" {...register('fecha')} /></Field><Field label="Hora *"><Input required type="time" {...register('hora')} /></Field></div><Field label="Tipo de atención *"><Input required placeholder="Ej. Evaluación, limpieza, endodoncia" {...register('tipo')} /></Field><Field label="Duración estimada (minutos) *"><Input required type="number" min="15" max="300" step="15" {...register('duracion')} /></Field>{availability.isFetching ? <p className="muted">Comprobando disponibilidad…</p> : availability.data?.disponible ? <p className="success">Horario disponible</p> : !availability.error && <p className="error">Ya existe una cita en ese horario.</p>}<ErrorBox error={save.error || availability.error || patients.error} /><div className="actions"><Button secondary type="button" onClick={onClose}>Volver</Button><Button disabled={save.isPending || !chosen || !availability.data?.disponible || availability.isFetching || key !== start + '|' + v.duracion}>{save.isPending ? 'Guardando…' : 'Guardar cita'}</Button></div></form></Modal>;
}
function AppointmentDetail({
  appointment: c,
  onClose
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const [edit, setEdit] = useState(false),
    [cancel, setCancel] = useState(false), [noShow,setNoShow]=useState(false);
  const save = useSave('/citas/' + c.id, 'patch', onClose);
  const phone = '51' + c.paciente.telefono.replace(/\D/g, '').slice(-9),
    message = `Hola ${c.paciente.nombres}, te recordamos tu cita el ${fecha(localDate(c.inicio))} a las ${hora(c.inicio)} en Consultorio Juzel. Por favor confirma tu asistencia.`;
  if(noShow)return <Modal title="Marcar como no asistió" onClose={()=>setNoShow(false)}><p>Se registrará que {c.paciente.nombres} {c.paciente.apellidos} no asistió a su cita. No se completarán sesiones ni se modificarán pagos.</p><ErrorBox error={save.error}/><div className="actions"><Button secondary onClick={()=>setNoShow(false)}>Volver</Button><Button disabled={save.isPending} onClick={()=>save.mutate({estado:'No asistió'})}>Confirmar inasistencia</Button></div></Modal>;
  if (edit) return <AppointmentModal appointment={c} onClose={onClose} />;
  return <Modal title={cancel ? '¿Seguro que deseas cancelar esta cita?' : 'Detalle de cita'} onClose={onClose}><h3>{c.paciente.nombres} {c.paciente.apellidos}</h3><p>{fecha(localDate(c.inicio))} · {hora(c.inicio)}–{hora(c.fin)}</p><p>{c.tipo} · <Badge>{c.estado}</Badge></p><ErrorBox error={save.error} />{cancel ? <div className="actions"><Button secondary onClick={() => setCancel(false)}>Volver</Button><Button disabled={save.isPending} onClick={() => save.mutate({
        estado: 'Cancelada'
      })}>Confirmar cancelación</Button></div> : <div className="detail-actions">{c.estado === 'Confirmada' && <><Button onClick={() => setEdit(true)}>Reprogramar</Button><Button secondary onClick={() => setCancel(true)}>Cancelar cita</Button><Button secondary disabled={save.isPending} onClick={() => save.mutate({
          estado: 'Completada'
        })}>Marcar como atendida</Button><Button secondary disabled={save.isPending||new Date(c.fin).getTime()>Date.now()} title="Disponible después de la hora de término de la cita" onClick={()=>setNoShow(true)}>Marcar como no asistió</Button><a className="btn secondary" href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Enviar recordatorio WhatsApp</a></>}<Link className="text-link" to={'/pacientes/' + c.pacienteId} onClick={onClose}>Ver ficha del paciente →</Link></div>}</Modal>;
}
