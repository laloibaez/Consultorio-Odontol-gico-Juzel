import { z } from 'zod';
import { peruDay } from './domain.js';
z.setErrorMap(issue => ({
  message: issue.code === 'invalid_type' ? 'Tipo de dato inválido' : issue.code === 'too_small' ? 'El valor no alcanza el mínimo requerido' : issue.code === 'too_big' ? 'El valor supera el máximo permitido' : 'Valor inválido'
}));
const text = z.string().trim().min(1, 'Campo obligatorio').max(2000);
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, 'Fecha inválida');
export const money = z.coerce.number().positive().max(9999999).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001, 'Usa máximo dos decimales');
export const patientSchema = z.object({
  nombres: text,
  apellidos: text,
  tipoDocumento: z.enum(['DNI', 'CE', 'Pasaporte']),
  documento: z.string().trim().min(8).max(20),
  nacimiento: date.refine(v => v <= peruDay(), 'Fecha futura inválida'),
  sexo: z.enum(['Femenino', 'Masculino', 'Otro']),
  telefono: z.string().regex(/^(\+?51)?9\d{8}$/, 'Teléfono peruano inválido'),
  direccion: text,
  correo: z.union([z.string().email(), z.literal('')]).optional()
}).superRefine((v, ctx) => {
  if (v.tipoDocumento === 'DNI' && !/^\d{8}$/.test(v.documento)) ctx.addIssue({
    code: 'custom',
    path: ['documento'],
    message: 'El DNI debe tener 8 dígitos'
  });
});
export const anamnesisSchema = z.object({
  antecedentes: z.array(z.object({
    nombre: text,
    controlado: z.boolean()
  })).max(50),
  alergias: z.array(z.string().trim().min(1).max(150)).max(50),
  medicacion: z.string().max(4000),
  derivacionMedico: z.string().max(500),
  derivacionMotivo: z.string().max(4000)
});
export const FDI = Array.from({
  length: 4
}, (_, q) => Array.from({
  length: 8
}, (_, i) => (q + 1) * 10 + i + 1)).flat();
export const attentionSchema = z.object({
  fecha: date,
  diagnostico: text,
  procedimiento: text,
  piezas: z.array(z.number().refine(n => FDI.includes(n))).max(32),
  anestesico: text,
  indicaciones: text,
  sesionId: z.string().optional()
});
export const treatmentSchema = z.object({
  nombre: text,
  descripcion: text,
  totalSesiones: z.coerce.number().int().min(1).max(100),
  costo: money
});
export const appointmentSchema = z.object({
  pacienteId: text,
  inicio: z.string().datetime({
    offset: true
  }),
  duracion: z.coerce.number().int().min(15).max(300),
  tipo: text
});
export const quotaSchema = z.object({
  numero: z.coerce.number().int().min(1).max(60),
  frecuencia: z.enum(['mensual', 'quincenal']),
  inicio: date
});
export const paymentSchema = z.object({
  cuotaId: text,
  monto: money,
  fecha: date.refine(v => v <= peruDay(), 'No se permiten pagos futuros'),
  medio: z.enum(['Efectivo', 'Transferencia', 'Yape-Plin'])
});
const findings = z.enum(['Sano', 'Caries', 'Obturación', 'Ausente', 'Corona']);
export const odontogramSchema = z.object({
  piezas: z.array(z.object({
    numero: z.number().refine(n => FDI.includes(n)),
    superficies: z.object({
      oclusal: findings,
      mesial: findings,
      distal: findings,
      vestibular: findings,
      lingual: findings
    })
  })).length(32).refine(a => new Set(a.map(p => p.numero)).size === 32, 'Se requieren 32 piezas distintas')
});
