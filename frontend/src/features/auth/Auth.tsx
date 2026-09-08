import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Activity } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api, errorText } from '../../shared/services/api';
import { Input, Button, Field, ErrorBox } from '../../shared/components/ui';
import { useInactivityTimer } from './useInactivityTimer';
const Ctx = createContext({
  token: '',
  login: (_t: string, _u: string) => {},
  logout: (_reason?: string) => {}
});
export const useAuth = () => useContext(Ctx);
function activeToken() {
  const t = localStorage.getItem('juzel-token') || '';
  try {
    if (JSON.parse(atob(t.split('.')[1])).exp * 1000 > Date.now() && Date.now() - Number(localStorage.getItem('juzel-activity') || 0) < 15 * 60000) return t;
  } catch {}
  localStorage.removeItem('juzel-token');
  return '';
}
export function AuthProvider({
  children
}: {
  children: ReactNode;
}) {
  const [token, set] = useState(activeToken);
  const nav = useNavigate(),
    qc = useQueryClient();
  const login = useCallback((t: string, u: string) => {
    localStorage.setItem('juzel-token', t);
    localStorage.setItem('juzel-user', u);
    localStorage.setItem('juzel-activity', String(Date.now()));
    set(t);
  }, []);
  const logout = useCallback((reason?: string) => {
    localStorage.removeItem('juzel-token');
    localStorage.removeItem('juzel-user');
    localStorage.removeItem('juzel-activity');
    set('');
    qc.clear();
    nav('/login', {
      replace: true,
      state: {
        reason
      }
    });
  }, [nav, qc]);
  useInactivityTimer(token, logout);
  return <Ctx.Provider value={{
    token,
    login,
    logout
  }}>{children}</Ctx.Provider>;
}
export function ProtectedRoute({
  children
}: {
  children: ReactNode;
}) {
  const {
    token
  } = useAuth();
  return token && activeToken() ? <>{children}</> : <Navigate to="/login" replace />;
}
const schema = z.object({
  username: z.string().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña')
});
export function Login() {
  const {
      login,
      token
    } = useAuth(),
    nav = useNavigate(),
    location = useLocation();
  const [show, setShow] = useState(false),
    [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema)
  });
  if (token && activeToken()) return <Navigate to="/dashboard" />;
  return <main className="login"><div className="login-brand"><Activity size={36} /><h1>Juzel<span>CONSULTORIO ODONTOLÓGICO</span></h1></div><div className="card login-card"><span className="eyebrow">TU CONSULTORIO, EN UN SOLO LUGAR</span><h2>Bienvenida de nuevo</h2><p className="muted">Ingresa para continuar con el cuidado de tus pacientes.</p><form onSubmit={handleSubmit(async data => {
        setError('');
        try {
          const r = await api.post('/auth/login', data);
          login(r.data.data.token, r.data.data.user.nombre);
          nav('/dashboard');
        } catch (e) {
          setError(errorText(e));
        }
      })}><Field label="Usuario" error={errors.username?.message}><Input autoComplete="username" {...register('username')} /></Field><Field label="Contraseña" error={errors.password?.message}><div className="password"><Input autoComplete="current-password" type={show ? 'text' : 'password'} {...register('password')} /><button type="button" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></Field><ErrorBox error={error || location.state?.reason} /><Button disabled={isSubmitting}>{isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}</Button><p className="muted small">¿Olvidaste tu contraseña? Contacta al administrador de la instalación.</p></form></div><p className="muted small">Gestión clínica y administrativa · Chiclayo, Perú</p></main>;
}
