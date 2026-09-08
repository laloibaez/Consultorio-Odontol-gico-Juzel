import { ButtonHTMLAttributes, InputHTMLAttributes, forwardRef, ReactNode, useEffect, useRef } from 'react';
import { X, AlertTriangle, LoaderCircle } from 'lucide-react';
import { errorText } from '../services/api';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props,ref)=><input {...props} ref={ref}/>);
Input.displayName='Input';
export function Button({
  secondary = false,
  children,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  secondary?: boolean;
}) {
  return <button {...p} className={`btn ${secondary ? 'secondary' : ''} ${p.className || ''}`}>{children}</button>;
}
export function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return <label className="field"><span>{label}</span>{children}{error && <small className="error" role="alert">{error}</small>}</label>;
}
export function Badge({
  children
}: {
  children: ReactNode;
}) {
  return <span className="badge">{children}</span>;
}
export function ErrorBox({
  error
}: {
  error: unknown;
}) {
  return error ? <p className="error-box" role="alert">{typeof error === 'string' ? error : errorText(error)}</p> : null;
}
export function Loading() {
  return <div className="loading" role="status"><LoaderCircle className="spin" size={20} /> Cargando…</div>;
}
export function Empty({
  children = 'Aún no hay registros.'
}: {
  children?: ReactNode;
}) {
  return <div className="empty">{children}</div>;
}
export function Table({
  headers,
  children
}: {
  headers: string[];
  children: ReactNode;
}) {
  return <div className="table-wrap"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
export function Modal({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return <dialog ref={ref} onCancel={onClose} aria-label={title}><div className="modal-head"><h2>{title}</h2><button aria-label="Cerrar" onClick={onClose}><X /></button></div>{children}</dialog>;
}
export function MedicalAlert({
  allergies,
  conditions
}: {
  allergies: string[];
  conditions: string[];
}) {
  return allergies.length || conditions.length ? <div className="medical-alert" role="alert"><AlertTriangle size={24} /><div><strong>Alerta médica</strong>{allergies.length > 0 && <p>Alergias: {allergies.join(', ')}</p>}{conditions.length > 0 && <p>Antecedente no controlado: {conditions.join(', ')}</p>}</div></div> : null;
}
