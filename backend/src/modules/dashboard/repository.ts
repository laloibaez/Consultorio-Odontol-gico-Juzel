import { db } from '../../config/db.js';

// Adaptador de persistencia Prisma para esta funcionalidad.
export const repository = {
  cita: db.cita,
  pago: db.pago,
  planTratamiento: db.planTratamiento
};
