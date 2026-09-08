import { repository as db } from './repository.js';
import { requirePatient } from '../pacientes/repository.js';
import { paymentSchema, quotaSchema } from '../../utils/schemas.js';
import { AppError, dueDate, installmentAmounts, peruDay } from '../../utils/domain.js';
export const paymentService = {
  list: async (id: string) => {
    await requirePatient(id);
    const planes = await db.planTratamiento.findMany({
      where: {
        pacienteId: id
      },
      include: {
        pagos: true,
        cuotas: {
          include: {
            pagos: true
          },
          orderBy: {
            numero: 'asc'
          }
        }
      }
    });
    const today = Date.parse(peruDay());
    return {
      saldo: planes.reduce((a, t) => a + Number(t.costo) - t.pagos.reduce((s, p) => s + Number(p.monto), 0), 0),
      planes,
      cuotas: planes.flatMap(t => t.cuotas.map(c => {
        const restante = Number(c.monto) - c.pagos.reduce((s, p) => s + Number(p.monto), 0),
          dias = Math.max(0, Math.floor((today - c.vencimiento.getTime()) / 86400000));
        return {
          ...c,
          tratamiento: t.nombre,
          restante,
          dias: restante > 0 ? dias : 0,
          estado: restante <= 0 ? 'Pagada' : dias > 0 ? 'Vencida' : 'Pendiente'
        };
      }))
    };
  },
  quotas: async (id: string, body: unknown) => {
    const d = quotaSchema.parse(body);
    return db.$transaction(async tx => {
      const t = await tx.planTratamiento.findUnique({
        where: {
          id
        },
        include: {
          cuotas: true,
          paciente: true
        }
      });
      if (!t || t.paciente.deletedAt) throw new AppError(404, 'Tratamiento no encontrado');
      if (t.cuotas.length) throw new AppError(409, 'Este tratamiento ya tiene cuotas');
      if (Math.round(Number(t.costo) * 100) < d.numero) throw new AppError(400, 'El número de cuotas supera el monto en céntimos');
      return tx.cuota.createMany({
        data: installmentAmounts(Number(t.costo), d.numero).map((monto, i) => ({
          tratamientoId: id,
          numero: i + 1,
          monto,
          vencimiento: dueDate(d.inicio, i, d.frecuencia)
        }))
      });
    }, {
      isolationLevel: 'Serializable'
    });
  },
  pay: async (id: string, body: unknown) => {
    await requirePatient(id);
    const d = paymentSchema.parse(body);
    return db.$transaction(async tx => {
      const q = await tx.cuota.findUnique({
        where: {
          id: d.cuotaId
        },
        include: {
          tratamiento: true,
          pagos: true
        }
      });
      if (!q || q.tratamiento.pacienteId !== id) throw new AppError(404, 'Cuota no encontrada');
      const remaining = Math.round(Number(q.monto) * 100) - q.pagos.reduce((a, p) => a + Math.round(Number(p.monto) * 100), 0);
      if (Math.round(d.monto * 100) > remaining) throw new AppError(400, 'El pago supera el saldo de la cuota');
      return tx.pago.create({
        data: {
          ...d,
          fecha: new Date(d.fecha),
          pacienteId: id,
          tratamientoId: q.tratamientoId
        }
      });
    }, {
      isolationLevel: 'Serializable'
    });
  }
};
