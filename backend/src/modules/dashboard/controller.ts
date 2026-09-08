import { action } from '../../utils/controller.js';
import { dashboard } from './service.js';
export const summaryHandler = action(() => dashboard());
