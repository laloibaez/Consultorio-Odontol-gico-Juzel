import { z } from 'zod';
z.setErrorMap(() => ({
  message: 'Revisa el valor de este campo'
}));
export const quotaFormSchema = z.object({
  numero: z.coerce.number().int().min(1).max(60),
  frecuencia: z.enum(['mensual', 'quincenal']),
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
export const paymentFormSchema = z.object({
  monto: z.coerce.number().positive().refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001, 'Usa máximo dos decimales'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  medio: z.enum(['Efectivo', 'Transferencia', 'Yape-Plin'])
});
export const appointmentFormSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  duracion: z.coerce.number().int().min(15).max(300),
  tipo: z.string().trim().min(1).max(2000)
});
export const anamnesisFormSchema = z.object({
  medicacion: z.string().max(4000),
  derivacionMedico: z.string().max(500),
  derivacionMotivo: z.string().max(4000)
});
