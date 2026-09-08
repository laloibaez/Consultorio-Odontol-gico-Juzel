import { action } from '../../utils/controller.js';
import { z } from 'zod';
import { date } from '../../utils/schemas.js';
import { report } from './service.js';
import { exportReport } from '../../utils/exports.js';
const reportSchema = z.object({
  tipo: z.enum(['Ingresos', 'Citas atendidas', 'Pacientes nuevos', 'Saldos pendientes', 'Tratamientos más frecuentes']),
  desde: date,
  hasta: date,
  formato: z.enum(['pdf', 'excel']).optional()
});
export const previewHandler = action(req => {
  const d = reportSchema.parse(req.query);
  return report(d.tipo, d.desde, d.hasta);
});
export const exportReportHandler = action(async (req, res) => {
  const d = reportSchema.parse(req.body);
  return exportReport(res, d.formato || 'pdf', d.tipo, await report(d.tipo, d.desde, d.hasta), d.desde, d.hasta);
});
