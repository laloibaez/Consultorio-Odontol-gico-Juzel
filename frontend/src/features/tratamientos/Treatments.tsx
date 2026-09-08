import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useData, useSave } from '../../shared/hooks/query';
import { Treatment } from '../../shared/types';
import { Input, Button, Field, Badge, ErrorBox, Empty, Loading } from '../../shared/components/ui';
import { soles, fecha } from '../../shared/utils/format';
export function Treatments({
  id
}: {
  id: string;
}) {
  const q = useData<Treatment[]>(`/pacientes/${id}/tratamientos`);
  return <><div className="page-head"><h2>Planes de tratamiento</h2><Link className="btn" to={`/pacientes/${id}/tratamientos/nuevo`}>+ Nuevo plan de tratamiento</Link></div><ErrorBox error={q.error} />{q.isLoading ? <Loading /> : q.data?.length ? q.data.map(t => <TreatmentCard key={t.id} t={t} patientId={id} />) : <Empty />}</>;
}
function TreatmentCard({
  t,
  patientId
}: {
  t: Treatment;
  patientId: string;
}) {
  const [open, setOpen] = useState(false),
    save = useSave('/tratamientos/' + t.id, 'patch');
  const count = t.sesiones.filter(s => s.completada).length;
  return <article className="card"><div className="page-head"><h3>{t.nombre}</h3><Badge>{t.estado}</Badge></div><p className="muted">{t.descripcion}</p><div className="page-head"><strong>Sesión {count} de {t.totalSesiones}</strong><span>{soles(t.costo)}</span></div><progress value={count} max={t.totalSesiones} /><Button secondary onClick={() => setOpen(!open)}>{open ? 'Ocultar detalle' : 'Ver detalle'}</Button>{open && <><ul className="session-list">{t.sesiones.map(s => <li key={s.id}>Sesión {s.numero} <Badge>{s.completada ? 'Completada' : 'Pendiente'}</Badge>{s.atencion && <span>{fecha(s.atencion.fecha)} · {s.atencion.procedimiento}</span>}</li>)}</ul><div className="actions">{!t.cuotas.length && <Link className="btn" to={`/pacientes/${patientId}?tab=Pagos+y+saldos&plan=${t.id}`}>Generar plan de cuotas</Link>}{t.estado !== 'Finalizado' && <Button secondary disabled={save.isPending} onClick={() => save.mutate({
          estado: t.estado === 'Suspendido' ? 'En curso' : 'Suspendido'
        })}>{t.estado === 'Suspendido' ? 'Reanudar tratamiento' : 'Suspender tratamiento'}</Button>}</div><ErrorBox error={save.error} /></>}</article>;
}
const schema = z.object({
  nombre: z.string().min(1, 'Campo obligatorio'),
  descripcion: z.string().min(1, 'Campo obligatorio'),
  totalSesiones: z.coerce.number().int().min(1).max(100),
  costo: z.coerce.number().positive('Ingresa un costo mayor que cero')
});
export function NewTreatment() {
  const {
      id
    } = useParams(),
    nav = useNavigate(),
    save = useSave(`/pacientes/${id}/tratamientos`, 'post', () => nav(`/pacientes/${id}?tab=Tratamientos`,{state:{message:'Plan de tratamiento creado correctamente'}}));
  const {
    register,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      totalSesiones: 1
    }
  });
  return <><h1>Nuevo plan de tratamiento</h1><form className="card narrow" onSubmit={handleSubmit(v => save.mutate(v))}><Field label="Nombre / tipo de tratamiento *" error={errors.nombre?.message}><Input {...register('nombre')} /></Field><Field label="Descripción / objetivo *" error={errors.descripcion?.message}><textarea {...register('descripcion')} /></Field><div className="form-grid"><Field label="Número total de sesiones *" error={errors.totalSesiones?.message}><Input type="number" min="1" max="100" {...register('totalSesiones')} /></Field><Field label="Costo total estimado (S/) *" error={errors.costo?.message}><Input type="number" step="0.01" min="0.01" {...register('costo')} /></Field></div><ErrorBox error={save.error} /><div className="actions"><Link className="btn secondary" to={`/pacientes/${id}?tab=Tratamientos`}>Cancelar</Link><Button disabled={save.isPending}>{save.isPending ? 'Creando…' : 'Crear plan'}</Button></div></form></>;
}
