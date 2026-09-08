export class AppError extends Error {
  constructor(public status: number, message: string, public details: unknown = null) {
    super(message);
  }
}
export const soles = (n: unknown) => `S/ ${Number(n).toFixed(2)}`;
export const peruDay = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());
export function checkHours(inicio: Date, fin: Date) {
  const local = new Date(inicio.getTime() - 5 * 3600000),
    end = new Date(fin.getTime() - 5 * 3600000);
  const a = local.getUTCHours() * 60 + local.getUTCMinutes(),
    b = end.getUTCHours() * 60 + end.getUTCMinutes();
  if (local.toISOString().slice(0, 10) !== end.toISOString().slice(0, 10) || !(a >= 540 && b <= 780 || a >= 900 && b <= 1200) || b <= a) throw new AppError(400, 'Elige un horario entre 09:00–13:00 o 15:00–20:00.');
}
export function installmentAmounts(total: number, count: number) {
  const cents = Math.round(total * 100),
    base = Math.floor(cents / count);
  return Array.from({
    length: count
  }, (_, i) => (base + (i < cents % count ? 1 : 0)) / 100);
}
export function dueDate(start: string, index: number, frequency: string) {
  const d = new Date(start + 'T00:00:00Z');
  if (frequency === 'quincenal') d.setUTCDate(d.getUTCDate() + 15 * index);else {
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + index);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
  }
  return d;
}
