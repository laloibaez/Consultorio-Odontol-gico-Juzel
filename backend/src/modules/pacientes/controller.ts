import { action } from '../../utils/controller.js';
import { patientService } from './service.js';
import {lookupDni} from './dni.js';
import {z} from 'zod';
export const dniHandler=action(req=>lookupDni(z.object({dni:z.string().trim().regex(/^\d{8}$/,'El DNI debe contener exactamente 8 dígitos.')}).parse(req.body).dni));
export const searchHandler = action(req => patientService.search(String(req.query.query || '')));
export const createHandler = action(req => patientService.create(req.body));
export const summaryHandler = action(req => patientService.summary(req.params.id));
export const archiveHandler = action(req => patientService.archive(req.params.id));
