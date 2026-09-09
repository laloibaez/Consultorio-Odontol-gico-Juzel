import { randomUUID } from 'node:crypto';
import { isLocalDatabase } from '../../config/local-mode.js';
import { patientStore as db } from './repository.js';
import { patientSchema } from '../../utils/schemas.js';
import { AppError } from '../../utils/domain.js';
import { patientRepository, requirePatient } from './repository.js';
export const patientService = {
  search: patientRepository.search,
  summary: requirePatient,
  create: async (body: unknown) => {
    const data = patientSchema.parse(body);
    const exists = await db.paciente.findUnique({
      where: {
        documento: data.documento
      }
    });
    if (exists) throw new AppError(409, exists.deletedAt ? 'El documento pertenece a una historia archivada' : 'Este documento ya está registrado', {
      existingId: exists.deletedAt ? null : exists.id
    });
    return db.$transaction(async tx => {
      const localNumber = isLocalDatabase
        ? ((await tx.historiaClinica.aggregate({_max:{correlativo:true}}))._max.correlativo || 0) + 1
        : undefined;
      const p = await tx.paciente.create({
        data: {
          ...data,
          nacimiento: new Date(data.nacimiento),
          historia: {
            create: {
              numero: randomUUID(),
              ...(isLocalDatabase ? {correlativo:localNumber!} : {})
            }
          }
        },
        include: {
          historia: true
        }
      });
      const numero = `HC-${new Date().getFullYear()}-${String(p.historia!.correlativo).padStart(4, '0')}`;
      await tx.historiaClinica.update({
        where: {
          id: p.historia!.id
        },
        data: {
          numero,
          odontograma: {
            create: {}
          }
        }
      });
      return {
        ...p,
        historia: {
          ...p.historia,
          numero
        }
      };
    });
  },
  archive: async (id: string) => {
    await requirePatient(id);
    const upcoming = await db.cita.count({where:{pacienteId:id,estado:'Confirmada',fin:{gte:new Date()}}});
    if(upcoming) throw new AppError(409,'Cancela las próximas citas de este paciente antes de archivar su historia.');
    return db.$transaction([db.paciente.update({
      where: {
        id
      },
      data: {
        deletedAt: new Date()
      }
    }), db.historiaClinica.update({
      where: {
        pacienteId: id
      },
      data: {
        deletedAt: new Date()
      }
    })]);
  }
};
