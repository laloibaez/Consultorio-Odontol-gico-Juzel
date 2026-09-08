import { action } from '../../utils/controller.js';
import { clinicalService } from './service.js';
import { clinicalPdf } from '../../utils/exports.js';
export const getAnamnesisHandler = action(req => clinicalService.anamnesis(req.params.id));
export const saveAnamnesisHandler = action(req => clinicalService.saveAnamnesis(req.params.id, req.body));
export const listAtencionesHandler = action(req => clinicalService.atenciones(req.params.id));
export const createAttentionHandler = action(req => clinicalService.createAttention(req.params.id, req.body));
export const exportPdfHandler = action((req, res) => clinicalPdf(req.params.id, res));
