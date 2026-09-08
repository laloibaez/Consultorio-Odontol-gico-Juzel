import bcrypt from 'bcrypt';
import { z } from 'zod';
import { repository as db } from './repository.js';
import { sign } from '../../middlewares/auth.js';
import { AppError } from '../../utils/domain.js';
const dummy = bcrypt.hashSync('dummy-password-only-for-timing', 12);
export const authService = {
  login: async (body: unknown) => {
    const d = z.object({
      username: z.string().min(1).max(100),
      password: z.string().min(1).max(72)
    }).parse(body);
    const u = await db.usuario.findUnique({
      where: {
        username: d.username
      }
    });
    const valid = await bcrypt.compare(d.password, u?.password ?? dummy);
    if (!u || !valid) throw new AppError(401, 'Usuario o contraseña incorrectos');
    return {
      token: sign(u),
      user: {
        nombre: u.nombre,
        username: u.username
      }
    };
  },
  password: async (id: string, body: unknown) => {
    const d = z.object({
      actual: z.string(),
      nueva: z.string().min(12, 'Usa al menos 12 caracteres').max(72),
      confirmacion: z.string()
    }).refine(v => v.nueva === v.confirmacion, 'Las contraseñas no coinciden').parse(body);
    const u = await db.usuario.findUniqueOrThrow({
      where: {
        id
      }
    });
    if (!(await bcrypt.compare(d.actual, u.password))) throw new AppError(400, 'La contraseña actual es incorrecta');
    await db.usuario.update({
      where: {
        id
      },
      data: {
        password: await bcrypt.hash(d.nueva, 12),
        tokenVersion: {
          increment: 1
        }
      }
    });
    return null;
  }
};
