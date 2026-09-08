import { repository as db } from './repository.js';
import { requirePatient } from '../pacientes/repository.js';
import { odontogramSchema } from '../../utils/schemas.js';
import { AppError } from '../../utils/domain.js';
export const odontogramService = {
  list: async (id: string) => {
    const p = await requirePatient(id);
    return db.odontogramaVersion.findMany({
      where: {
        odontograma: {
          historiaId: p.historia!.id
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        createdAt: true
      }
    });
  },
  get: async (id: string, version: string) => {
    const p = await requirePatient(id);
    const v = await db.odontogramaVersion.findFirst({
      where: {
        odontograma: {
          historiaId: p.historia!.id
        },
        ...(version === 'actual' ? {} : {
          id: version
        })
      },
      include: {
        piezas: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    if (!v && version !== 'actual') throw new AppError(404, 'Versión no encontrada');
    return v;
  },
  create: async (id: string, body: unknown) => {
    const p = await requirePatient(id),
      d = odontogramSchema.parse(body);
    const o = await db.odontograma.findUniqueOrThrow({
      where: {
        historiaId: p.historia!.id
      }
    });
    return db.odontogramaVersion.create({
      data: {
        odontogramaId: o.id,
        piezas: {
          create: d.piezas
        }
      },
      include: {
        piezas: true
      }
    });
  }
};
