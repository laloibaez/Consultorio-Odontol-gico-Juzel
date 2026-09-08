import { db } from '../../config/db.js';

// Adaptador de persistencia Prisma para esta funcionalidad.
export const repository = {
  pago: db.pago,
  cita: db.cita,
  paciente: db.paciente,
  planTratamiento: db.planTratamiento
};
