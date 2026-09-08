import { Router } from 'express';
import * as controller from './controller.js';
export const router = Router();
router.get('/pacientes/:id/tratamientos', controller.listHandler);
router.post('/pacientes/:id/tratamientos', controller.createHandler);
router.patch('/tratamientos/:id', controller.setStateHandler);
