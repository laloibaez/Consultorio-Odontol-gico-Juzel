import { action } from '../../utils/controller.js';
import { treatmentService } from './service.js';
export const listHandler = action(req => treatmentService.list(req.params.id));
export const createHandler = action(req => treatmentService.create(req.params.id, req.body));
export const setStateHandler = action(req => treatmentService.state(req.params.id, req.body.estado));
