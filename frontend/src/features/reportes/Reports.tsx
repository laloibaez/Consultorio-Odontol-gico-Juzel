import { useState } from 'react';
import { useData } from '../../shared/hooks/query';
import { Input, Button, Field, Modal, Table, ErrorBox, Loading, Empty } from '../../shared/components/ui';
import { download } from '../../shared/services/api';
import { today, fecha, soles } from '../../shared/utils/format';
export const reportTypes = ['Ingresos', 'Citas atendidas', 'Pacientes nuevos', 'Saldos pendientes', 'Tratamientos más frecuentes'];
export function ReportContent() {
  const [tipo, setTipo] = useState('Ingresos'),
    [desde, setDesde] = useState(today().slice(0, 7) + '-01'),
    [hasta, setHasta] = useState(today()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  const q = useData<Record<string, string | number>[]>(`/reportes?tipo=${encodeURIComponent(tipo)}&desde=${desde}&hasta=${hasta}`);
  const exportFile = async (formato: string) => {
    setBusy(true);
    setError(null);
    try {
      await download('/reportes/generar', 'reporte-juzel.' + (formato === 'excel' ? 'xlsx' : 'pdf'), {
        tipo,
        desde,
        hasta,
        formato
      });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return <><div className="report-filters"><Field label="Tipo de reporte"><select value={tipo} onChange={e => setTipo(e.target.value)}>{reportTypes.map(t => <option key={t}>{t}</option>)}</select></Field><Field label="Desde"><Input type="date" value={desde} onChange={e => setDesde(e.target.value)} /></Field><Field label="Hasta"><Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></Field></div>{tipo === 'Saldos pendientes' && <p className="muted small">Saldo actual de tratamientos creados dentro del rango seleccionado.</p>}<div className="actions"><Button secondary disabled={busy || q.isFetching || !!q.error} onClick={() => exportFile('pdf')}>{busy ? 'Generando…' : 'Exportar PDF'}</Button><Button disabled={busy || q.isFetching || !!q.error} onClick={() => exportFile('excel')}>Exportar Excel</Button></div><ErrorBox error={q.error || error} />{q.isLoading ? <Loading /> : q.data?.length ? <Table headers={Object.keys(q.data[0])}>{q.data.map((r, i) => <tr key={i}>{Object.entries(r).map(([k, v]) => <td key={k}>{k.includes('(S/)') ? soles(v) : k === 'Fecha' && String(v).match(/^\d{4}-/) ? fecha(String(v)) : v}</td>)}</tr>)}</Table> : <Empty>No hay datos en este período.</Empty>}</>;
}
export function Reports() {
  return <><h1>Reportes e indicadores</h1><p className="muted">Información clara para las decisiones del consultorio.</p><div className="card"><ReportContent /></div></>;
}
export function ExportModal({
  onClose
}: {
  onClose: () => void;
}) {
  return <Modal title="Exportar reporte" onClose={onClose}><ReportContent /></Modal>;
}
