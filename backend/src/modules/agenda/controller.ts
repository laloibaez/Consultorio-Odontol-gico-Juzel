import { action } from '../../utils/controller.js';
import { agendaService } from './service.js';
import { date } from '../../utils/schemas.js';
export const todayHandler = action(() => agendaService.list());
export const listHandler = action(req => agendaService.list(req.query.desde ? date.parse(req.query.desde) : undefined, req.query.hasta ? date.parse(req.query.hasta) : undefined, req.query.pacienteId ? String(req.query.pacienteId) : undefined));
export const validateHandler = action(req => agendaService.validate(String(req.query.inicio), Number(req.query.duracion), req.query.exclude ? String(req.query.exclude) : undefined));
export const createHandler = action(req => agendaService.save(req.body));
export const rescheduleHandler = action(req => agendaService.save(req.body, req.params.id));
export const setStateHandler = action(req => agendaService.state(req.params.id, req.body.estado));
