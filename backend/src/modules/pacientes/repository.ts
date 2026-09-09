import { db } from '../../config/db.js';
import { isLocalDatabase } from '../../config/local-mode.js';
import { AppError } from '../../utils/domain.js';
export const summaryInclude = {
  historia: {
    include: {
      antecedentes: true,
      alergias: true,
      atenciones: {
        orderBy: {
          fecha: 'desc' as const
        },
        take: 1
      }
    }
  }
};
export async function requirePatient(id: string) {
  const p = await db.paciente.findFirst({
    where: {
      id,
      deletedAt: null
    },
    include: summaryInclude
  });
  if (!p || !p.historia || p.historia.deletedAt) throw new AppError(404, 'Paciente no encontrado');
  return p;
}
export const patientRepository = {
  search: async (query: string) => {
    if (isLocalDatabase) {
      const patients = await db.paciente.findMany({where:{deletedAt:null},include:summaryInclude,orderBy:{apellidos:'asc'}});
      const normalize = (v:string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      const words=normalize(query.trim()).split(/\s+/);
      return patients.filter(p=>words.every(word=>normalize(`${p.nombres} ${p.apellidos} ${p.documento} ${p.telefono}`).includes(word))).slice(0,100);
    }
    return db.paciente.findMany({
    where: {
      deletedAt: null,
      OR: [{
        AND: query.trim().split(/\s+/).map(word => ({
          OR: [{
            nombres: {
              contains: word,
              mode: 'insensitive' as const
            }
          }, {
            apellidos: {
              contains: word,
              mode: 'insensitive' as const
            }
          }]
        }))
      }, {
        documento: {
          contains: query
        }
      }, {
        telefono: {
          contains: query
        }
      }]
    },
    include: summaryInclude,
    orderBy: {
      apellidos: 'asc'
    },
    take: 100
  });
  }
};
export const patientStore = {
  paciente: db.paciente,
  historiaClinica: db.historiaClinica,
  cita: db.cita,
  $transaction: db.$transaction.bind(db) as typeof db.$transaction
};
