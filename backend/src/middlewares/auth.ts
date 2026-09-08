import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { AppError } from '../utils/domain.js';
export const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  return s;
};
export const auth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    if (!token) throw new Error();
    const p = jwt.verify(token, secret()) as {
      sub: string;
      version: number;
    };
    const user = await db.usuario.findUnique({
      where: {
        id: p.sub
      }
    });
    if (!user || user.tokenVersion !== p.version) throw new Error();
    res.locals.user = user;
    next();
  } catch {
    next(new AppError(401, 'Sesión expirada. Inicia sesión nuevamente.'));
  }
};
export const sign = (user: {
  id: string;
  tokenVersion: number;
}) => jwt.sign({
  version: user.tokenVersion
}, secret(), {
  subject: user.id,
  expiresIn: '15m'
});
