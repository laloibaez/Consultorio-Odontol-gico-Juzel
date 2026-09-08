import { action } from '../../utils/controller.js';
import { odontogramService } from './service.js';
export const versionsHandler = action(req => odontogramService.list(req.params.id));
export const getVersionHandler = action(req => odontogramService.get(req.params.id, req.params.version));
export const createVersionHandler = action(req => odontogramService.create(req.params.id, req.body));
