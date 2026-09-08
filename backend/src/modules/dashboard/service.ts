import { repository as db } from './repository.js';
import { peruDay } from '../../utils/domain.js';
export async function dashboard() {
  const today = peruDay(),
    month = today.slice(0, 7) + '-01';
  const [citas, ingresos, planes] = await Promise.all([db.cita.count({
    where: {
      inicio: {
        gte: new Date(today + 'T00:00:00-05:00'),
        lte: new Date(today + 'T23:59:59-05:00')
      },
      estado: {
        not: 'Cancelada'
      },
      paciente: {
        deletedAt: null
      }
    }
  }), db.pago.aggregate({
    where: {
      fecha: {
        gte: new Date(month)
      }
    },
    _sum: {
      monto: true
    }
  }), db.planTratamiento.findMany({
    where: {
      paciente: {
        deletedAt: null
      }
    },
    include: {
      pagos: true
    }
  })]);
  const meses = await Promise.all(Array.from({
    length: 6
  }, async (_, i) => {
    const from = new Date(month);
    from.setUTCMonth(from.getUTCMonth() - 5 + i);
    const to = new Date(from);
    to.setUTCMonth(to.getUTCMonth() + 1);
    const p = await db.pago.aggregate({
      where: {
        fecha: {
          gte: from,
          lt: to
        }
      },
      _sum: {
        monto: true
      }
    });
    return {
      mes: from.toLocaleDateString('es-PE', {
        month: 'short',
        year: '2-digit',
        timeZone: 'UTC'
      }),
      ingresos: Number(p._sum.monto || 0)
    };
  }));
  return {
    citas,
    ingresos: Number(ingresos._sum.monto || 0),
    saldo: planes.reduce((a, t) => a + Number(t.costo) - t.pagos.reduce((s, p) => s + Number(p.monto), 0), 0),
    meses
  };
}
