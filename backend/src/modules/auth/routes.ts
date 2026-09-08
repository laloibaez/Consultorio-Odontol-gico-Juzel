import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { auth } from '../../middlewares/auth.js';
import * as controller from './controller.js';
export const router = Router();
router.post('/auth/login', rateLimit({
  windowMs: 15 * 60000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: 429,
    message: 'Demasiados intentos. Intenta en 15 minutos.'
  }
}), controller.loginHandler);
router.post('/auth/refresh', auth, controller.refreshHandler);
router.put('/auth/password', auth, controller.passwordHandler);
