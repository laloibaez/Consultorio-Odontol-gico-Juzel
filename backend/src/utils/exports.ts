import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Response } from 'express';
import { db } from '../config/db.js';
import { requirePatient } from '../modules/pacientes/repository.js';
import { soles } from './domain.js';
const date = (d: Date) => d.toLocaleDateString('es-PE', {
  timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric'
});
function pdf(res: Response, name: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${name}.pdf"`);
  // Reserva la respuesta binaria antes de que PDFKit empiece a emitir datos.
  // El controlador JSON no debe escribir mientras se inicia el stream.
  res.flushHeaders();
  const doc = new PDFDocument({
    margin: 45,
    size: 'A4',
    bufferPages: true
  });
  doc.pipe(res);
  doc.on('error', () => res.destroy());
  doc.fontSize(24).fillColor('#3FA98D').text('Juzel');
  doc.fontSize(10).fillColor('#6B7280').text('Consultorio Odontológico · Chiclayo, Perú').moveDown();
  doc.fillColor('#1F2937');
  return doc;
}
export async function exportReport(res: Response, format: string, title: string, rows: Record<string, unknown>[], desde: string, hasta: string) {
  if (format === 'excel') {
    const book = new ExcelJS.Workbook(),
      sheet = book.addWorksheet('Reporte');
    sheet.addRow(['Juzel · ' + title]);
    sheet.addRow([`${date(new Date(desde))} al ${date(new Date(hasta))}`]);
    rows = rows.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, k === 'Fecha' && typeof v === 'string' && /^\d{4}-/.test(v) ? date(new Date(v)) : v])));
    const keys = Object.keys(rows[0] || {});
    sheet.addRow(keys);
    rows.forEach(r => sheet.addRow(keys.map(k => r[k])));
    sheet.columns.forEach(c => c.width = 25);
    sheet.getRow(3).font = {
      bold: true
    };
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-juzel.xlsx"');
    await book.xlsx.write(res);
    res.end();
    return;
  }
  const doc = pdf(res, 'reporte-juzel');
  doc.fontSize(18).text(title);
  doc.fontSize(10).text(`${date(new Date(desde))} al ${date(new Date(hasta))}`).moveDown();
  if (!rows.length) doc.text('No hay registros en este período.');
  rows.forEach(r => {
    doc.fontSize(10).text(Object.entries(r).map(([k, v]) => `${k}: ${k === 'Fecha' && typeof v === 'string' && /^\d{4}-/.test(v) ? date(new Date(v)) : v}`).join('  |  ')).moveDown();
  });
  doc.end();
}
export async function clinicalPdf(id: string, res: Response) {
  const p = await requirePatient(id);
  const h = await db.historiaClinica.findUniqueOrThrow({
    where: {
      pacienteId: id
    },
    include: {
      antecedentes: true,
      alergias: true,
      atenciones: {
        orderBy: {
          fecha: 'desc'
        }
      },
      odontograma: {
        include: {
          versiones: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1,
            include: {
              piezas: true
            }
          }
        }
      }
    }
  });
  const plans = await db.planTratamiento.findMany({
    where: {
      pacienteId: id
    },
    include: {
      sesiones: {
        include: {
          atencion: true
        }
      },
      cuotas: {
        include: {
          pagos: true
        }
      },
      pagos: true
    }
  });
  const doc = pdf(res, h.numero);
  doc.fontSize(18).text('Historia clínica · ' + h.numero);
  doc.fontSize(11).text(`${p.nombres} ${p.apellidos}`).text(`${p.tipoDocumento}: ${p.documento} · Nacimiento: ${date(p.nacimiento)} · Sexo: ${p.sexo}`).text(`Teléfono: ${p.telefono} · Correo: ${p.correo || '—'}`).text(`Dirección: ${p.direccion}`).moveDown();
  const section = (title: string) => {
    doc.moveDown().fontSize(14).fillColor('#3FA98D').text(title).fillColor('#1F2937').fontSize(10);
  };
  section('Anamnesis');
  doc.text('Antecedentes: ' + (h.antecedentes.map(a => `${a.nombre} (${a.controlado ? 'Controlado' : 'NO CONTROLADO'})`).join(', ') || 'Sin antecedentes registrados'));
  doc.text('Alergias: ' + (h.alergias.map(a => a.nombre).join(', ') || 'Sin alergias registradas')).text('Medicación: ' + h.medicacion).text(`Derivación: ${h.derivacionMedico} · ${h.derivacionMotivo}`);
  section('Atenciones (más recientes primero)');
  h.atenciones.forEach(a => doc.text(`${date(a.fecha)} · Diagnóstico: ${a.diagnostico}`).text(`Procedimiento: ${a.procedimiento} · Piezas: ${a.piezas.join(', ')}`).text(`Anestésico: ${a.anestesico} · Indicaciones: ${a.indicaciones}`).moveDown());
  section('Odontograma actual');
  const v = h.odontograma?.versiones[0];
  if (v) {
    doc.text('Versión: ' + date(v.createdAt));
    v.piezas.sort((a, b) => a.numero - b.numero).forEach(t => doc.text(`Pieza ${t.numero}: ${Object.entries(t.superficies as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join('; ')}`));
  } else doc.text('Sin versiones registradas');
  section('Tratamientos, sesiones y pagos');
  plans.forEach(t => {
    doc.text(`${t.nombre} · ${t.estado} · ${t.sesiones.filter(s => s.completada).length} de ${t.totalSesiones} sesiones`).text(t.descripcion).text(`Costo: ${soles(t.costo)} · Saldo: ${soles(Number(t.costo) - t.pagos.reduce((a, p) => a + Number(p.monto), 0))}`);
    t.sesiones.forEach(s => doc.text(`Sesión ${s.numero}: ${s.completada ? 'Completada ' + date(s.atencion!.fecha) : 'Pendiente'}`));
    t.cuotas.forEach(c => doc.text(`Cuota ${c.numero} · Vence ${date(c.vencimiento)} · ${soles(c.monto)}`));
    t.pagos.forEach(p => doc.text(`Pago ${date(p.fecha)} · ${p.medio} · ${soles(p.monto)}`));
    doc.moveDown();
  });
  doc.end();
}
