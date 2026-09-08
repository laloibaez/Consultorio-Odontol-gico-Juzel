import { useEffect, useState } from 'react';
import { useData, useSave } from '../../shared/hooks/query';
import { Button, Field, Modal, Loading, ErrorBox } from '../../shared/components/ui';
import { FDI, fecha } from '../../shared/utils/format';
const surfaces = ['oclusal', 'mesial', 'distal', 'vestibular', 'lingual'] as const;
const findings = ['Sano', 'Caries', 'Obturación', 'Ausente', 'Corona'];
type Tooth = {
  numero: number;
  superficies: Record<string, string>;
};
const initial = () => FDI.map(numero => ({
  numero,
  superficies: Object.fromEntries(surfaces.map(s => [s, 'Sano']))
}));
const colors: Record<string, string> = {
  Sano: '#FFFFFF',
  Caries: '#1F2937',
  'Obturación': '#7FD8C4',
  Ausente: '#CBD5D1',
  Corona: '#3FA98D'
};
const paths = ['M18 18H42V42H18Z', 'M0 0L18 18V42L0 60Z', 'M60 0L42 18V42L60 60Z', 'M0 0H60L42 18H18Z', 'M0 60H60L42 42H18Z'];
export function Odontogram({
  id
}: {
  id: string;
}) {
  const base = `/pacientes/${id}/odontograma`,
    versions = useData<{
      id: string;
      createdAt: string;
    }[]>(base + '/versiones');
  const [version, setVersion] = useState('actual'),
    [teeth, setTeeth] = useState<Tooth[]>(initial),
    [editing, setEditing] = useState<number | null>(null),
    [message, setMessage] = useState('');
  const q = useData<{
      id: string;
      piezas: Tooth[];
    } | null>(base + '/' + version),
    save = useSave(base, 'post', () => setMessage('Se guardó una nueva versión del odontograma'));
  useEffect(() => {
    if (q.isSuccess) setTeeth(q.data?.piezas || initial());
  }, [q.data, q.isSuccess]);
  const readonly = version !== 'actual';
  return <div className="card"><div className="page-head"><h2>Odontograma</h2><Field label="Ver versión"><select value={version} onChange={e => {
          setVersion(e.target.value);
          setMessage('');
        }}><option value="actual">Actual · editable</option>{versions.data?.map((v, i) => <option key={v.id} value={v.id}>Versión {versions.data!.length - i} · {fecha(v.createdAt)} {new Date(v.createdAt).toLocaleTimeString('es-PE', {
              timeZone: 'America/Lima'
            })}</option>)}</select></Field></div>{readonly && <p className="notice">Estás viendo una versión anterior · Solo lectura</p>}<p className="muted">Selecciona una pieza para registrar hallazgos por superficie. Notación FDI.</p><div className="legend">{findings.map(f => <span key={f}><i style={{
          background: colors[f]
        }} />{f}</span>)}</div>{q.isLoading ? <Loading /> : <div className="odontogram">{[FDI.slice(0, 16), FDI.slice(16)].map((row, i) => <div key={i}><p className="arc-label">{i ? 'ARCADA INFERIOR' : 'ARCADA SUPERIOR'}</p><div className="arc">{row.map(n => {
            const tooth = teeth.find(t => t.numero === n);
            return <button key={n} className="tooth" aria-label={'Pieza ' + n} onClick={() => setEditing(n)}><span>{n}</span><svg viewBox="0 0 60 60" aria-hidden="true">{surfaces.map((s, j) => <path key={s} d={paths[j]} fill={colors[tooth?.superficies[s] || 'Sano']} stroke="#95ABA4" strokeWidth="1.4" />)}</svg></button>;
          })}</div></div>)}</div>}<ErrorBox error={q.error || versions.error || save.error} />{message && <p role="status" className="success">{message}</p>}<div className="actions"><Button disabled={readonly || save.isPending || q.isLoading || !!q.error} onClick={() => save.mutate({
        piezas: teeth
      })}>{save.isPending ? 'Guardando…' : 'Guardar cambios'}</Button></div>{editing && <Modal title={'Pieza ' + editing + (readonly ? ' · Solo lectura' : '')} onClose={() => setEditing(null)}>{surfaces.map(s => <Field key={s} label={s === 'lingual' ? 'Palatino / lingual' : s.charAt(0).toUpperCase() + s.slice(1)}><select disabled={readonly} value={teeth.find(t => t.numero === editing)?.superficies[s]} onChange={e => setTeeth(teeth.map(t => t.numero === editing ? {
          ...t,
          superficies: {
            ...t.superficies,
            [s]: e.target.value
          }
        } : t))}>{findings.map(f => <option key={f}>{f}</option>)}</select></Field>)}<Button onClick={() => setEditing(null)}>Listo</Button></Modal>}</div>;
}
