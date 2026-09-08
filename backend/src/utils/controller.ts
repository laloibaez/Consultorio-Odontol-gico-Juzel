import { Request, Response, NextFunction } from 'express';
export const action = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await fn(req, res);
    if (!res.headersSent) res.json({
      data,
      error: null,
      message: 'Operación completada'
    });
  } catch (e) {
    next(e);
  }
};
