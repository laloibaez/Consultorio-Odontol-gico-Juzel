import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createRequire } from 'node:module';
import { isLocalDatabase } from './local-mode.js';

function localClient(): PrismaClient {
  const require = createRequire(import.meta.url);
  const { PrismaClient: SQLiteClient } = require('../../generated/local-client');
  const client = new SQLiteClient();
  // SQLite guarda los mismos datos, usando JSON para las piezas de una atención.
  // Una cola de transacciones evita escrituras simultáneas en el archivo local.
  let tail: Promise<unknown> = Promise.resolve();
  return new Proxy(client, {
    get(target, key) {
      if (key === '$transaction') return (...args: unknown[]) => {
        const result = tail.then(() => target.$transaction(...args));
        tail = result.catch(() => undefined);
        return result;
      };
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  }) as PrismaClient;
}

export const db: PrismaClient = isLocalDatabase ? localClient() : new PrismaClient();
