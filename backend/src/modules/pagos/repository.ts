import { db } from '../../config/db.js';

// Adaptador de persistencia Prisma para esta funcionalidad.
export const repository = {
  planTratamiento: db.planTratamiento,
  $transaction: db.$transaction.bind(db) as typeof db.$transaction
};
