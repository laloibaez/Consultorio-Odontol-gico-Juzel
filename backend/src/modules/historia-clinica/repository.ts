import { db } from '../../config/db.js';

// Adaptador de persistencia Prisma para esta funcionalidad.
export const repository = {
  historiaClinica: db.historiaClinica,
  atencion: db.atencion,
  $transaction: db.$transaction.bind(db) as typeof db.$transaction
};
