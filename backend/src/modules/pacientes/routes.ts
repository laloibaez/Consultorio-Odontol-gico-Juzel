import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from './controller.js';
export const router = Router();
router.post('/pacientes/consultar-dni',rateLimit({windowMs:60000,limit:15,standardHeaders:true,legacyHeaders:false,message:{data:null,error:429,message:'Espera un momento antes de consultar otro DNI.'}}),controller.dniHandler);
router.get('/pacientes', controller.searchHandler);
router.post('/pacientes', controller.createHandler);
router.get('/pacientes/:id/resumen', controller.summaryHandler);
router.delete('/pacientes/:id', controller.archiveHandler);
