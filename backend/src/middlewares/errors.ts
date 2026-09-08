import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/domain.js';
export const errors: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      data: null,
      error: err.flatten(),
      message: 'Revisa los campos del formulario'
    });
    return;
  }
  if (err.code === 'P2002') {
    res.status(409).json({
      data: null,
      error: null,
      message: 'El registro ya existe'
    });
    return;
  }
  if (err.code === 'P2034' || err.code === '23P01') {
    res.status(409).json({
      data: null,
      error: null,
      message: 'Otro cambio coincidió con esta operación. Actualiza e inténtalo de nuevo.'
    });
    return;
  }
  const status = err instanceof AppError ? err.status : 500;
  if (status === 500) console.error('Error interno', err.message);
  res.status(status).json({
    data: err.details ?? null,
    error: status,
    message: status === 500 ? 'No se pudo completar la operación' : err.message
  });
};
