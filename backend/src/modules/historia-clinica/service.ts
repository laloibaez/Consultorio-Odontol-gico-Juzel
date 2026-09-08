import { repository as db } from './repository.js';
import { requirePatient } from '../pacientes/repository.js';
import { anamnesisSchema, attentionSchema } from '../../utils/schemas.js';
import { AppError } from '../../utils/domain.js';
export const clinicalService = {
  anamnesis: async (id: string) => {
    const p = await requirePatient(id);
    return p.historia;
  },
  saveAnamnesis: async (id: string, body: unknown) => {
    const p = await requirePatient(id),
      d = anamnesisSchema.parse(body);
    return db.historiaClinica.update({
      where: {
        id: p.historia!.id
      },
      data: {
        medicacion: d.medicacion,
        derivacionMedico: d.derivacionMedico,
        derivacionMotivo: d.derivacionMotivo,
        antecedentes: {
          deleteMany: {},
          create: d.antecedentes
        },
        alergias: {
          deleteMany: {},
          create: d.alergias.map(nombre => ({
            nombre
          }))
        }
      },
      include: {
        antecedentes: true,
        alergias: true
      }
    });
  },
  atenciones: async (id: string) => {
    const p = await requirePatient(id);
    return db.atencion.findMany({
      where: {
        historiaId: p.historia!.id
      },
      include: {
        sesion: {
          include: {
            tratamiento: true
          }
        }
      },
      orderBy: [{
        fecha: 'desc'
      }, {
        createdAt: 'desc'
      }]
    });
  },
  createAttention: async (id: string, body: unknown) => {
    const p = await requirePatient(id),
      d = attentionSchema.parse(body);
    return db.$transaction(async tx => {
      const {
        sesionId,
        ...data
      } = d;
      let session = sesionId ? await tx.sesion.findUnique({
        where: {
          id: sesionId
        },
        include: {
          tratamiento: true
        }
      }) : null;
      if (sesionId && (!session || session.tratamiento.pacienteId !== id || session.completada || session.tratamiento.estado !== 'En curso')) throw new AppError(409, 'La sesión no está disponible');
      const a = await tx.atencion.create({
        data: {
          ...data,
          fecha: new Date(d.fecha),
          historiaId: p.historia!.id
        }
      });
      if (session) {
        await tx.sesion.update({
          where: {
            id: session.id
          },
          data: {
            completada: true,
            atencionId: a.id
          }
        });
        const pending = await tx.sesion.count({
          where: {
            tratamientoId: session.tratamientoId,
            completada: false
          }
        });
        if (!pending) await tx.planTratamiento.update({
          where: {
            id: session.tratamientoId
          },
          data: {
            estado: 'Finalizado'
          }
        });
      }
      return a;
    }, {
      isolationLevel: 'Serializable'
    });
  }
};
