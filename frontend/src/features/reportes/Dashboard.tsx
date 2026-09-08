import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Wallet, ArrowUpRight, Download, Coins } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useData } from '../../shared/hooks/query';
import { Appointment } from '../../shared/types';
import { Button, Badge, Table, Loading, ErrorBox, Empty } from '../../shared/components/ui';
import { soles, hora, fecha, today } from '../../shared/utils/format';
import { ExportModal } from './Reports';
export function Dashboard() {
  const q = useData<{
      citas: number;
      ingresos: number;
      saldo: number;
      meses: {
        mes: string;
        ingresos: number;
      }[];
    }>('/dashboard/resumen'),
    a = useData<Appointment[]>('/agenda/hoy'),
    [exporting, setExporting] = useState(false);
  return <><div className="page-head"><div><span className="eyebrow">RESUMEN DEL CONSULTORIO</span><h1>Un buen día para cuidar sonrisas.</h1><p className="muted">Esto es lo que sucede hoy, {fecha(today())}.</p></div><Button secondary onClick={() => setExporting(true)}><Download size={17} /> Exportar reporte</Button></div><ErrorBox error={q.error} />{q.isLoading ? <Loading /> : <div className="kpis"><Link className="card kpi" to="/agenda"><div className="kpi-top"><span className="icon-box"><CalendarDays size={22} /></span><ArrowUpRight size={18} /></div><p>Citas de hoy</p><strong>{q.data?.citas ?? '—'}</strong><small>Ver tu agenda de hoy →</small></Link><div className="card kpi"><span className="icon-box"><Wallet size={22} /></span><p>Ingresos del mes</p><strong>{q.data ? soles(q.data.ingresos) : '—'}</strong><small>Pagos registrados este mes</small></div><div className="card kpi"><span className="icon-box"><Coins size={22} /></span><p>Saldo pendiente total</p><strong className={(q.data?.saldo||0)>=1000?'balance-pending':''}>{q.data ? soles(q.data.saldo) : '—'}</strong><small>Todos los tratamientos activos y finalizados</small></div></div>}<div className="dashboard-grid"><section className="card"><div className="page-head"><h2>Citas de hoy</h2><Link className="text-link" to="/agenda">Ver agenda →</Link></div><ErrorBox error={a.error} />{a.isLoading ? <Loading /> : a.data?.length ? <Table headers={['Hora', 'Paciente', 'Atención', 'Estado', '']}>{a.data.map(c => <tr key={c.id}><td><strong>{hora(c.inicio)}</strong></td><td>{c.paciente.nombres} {c.paciente.apellidos}</td><td>{c.tipo}</td><td><Badge>{c.estado}</Badge></td><td><Link className="text-link" to={'/pacientes/' + c.pacienteId}>Ver ficha</Link></td></tr>)}</Table> : <Empty>No tienes citas programadas para hoy.<br /><Link className="text-link" to="/agenda">Programar una cita →</Link></Empty>}</section><section className="card"><h2>Ingresos del consultorio</h2><p className="muted small">Últimos 6 meses · Soles (S/)</p><div style={{
          height: 260,
          width: '100%'
        }}><ResponsiveContainer><BarChart data={q.data?.meses || []} margin={{
              left: 0,
              right: 8,
              top: 20,
              bottom: 0
            }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EEEB" /><XAxis dataKey="mes" axisLine={false} tickLine={false} /><YAxis width={50} axisLine={false} tickLine={false} /><Tooltip formatter={v => soles(v)} /><Bar dataKey="ingresos" name="Ingresos" fill="#7FD8C4" radius={[6, 6, 0, 0]} maxBarSize={40} /></BarChart></ResponsiveContainer></div></section></div><div className="care-note"><span className="icon-box"><CalendarDays /></span><div><h3>Todo listo para tu próxima atención</h3><p>Consulta los antecedentes y las alertas médicas antes de iniciar cada procedimiento.</p></div><Link className="text-link" to="/pacientes">Buscar paciente →</Link></div>{exporting && <ExportModal onClose={() => setExporting(false)} />}</>;
}
