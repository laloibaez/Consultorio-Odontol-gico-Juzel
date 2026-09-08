const fs=require('node:fs'),path=require('node:path');
const runtime=process.argv[2];
if(!runtime)throw new Error('Indica la ruta local de babelBundle.js');
const {babelParse}=require(runtime);
let count=0,fail=0;
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.tsx?$/.test(p)){try{babelParse(fs.readFileSync(p,'utf8'),p,true);count++;}catch(err){console.error(p,err.message);fail++;}}}}
walk('frontend/src');walk('backend/src');console.log(`${count} archivos analizados; ${fail} errores de sintaxis.`);process.exitCode=fail?1:0;
