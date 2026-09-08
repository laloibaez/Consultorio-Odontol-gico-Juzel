import { Router } from 'express';
import * as controller from './controller.js';
export const router = Router();
router.get('/pacientes/:id/anamnesis', controller.getAnamnesisHandler);
router.put('/pacientes/:id/anamnesis', controller.saveAnamnesisHandler);
router.get('/pacientes/:id/atenciones', controller.listAtencionesHandler);
router.post('/pacientes/:id/atenciones', controller.createAttentionHandler);
router.get('/pacientes/:id/historia-clinica/pdf', controller.exportPdfHandler);
