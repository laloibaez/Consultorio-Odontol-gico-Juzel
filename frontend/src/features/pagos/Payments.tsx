import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quotaFormSchema, paymentFormSchema } from '../../shared/utils/schemas';
import { useData, useSave } from '../../shared/hooks/query';
import { Treatment, Quota } from '../../shared/types';
import { Input, Button, Field, Modal, Table, ErrorBox, Loading, Empty, Badge } from '../../shared/components/ui';
import { soles, fecha, today } from '../../shared/utils/format';
export function Payments({
  id
}: {
  id: string;
}) {
  const q = useData<{
    saldo: number;
    planes: Treatment[];
    cuotas: Quota[];
  }>(`/pacientes/${id}/pagos`);
  const [params] = useSearchParams();
  const [quotas, setQuotas] = useState(!!params.get('plan')),
    [pay, setPay] = useState<Quota | null>(null);
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error}/>;
  return <><div className="card"><div className="page-head"><div><p className="muted">Saldo total pendiente</p><h1 className={q.data?.saldo ? 'balance-pending' : 'success'}>{soles(q.data?.saldo)}</h1></div><Button disabled={!q.data?.planes.some(t => !t.cuotas.length)} onClick={() => setQuotas(true)}>+ Generar plan de cuotas</Button></div><p className="muted small">El saldo incluye tratamientos que aún no tienen cuotas. Los pagos parciales conservan el importe pendiente.</p><ErrorBox error={q.error} />{q.data?.cuotas.length ? <Table headers={['Cuota', 'Tratamiento', 'Monto', 'Pendiente', 'Vencimiento', 'Estado', '']}>{q.data.cuotas.map(c => <tr key={c.id}><td>{c.numero}</td><td>{c.tratamiento}</td><td>{soles(c.monto)}</td><td>{soles(c.restante)}</td><td>{fecha(c.vencimiento)}</td><td><Badge>{c.estado}{c.dias ? ` (${c.dias} días)` : ''}</Badge></td><td>{c.restante > 0 && <Button secondary onClick={() => setPay(c)}>Registrar pago</Button>}</td></tr>)}</Table> : <Empty>No hay cuotas. Crea un tratamiento y genera su plan de pagos.</Empty>}</div><div className="card"><h2>Historial de pagos</h2>{q.data?.planes.some(t => t.pagos.length) ? <Table headers={['Fecha', 'Tratamiento', 'Medio', 'Monto']}>{q.data.planes.flatMap(t => t.pagos.map(p => <tr key={p.id}><td>{fecha(p.fecha)}</td><td>{t.nombre}</td><td>{p.medio}</td><td>{soles(p.monto)}</td></tr>))}</Table> : <Empty />}</div>{quotas && q.data && <QuotaModal plans={q.data.planes.filter(t => !t.cuotas.length)} selected={params.get('plan') || ''} onClose={() => setQuotas(false)} />} {pay && <PaymentModal patientId={id} quota={pay} onClose={() => setPay(null)} />}</>;
}
function QuotaModal({
  plans,
  selected,
  onClose
}: {
  plans: Treatment[];
  selected: string;
  onClose: () => void;
}) {
  const [plan, setPlan] = useState(selected || plans[0]?.id || '');
  const save = useSave(`/tratamientos/${plan}/cuotas`, 'post', onClose),
    {
      register,
      handleSubmit,
      formState: {errors},
      watch
    } = useForm({
      resolver: zodResolver(quotaFormSchema),
      defaultValues: {
        numero: 3,
        frecuencia: 'mensual',
        inicio: today()
      }
    });
  return <Modal title="Generar plan de cuotas" onClose={onClose}><form onSubmit={handleSubmit(v => save.mutate(v))}><Field label="Tratamiento"><select required value={plan} onChange={e => setPlan(e.target.value)}><option value="">Selecciona</option>{plans.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select></Field><p>Total: <strong>{soles(plans.find(t => t.id === plan)?.costo)}</strong></p><Field label="Número de cuotas"><Input required type="number" min="1" max="60" {...register('numero')} /></Field><Field label="Frecuencia"><select {...register('frecuencia')}><option value="mensual">Mensual</option><option value="quincenal">Quincenal</option></select></Field><Field label="Primer vencimiento"><Input type="date" required {...register('inicio')} /></Field><p className="notice">{watch('numero')} cuotas de aproximadamente {soles(Number(plans.find(t => t.id === plan)?.costo || 0) / Number(watch('numero') || 1))}. El ajuste de céntimos se distribuye entre las primeras cuotas.</p><ErrorBox error={save.error || Object.values(errors).map(e=>e.message).filter(Boolean).join('. ')} /><div className="actions"><Button type="button" secondary onClick={onClose}>Cancelar</Button><Button disabled={save.isPending || !plan}>Generar cuotas</Button></div></form></Modal>;
}
function PaymentModal({
  patientId,
  quota,
  onClose
}: {
  patientId: string;
  quota: Quota;
  onClose: () => void;
}) {
  const save = useSave(`/pacientes/${patientId}/pagos`, 'post', onClose),
    {
      register,
      handleSubmit,
      formState: {errors}
    } = useForm({
      resolver: zodResolver(paymentFormSchema),
      defaultValues: {
        monto: quota.restante,
        fecha: today(),
        medio: 'Efectivo'
      }
    });
  return <Modal title={'Registrar pago · Cuota ' + quota.numero} onClose={onClose}><form onSubmit={handleSubmit(v => save.mutate({
      ...v,
      cuotaId: quota.id
    }))}><Field label="Monto (S/)"><Input required type="number" min="0.01" step="0.01" max={quota.restante} {...register('monto')} /></Field><Field label="Fecha"><Input required type="date" max={today()} {...register('fecha')} /></Field><Field label="Medio de pago"><select {...register('medio')}><option>Efectivo</option><option>Transferencia</option><option>Yape-Plin</option></select></Field><ErrorBox error={save.error || Object.values(errors).map(e=>e.message).filter(Boolean).join('. ')} /><div className="actions"><Button secondary type="button" onClick={onClose}>Cancelar</Button><Button disabled={save.isPending}>{save.isPending ? 'Confirmando…' : 'Confirmar pago'}</Button></div></form></Modal>;
}
