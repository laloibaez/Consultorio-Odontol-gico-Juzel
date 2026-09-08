import { Router } from 'express';
import * as controller from './controller.js';
export const router = Router();
router.get('/agenda/hoy', controller.todayHandler);
router.get('/agenda', controller.listHandler);
router.get('/agenda/validar-solapamiento', controller.validateHandler);
router.post('/citas', controller.createHandler);
router.put('/citas/:id', controller.rescheduleHandler);
router.patch('/citas/:id', controller.setStateHandler);
