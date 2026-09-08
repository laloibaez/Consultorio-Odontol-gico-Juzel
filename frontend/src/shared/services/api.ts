import axios from 'axios';
export const api = axios.create({
  baseURL: (import.meta as unknown as {
    env: Record<string, string>;
  }).env.VITE_API_URL || 'http://localhost:4000/api/v1',
  timeout: 20000
});
api.interceptors.request.use(c => {
  const token = localStorage.getItem('juzel-token');
  if (token) c.headers.Authorization = `Bearer ${token}`;
  return c;
});
api.interceptors.response.use(r => r, e => {
  if (e.response?.status === 401 && !e.config.url.includes('/auth/login')) window.dispatchEvent(new Event('session-expired'));
  return Promise.reject(e);
});
export const get = <T,>(path: string) => api.get<{
  data: T;
}>(path).then(r => r.data.data);
export const errorText = (e: unknown) => {
  if (axios.isAxiosError(e)) {
    const err = e.response?.data;
    const fields = err?.error?.fieldErrors;
    return fields ? Object.values(fields).flat().join('. ') : err?.message || 'No se pudo conectar con el servidor.';
  }
  return 'No se pudo completar la operación.';
};
export async function download(path: string, name: string, body?: unknown) {
  try {
    const r = body ? await api.post(path, body, {
      responseType: 'blob'
    }) : await api.get(path, {
      responseType: 'blob'
    });
    const url = URL.createObjectURL(r.data),
      a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
      try {
        e.response.data = JSON.parse(await e.response.data.text());
      } catch {}
    }
    throw e;
  }
}
