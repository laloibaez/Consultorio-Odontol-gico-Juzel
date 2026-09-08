import { repository as db } from './repository.js';
import { AppError, peruDay } from '../../utils/domain.js';
export async function report(tipo: string, desde: string, hasta: string) {
  const gte = new Date(desde + 'T00:00:00Z'),
    lte = new Date(hasta + 'T23:59:59.999Z');
  if (isNaN(+gte) || isNaN(+lte) || gte > lte) throw new AppError(400, 'Rango de fechas inválido');
  if (tipo === 'Ingresos') {
    const a = await db.pago.findMany({
      where: {
        fecha: {
          gte,
          lte
        }
      },
      include: {
        paciente: true,
        tratamiento: true
      },
      orderBy: {
        fecha: 'desc'
      }
    });
    return a.map(p => ({
      Fecha: p.fecha.toISOString().slice(0, 10),
      Paciente: p.paciente.nombres + ' ' + p.paciente.apellidos,
      Tratamiento: p.tratamiento.nombre,
      Medio: p.medio,
      'Monto (S/)': Number(p.monto)
    }));
  }
  if (tipo === 'Citas atendidas') {
    const a = await db.cita.findMany({
      where: {
        estado: 'Completada',
        inicio: {
          gte: new Date(desde + 'T00:00:00-05:00'),
          lte: new Date(hasta + 'T23:59:59.999-05:00')
        }
      },
      include: {
        paciente: true
      }
    });
    return a.map(c => ({
      Fecha: c.inicio.toLocaleDateString('es-PE', {
        timeZone: 'America/Lima'
      }),
      Paciente: c.paciente.nombres + ' ' + c.paciente.apellidos,
      Atención: c.tipo,
      Estado: c.estado
    }));
  }
  if (tipo === 'Pacientes nuevos') {
    const a = await db.paciente.findMany({
      where: {
        createdAt: {
          gte:new Date(desde+'T00:00:00-05:00'),
          lte:new Date(hasta+'T23:59:59.999-05:00')
        },
        deletedAt: null
      },
      include: {
        historia: true
      }
    });
    return a.map(p => ({
      Historia: p.historia?.numero || '',
      Paciente: p.nombres + ' ' + p.apellidos,
      Documento: p.documento,
      Fecha: p.createdAt.toISOString().slice(0, 10)
    }));
  }
  if (tipo === 'Saldos pendientes') {
    const a = await db.planTratamiento.findMany({
      where: {
        createdAt: {
          gte: new Date(desde + 'T00:00:00-05:00'),
          lte: new Date(hasta + 'T23:59:59.999-05:00')
        },
        paciente: {
          deletedAt: null
        }
      },
      include: {
        paciente: true,
        pagos: true
      }
    });
    return a.map(t => ({
      Paciente: t.paciente.nombres + ' ' + t.paciente.apellidos,
      Tratamiento: t.nombre,
      'Saldo (S/)': Number(t.costo) - t.pagos.reduce((s, p) => s + Number(p.monto), 0)
    })).filter(t => t['Saldo (S/)'] > 0);
  }
  if (tipo === 'Tratamientos más frecuentes') {
    const a = await db.planTratamiento.groupBy({
      by: ['nombre'],
      where: {
        createdAt: {
          gte: new Date(desde + 'T00:00:00-05:00'),
          lte: new Date(hasta + 'T23:59:59.999-05:00')
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    return a.map(t => ({
      Tratamiento: t.nombre,
      Cantidad: t._count.id
    }));
  }
  throw new AppError(400, 'Tipo de reporte inválido');
}
