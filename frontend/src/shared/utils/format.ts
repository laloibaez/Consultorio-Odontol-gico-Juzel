export const soles = (n: unknown) => new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN'
}).format(Number(n || 0));
export const fecha = (s: string) => new Intl.DateTimeFormat('es-PE', {
  timeZone: 'UTC',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}).format(new Date(s));
export const hora = (s: string) => new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}).format(new Date(s));
export const today = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());
export const localDate = (s: string) => new Date(new Date(s).getTime() - 5 * 3600000).toISOString().slice(0, 10);
export const age = (s: string) => {
  const d = new Date(s),
    now = new Date(today());
  return now.getUTCFullYear() - d.getUTCFullYear() - (now.getUTCMonth() < d.getUTCMonth() || now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate() ? 1 : 0);
};
export const FDI = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
