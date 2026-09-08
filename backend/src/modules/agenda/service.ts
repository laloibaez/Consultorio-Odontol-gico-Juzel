import { repository as db } from './repository.js';
import { appointmentSchema } from '../../utils/schemas.js';
import { requirePatient } from '../pacientes/repository.js';
import { AppError, checkHours, peruDay } from '../../utils/domain.js';
const bounds = (d: string) => new Date(d + 'T00:00:00-05:00');
export const agendaService = {
  list: async (desde?: string, hasta?: string, pacienteId?: string) => {
    if (pacienteId) await requirePatient(pacienteId);
    const start = bounds(desde || peruDay()),
      end = bounds(hasta || desde || peruDay());
    end.setDate(end.getDate() + 1);
    return db.cita.findMany({
      where: {
        ...(pacienteId ? {
          pacienteId
        } : {}),
        inicio: {
          gte: start,
          lt: end
        },
        paciente: {
          deletedAt: null
        }
      },
      include: {
        paciente: true
      },
      orderBy: {
        inicio: 'asc'
      }
    });
  },
  validate: async (inicio: string, duracion: number, exclude?: string) => {
    const a = new Date(inicio),
      b = new Date(a.getTime() + duracion * 60000);
    if (isNaN(a.getTime()) || !Number.isInteger(duracion) || duracion < 15 || duracion > 300) throw new AppError(400, 'Fecha o duración inválida');
    checkHours(a, b);
    const overlap = await db.cita.findFirst({
      where: {
        estado: {
          not: 'Cancelada'
        },
        inicio: {
          lt: b
        },
        fin: {
          gt: a
        },
        ...(exclude ? {
          id: {
            not: exclude
          }
        } : {})
      }
    });
    return {
      disponible: !overlap
    };
  },
  save: async (body: unknown, id?: string) => {
    const d = appointmentSchema.parse(body);
    await requirePatient(d.pacienteId);
    const inicio = new Date(d.inicio),
      fin = new Date(inicio.getTime() + d.duracion * 60000);
    checkHours(inicio, fin);
    return db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(194826)`;
      if (id) {
        const old = await tx.cita.findUnique({
          where: {
            id
          }
        });
        if (!old || old.estado === 'Cancelada' || old.estado === 'Completada') throw new AppError(409, 'Esta cita no se puede reprogramar');
      }
      const overlap = await tx.cita.findFirst({
        where: {
          estado: {
            not: 'Cancelada'
          },
          inicio: {
            lt: fin
          },
          fin: {
            gt: inicio
          },
          ...(id ? {
            id: {
              not: id
            }
          } : {})
        }
      });
      if (overlap) throw new AppError(409, 'Ya hay una cita en ese horario');
      const data = {
        pacienteId: d.pacienteId,
        inicio,
        fin,
        tipo: d.tipo
      };
      return id ? tx.cita.update({
        where: {
          id
        },
        data
      }) : tx.cita.create({
        data
      });
    });
  },
  state: async (id: string, estado: string) => {
    if (!['Cancelada', 'Completada'].includes(estado)) throw new AppError(400, 'Estado inválido');
    const c = await db.cita.findUnique({
      where: {
        id
      }
    });
    if (!c) throw new AppError(404, 'Cita no encontrada');
    await requirePatient(c.pacienteId);
    if (c.estado !== 'Confirmada') throw new AppError(409, 'La cita ya fue cerrada');
    return db.cita.update({
      where: {
        id
      },
      data: {
        estado
      }
    });
  }
};
