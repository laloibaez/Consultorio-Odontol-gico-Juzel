import { Router } from 'express';
import * as controller from './controller.js';
export const router = Router();
router.get('/dashboard/resumen', controller.summaryHandler);
