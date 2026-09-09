import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync,spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const local=path.join(root,'.local');
fs.mkdirSync(local,{recursive:true});
const secretFile=path.join(local,'jwt-secret');
if(!fs.existsSync(secretFile))fs.writeFileSync(secretFile,randomBytes(48).toString('hex'),{mode:0o600});
const database=process.env.JUZEL_LOCAL_FILE ? path.resolve(process.env.JUZEL_LOCAL_FILE) : path.join(local,'juzel.db');
if(!fs.existsSync(database))fs.closeSync(fs.openSync(database,'a'));
const env={...process.env,JUZEL_LOCAL:'1',LOCAL_DATABASE_URL:process.env.JUZEL_LOCAL_FILE?'file:'+database.replaceAll('\\','/'):'file:../../.local/juzel.db',JWT_SECRET:fs.readFileSync(secretFile,'utf8'),PORT:process.env.LOCAL_PORT||'4000',FRONTEND_URL:'http://localhost:5173'};
const run=(script,args)=>{
  const result=spawnSync(process.execPath,[path.join(root,script),...args],{cwd:root,env,stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
};

// Se deriva del modelo original; nunca modifica el esquema PostgreSQL.
let schema=fs.readFileSync(path.join(root,'src/prisma/schema.prisma'),'utf8')
  .replace('provider = "prisma-client-js"','provider = "prisma-client-js"\n  output = "../../generated/local-client"')
  .replace('provider = "postgresql"','provider = "sqlite"')
  .replace('env("DATABASE_URL")','env("LOCAL_DATABASE_URL")')
  .replaceAll(/ @db\.(Date|Decimal\(12,2\))/g,'')
  .replace('correlativo Int @unique @default(autoincrement())','correlativo Int @unique')
  .replace('piezas Int[]','piezas Json');
fs.writeFileSync(path.join(root,'src/prisma/schema.local.prisma'),schema);
run('node_modules/prisma/build/index.js',['generate','--schema','src/prisma/schema.local.prisma']);
run('node_modules/prisma/build/index.js',['db','push','--schema','src/prisma/schema.local.prisma','--skip-generate']);
run('node_modules/tsx/dist/cli.mjs',['src/prisma/seed-local.ts']);
if(process.argv.includes('--setup-only'))process.exit(0);
console.log('\nModo local: http://localhost:'+env.PORT+' · Usuario: demo · Contraseña inicial: JuzelDemo2026!\n');
const child=spawn(process.execPath,[path.join(root,'node_modules/tsx/dist/cli.mjs'),'src/server.ts'],{cwd:root,env,stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code||0));
