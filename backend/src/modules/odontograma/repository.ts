import { db } from '../../config/db.js';

// Adaptador de persistencia Prisma para esta funcionalidad.
export const repository = {
  odontogramaVersion: db.odontogramaVersion,
  odontograma: db.odontograma
};
