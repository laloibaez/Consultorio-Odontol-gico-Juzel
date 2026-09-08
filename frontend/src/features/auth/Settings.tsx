import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSave } from '../../shared/hooks/query';
import { Input, Button, Field, ErrorBox } from '../../shared/components/ui';
import { useAuth } from './Auth';
const schema = z.object({
  actual: z.string().min(1),
  nueva: z.string().min(12, 'Usa al menos 12 caracteres').max(72),
  confirmacion: z.string()
}).refine(d => d.nueva === d.confirmacion, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmacion']
});
export function Settings() {
  const {
    logout
  } = useAuth();
  const save = useSave('/auth/password', 'put', () => logout('Contraseña actualizada. Inicia sesión nuevamente.'));
  const {
    register,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema)
  });
  return <><h1>Configuración</h1><p className="muted">Perfil y seguridad de tu cuenta</p><form className="card narrow" onSubmit={handleSubmit(v => save.mutate(v))}><h2>Cambiar contraseña</h2>{(['actual', 'nueva', 'confirmacion'] as const).map((key, i) => <Field key={key} label={['Contraseña actual', 'Nueva contraseña', 'Confirmar nueva contraseña'][i]} error={errors[key]?.message}><Input type="password" autoComplete={i ? 'new-password' : 'current-password'} {...register(key)} /></Field>)}<ErrorBox error={save.error} /><Button disabled={save.isPending}>{save.isPending ? 'Actualizando…' : 'Actualizar contraseña'}</Button></form><Button secondary onClick={() => logout()}>Cerrar sesión</Button></>;
}
