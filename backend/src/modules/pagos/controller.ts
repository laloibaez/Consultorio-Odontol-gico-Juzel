import { action } from '../../utils/controller.js';
import { paymentService } from './service.js';
export const listHandler = action(req => paymentService.list(req.params.id));
export const payHandler = action(req => paymentService.pay(req.params.id, req.body));
export const createQuotasHandler = action(req => paymentService.quotas(req.params.id, req.body));
