import { db } from '../../config/db.js';

// Adaptador de persistencia Prisma para esta funcionalidad.
export const repository = {
  cita: db.cita,
  $transaction: db.$transaction.bind(db) as typeof db.$transaction
};
