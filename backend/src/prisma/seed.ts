import bcrypt from 'bcrypt';
import { db } from '../config/db.js';
const password = process.env.SEED_PASSWORD;
if (!password || password.length < 12) throw new Error('Configura SEED_PASSWORD con al menos 12 caracteres antes de ejecutar npm run seed.');
await db.usuario.upsert({
  where: {
    username: process.env.SEED_USERNAME || 'odontologa'
  },
  update: {},
  create: {
    username: process.env.SEED_USERNAME || 'odontologa',
    nombre: 'Odontóloga Juzel',
    password: await bcrypt.hash(password, 12)
  }
});
await db.$disconnect();
