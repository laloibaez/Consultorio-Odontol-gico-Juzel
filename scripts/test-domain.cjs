// Ejecuta las pruebas puras incluso sin npm instalado. Requiere Node 22.13+.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {stripTypeScriptTypes}=require('node:module');
const {spawnSync}=require('node:child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'juzel-domain-'));
for(const name of ['domain','domain.test']){
 const src=fs.readFileSync(path.join(__dirname,'../backend/src/utils/'+name+'.ts'),'utf8');
 fs.writeFileSync(path.join(dir,name+'.mjs'),stripTypeScriptTypes(src,{mode:'transform'}).replace("'./domain.js'","'./domain.mjs'"));
}
const r=spawnSync(process.execPath,['--test',path.join(dir,'domain.test.mjs')],{stdio:'inherit'});process.exitCode=r.status||0;
