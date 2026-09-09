import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { api } from './routes.js';
import { errors } from './middlewares/errors.js';
import { secret } from './middlewares/auth.js';
import { db } from './config/db.js';
import { isLocalDatabase } from './config/local-mode.js';
secret();
const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json({
  limit: '256kb'
}));
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.info(`${req.method} ${req.path.replace(/\/c[a-z0-9]{20,}/g, '/:id')} ${res.statusCode} ${Date.now() - start}ms`));
  next();
});
app.get('/health', async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({
      data: {
        status: 'ok'
      },
      error: null,
      message: 'Disponible'
    });
  } catch {
    res.status(503).json({
      data: null,
      error: 503,
      message: 'Base de datos no disponible'
    });
  }
});
app.get('/api/v1/entorno', (_req,res)=>res.json({data:{local:isLocalDatabase},error:null,message:'Entorno de ejecución'}));
app.use('/api/v1', api);
app.use((_req, res) => res.status(404).json({
  data: null,
  error: 404,
  message: 'Ruta no encontrada'
}));
app.use(errors);
const server = app.listen(Number(process.env.PORT || 4000), '127.0.0.1', () => console.info('API Juzel disponible en http://localhost:' + (process.env.PORT || 4000)));
process.on('SIGTERM', () => server.close(async () => {
  await db.$disconnect();
  process.exit(0);
}));
