import { db } from '../../config/db.js';

// Adaptador de persistencia Prisma para esta funcionalidad.
export const repository = {
  usuario: db.usuario
};
