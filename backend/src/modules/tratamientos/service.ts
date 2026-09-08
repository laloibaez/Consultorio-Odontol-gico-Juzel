import { repository as db } from './repository.js';
import { requirePatient } from '../pacientes/repository.js';
import { treatmentSchema } from '../../utils/schemas.js';
import { AppError } from '../../utils/domain.js';
export const treatmentService = {
  list: async (id: string) => {
    await requirePatient(id);
    return db.planTratamiento.findMany({
      where: {
        pacienteId: id
      },
      include: {
        sesiones: {
          include: {
            atencion: true
          },
          orderBy: {
            numero: 'asc'
          }
        },
        cuotas: {
          include: {
            pagos: true
          }
        },
        pagos: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },
  create: async (id: string, body: unknown) => {
    await requirePatient(id);
    const d = treatmentSchema.parse(body);
    return db.planTratamiento.create({
      data: {
        ...d,
        pacienteId: id,
        sesiones: {
          create: Array.from({
            length: d.totalSesiones
          }, (_, i) => ({
            numero: i + 1
          }))
        }
      }
    });
  },
  state: async (id: string, estado: string) => {
    const t = await db.planTratamiento.findUniqueOrThrow({
      where: {
        id
      }
    });
    await requirePatient(t.pacienteId);
    if (!['En curso', 'Suspendido'].includes(estado) || t.estado === 'Finalizado') throw new AppError(400, 'Estado inválido');
    return db.planTratamiento.update({
      where: {
        id
      },
      data: {
        estado
      }
    });
  }
};
