import { Router } from 'express';
import * as controller from './controller.js';
export const router = Router();
router.get('/pacientes/:id/odontograma/versiones', controller.versionsHandler);
router.get('/pacientes/:id/odontograma/:version', controller.getVersionHandler);
router.post('/pacientes/:id/odontograma', controller.createVersionHandler);
