import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {api} from '../../shared/services/api';
import {useSave} from '../../shared/hooks/query';
import {Input,Button,Field,ErrorBox} from '../../shared/components/ui';
import {today} from '../../shared/utils/format';

const schema=z.object({
  nombres:z.string().trim().min(1,'Campo obligatorio'),apellidos:z.string().trim().min(1,'Campo obligatorio'),
  tipoDocumento:z.enum(['DNI','CE','Pasaporte']),documento:z.string().min(8,'Mínimo 8 caracteres').max(20),
  nacimiento:z.string().min(1,'Campo obligatorio').refine(v=>v<=today(),'Fecha futura inválida'),sexo:z.enum(['Femenino','Masculino','Otro']),
  telefono:z.string().regex(/^(\+?51)?9\d{8}$/,'Ingresa un celular peruano de 9 dígitos'),direccion:z.string().min(1,'Campo obligatorio'),correo:z.union([z.string().email('Correo inválido'),z.literal('')])
}).superRefine((v,ctx)=>{if(v.tipoDocumento==='DNI'&&!/^\d{8}$/.test(v.documento))ctx.addIssue({code:'custom',path:['documento'],message:'El DNI debe tener 8 dígitos'});});

export function PatientRegistration(){
  const nav=useNavigate(),save=useSave('/pacientes');
  const [consulting,setConsulting]=useState(false),[lookupError,setLookupError]=useState<unknown>(null),[found,setFound]=useState('');
  const {register,handleSubmit,watch,setValue,formState:{errors}}=useForm<z.infer<typeof schema>>({resolver:zodResolver(schema),mode:'onChange',defaultValues:{tipoDocumento:'DNI',documento:'',nombres:'',apellidos:'',sexo:'Femenino',correo:''}});
  const documentType=watch('tipoDocumento'),document=watch('documento');
  const existing=(save.error as {response?:{data?:{data?:{existingId?:string}}}})?.response?.data?.data?.existingId;
  function clearLookup(){if(found){setValue('nombres','');setValue('apellidos','');}setFound('');setLookupError(null);}
  async function lookup(){
    setConsulting(true);setLookupError(null);setFound('');
    try{
      const response=await api.post<{data:{nombres:string;apellidos:string}}>('/pacientes/consultar-dni',{dni:document});
      setValue('nombres',response.data.data.nombres,{shouldDirty:true,shouldValidate:true});
      setValue('apellidos',response.data.data.apellidos,{shouldDirty:true,shouldValidate:true});
      setFound('Nombres y apellidos encontrados. Revisa que correspondan al paciente.');
    }catch(error){setLookupError(error);}finally{setConsulting(false);}
  }
  return <><Link className="text-link" to="/pacientes">← Pacientes</Link><h1>Nuevo paciente</h1><p className="muted">El número de historia clínica se generará automáticamente.</p>
    <form className="card" onSubmit={handleSubmit(v=>save.mutate(v,{onSuccess:p=>nav('/pacientes/'+p.id,{state:{message:'Paciente registrado correctamente'}})}))}>
      <div className="form-grid">
        <Field label="Tipo de documento *"><select disabled={consulting} {...register('tipoDocumento',{onChange:clearLookup})}><option>DNI</option><option>CE</option><option>Pasaporte</option></select></Field>
        <Field label="N° de documento *" error={errors.documento?.message}><div className="tag-entry"><Input disabled={consulting} inputMode={documentType==='DNI'?'numeric':'text'} maxLength={documentType==='DNI'?8:20} {...register('documento',{onChange:e=>{if(documentType==='DNI')setValue('documento',e.target.value.replace(/\D/g,''));clearLookup();}})}/>{documentType==='DNI'&&<Button type="button" secondary disabled={consulting||!/^\d{8}$/.test(document)} onClick={lookup}>{consulting?'Consultando…':'Consultar DNI'}</Button>}</div></Field>
      </div>
      {documentType==='DNI'&&<p className="muted small">Consultar DNI envía el número a eldni.com, la misma fuente externa de Herramientas TIC. Requiere internet. También puedes completar los datos manualmente.</p>}
      <ErrorBox error={lookupError}/>{found&&<p role="status" className="success">{found}</p>}
      <div className="form-grid">
        <Field label="Nombres *" error={errors.nombres?.message}><Input disabled={consulting} {...register('nombres')}/></Field>
        <Field label="Apellidos *" error={errors.apellidos?.message}><Input disabled={consulting} {...register('apellidos')}/></Field>
        <Field label="Fecha de nacimiento *" error={errors.nacimiento?.message}><Input type="date" max={today()} {...register('nacimiento')}/></Field>
        <Field label="Sexo *"><select {...register('sexo')}><option>Femenino</option><option>Masculino</option><option>Otro</option></select></Field>
        <Field label="Teléfono *" error={errors.telefono?.message}><Input type="tel" {...register('telefono')}/></Field>
        <Field label="Correo (opcional)" error={errors.correo?.message}><Input type="email" {...register('correo')}/></Field>
        <Field label="Dirección *" error={errors.direccion?.message}><Input {...register('direccion')}/></Field>
      </div>
      <ErrorBox error={save.error}/>{existing&&<Link className="text-link" to={'/pacientes/'+existing}>Abrir la ficha existente</Link>}
      <div className="actions"><Link className="btn secondary" to="/pacientes">Cancelar</Link><Button disabled={save.isPending||consulting}>{save.isPending?'Registrando…':'Registrar paciente'}</Button></div>
    </form></>;
}
