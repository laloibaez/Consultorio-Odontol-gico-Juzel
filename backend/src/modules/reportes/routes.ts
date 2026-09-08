import { Router } from 'express';
import * as controller from './controller.js';
export const router = Router();
router.get('/reportes', controller.previewHandler);
router.post('/reportes/generar', controller.exportReportHandler);
