import {useQuery} from '@tanstack/react-query';
import {get} from '../services/api';
export function EnvironmentBanner(){
  const {data}=useQuery({queryKey:['entorno'],queryFn:()=>get<{local:boolean}>('/entorno'),staleTime:60000,retry:false});
  return data?.local?<div style={{background:'#E4F7F1',color:'#286E56',textAlign:'center',padding:'8px 16px',fontSize:12}} role="status">Modo de prueba · Usa datos ficticios. Los cambios se guardan en este equipo.</div>:null;
}
