const fs=require('node:fs'),path=require('node:path');
const {babelParse}=require(process.argv[2]);
const files=[];
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.resolve(dir,e.name);if(e.isDirectory())scan(p);else if(/\.tsx?$/.test(p))files.push(p);}}
scan('backend/src');scan('frontend/src');
const asts=new Map(files.map(file=>[file,babelParse(fs.readFileSync(file,'utf8'),file,true)]));
let failures=0,checked=0;
function resolve(file,source){const base=path.resolve(path.dirname(file),source).replace(/\.js$/,'');return [base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());}
function exportsOf(ast){const names=new Set();for(const n of ast.program.body){if(n.type==='ExportDefaultDeclaration')names.add('default');if(n.type==='ExportNamedDeclaration'){for(const s of n.specifiers||[])names.add(s.exported.name);const d=n.declaration;if(d?.id)names.add(d.id.name);for(const v of d?.declarations||[])if(v.id.name)names.add(v.id.name);}}return names;}
for(const [file,ast]of asts){for(const n of ast.program.body){if(n.type!=='ImportDeclaration'||!n.source.value.startsWith('.'))continue;const target=resolve(file,n.source.value);if(!target){console.error('Importación inexistente',file,n.source.value);failures++;continue;}if(!asts.has(target))continue;const exports=exportsOf(asts.get(target));for(const s of n.specifiers){if(s.type==='ImportNamespaceSpecifier')continue;const name=s.type==='ImportDefaultSpecifier'?'default':s.imported.name;if(!exports.has(name)){console.error('Exportación inexistente',file,n.source.value,name);failures++;}checked++;}}}
const schema=fs.readFileSync('backend/src/prisma/schema.prisma','utf8');for(const entity of ['Usuario','Paciente','HistoriaClinica','Antecedente','Alergia','Atencion','Odontograma','OdontogramaVersion','Pieza','Cita','PlanTratamiento','Sesion','Pago','Cuota'])if(!schema.includes('model '+entity+' {')){console.error('Modelo faltante',entity);failures++;}
console.log(`${checked} importaciones locales revisadas, 14 modelos presentes; ${failures} errores.`);process.exitCode=failures?1:0;
