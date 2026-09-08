import { Router } from 'express';
import * as controller from './controller.js';
export const router = Router();
router.get('/pacientes/:id/pagos', controller.listHandler);
router.post('/pacientes/:id/pagos', controller.payHandler);
router.post('/tratamientos/:id/cuotas', controller.createQuotasHandler);
