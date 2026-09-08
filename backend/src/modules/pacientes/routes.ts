import { Router } from 'express';
import * as controller from './controller.js';
export const router = Router();
router.get('/pacientes', controller.searchHandler);
router.post('/pacientes', controller.createHandler);
router.get('/pacientes/:id/resumen', controller.summaryHandler);
router.delete('/pacientes/:id', controller.archiveHandler);
