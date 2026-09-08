import { action } from '../../utils/controller.js';
import { patientService } from './service.js';
export const searchHandler = action(req => patientService.search(String(req.query.query || '')));
export const createHandler = action(req => patientService.create(req.body));
export const summaryHandler = action(req => patientService.summary(req.params.id));
export const archiveHandler = action(req => patientService.archive(req.params.id));
