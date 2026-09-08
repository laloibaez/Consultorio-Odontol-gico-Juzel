import { action } from '../../utils/controller.js';
import { sign } from '../../middlewares/auth.js';
import { authService } from './service.js';
export const loginHandler = action(req => authService.login(req.body));
export const refreshHandler = action(async (_req, res) => ({
  token: sign(res.locals.user)
}));
export const passwordHandler = action((req, res) => authService.password(res.locals.user.id, req.body));
