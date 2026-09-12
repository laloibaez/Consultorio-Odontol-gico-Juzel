import {AppError} from '../../utils/domain.js';
const url='https://eldni.com/pe/buscar-datos-por-dni';
const clean=(s:string)=>s.replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#039;|&apos;/gi,"'").replace(/&#(\d+);/g,(_,n)=>{const v=Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):'';}).replace(/\s+/g,' ').trim();

export function parseDniResult(html:string,dni:string){
  for(const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)){
    const columns=[...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c=>clean(c[1]));
    if(columns.length>=4&&columns[0]===dni&&columns[1]&&columns[2])return {
      dni,nombres:columns[1],apellidos:[columns[2],columns[3]].filter(Boolean).join(' '),fuente:'eldni.com'
    };
  }
  throw new AppError(404,'No se encontraron nombres para ese DNI. Puedes completar los datos manualmente.');
}

export async function lookupDni(dni:string,fetcher:typeof fetch=fetch){
  if(!/^\d{8}$/.test(dni))throw new AppError(400,'El DNI debe contener exactamente 8 dígitos.');
  try {
    const headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',Accept:'text/html,application/xhtml+xml'};
    const signal=AbortSignal.timeout(12000);
    const initial=await fetcher(url,{headers,signal});
    if(!initial.ok)throw new AppError(502,'El servicio de DNI no está disponible. Puedes completar los datos manualmente.');
    const html=await initial.text();
    const token=html.match(/name=["']_token["'][^>]*value=["']([^"']+)["']/i)?.[1];
    const cookies=initial.headers.getSetCookie().map(c=>c.split(';',1)[0]).filter(Boolean).join('; ');
    if(!token||!cookies)throw new AppError(502,'No se pudo iniciar la consulta de DNI. Puedes completar los datos manualmente.');
    const body=new FormData();body.append('dni',dni);body.append('_token',token);
    const response=await fetcher(url,{method:'POST',headers:{...headers,Referer:url,Cookie:cookies},body,signal});
    if(!response.ok)throw new AppError(502,'El servicio externo de DNI no respondió correctamente.');
    return parseDniResult(await response.text(),dni);
  }catch(error){
    if(error instanceof AppError)throw error;
    throw new AppError(502,'No se pudo consultar el DNI. Revisa la conexión o completa los datos manualmente.');
  }
}
