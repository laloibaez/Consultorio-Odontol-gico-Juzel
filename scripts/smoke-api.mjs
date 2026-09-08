import assert from 'node:assert/strict';
const base=process.env.TEST_API_URL||'http://localhost:4000/api/v1';
const username=process.env.TEST_USERNAME,password=process.env.TEST_PASSWORD;
if(!username||!password)throw new Error('Configura TEST_USERNAME y TEST_PASSWORD de una base de prueba.');
let token='',patientId='',appointmentId='';
async function request(method,path,body,status=200){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const json=await r.json();assert.equal(r.status,status,`${method} ${path}: ${json.message}`);assert.ok('data'in json&&'error'in json&&'message'in json);return json.data;}
async function file(path,body,signature){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert.equal(r.status,200);const bytes=Buffer.from(await r.arrayBuffer());assert.equal(bytes.subarray(0,signature.length).toString(),signature);}
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const suffix=Date.now().toString().slice(-11);
try{
 await request('GET','/dashboard/resumen',undefined,401);
 const auth=await request('POST','/auth/login',{username,password});token=auth.token;
 await request('GET','/dashboard/resumen');
 const p=await request('POST','/pacientes',{nombres:'Prueba automática',apellidos:'Juzel '+suffix,tipoDocumento:'CE',documento:suffix,nacimiento:'1990-01-01',sexo:'Femenino',telefono:'999999999',direccion:'Registro exclusivo para pruebas',correo:''});patientId=p.id;
 assert.match(p.historia.numero,/^HC-\d{4}-\d{4,}$/);
 await request('POST','/pacientes',{nombres:'Duplicado',apellidos:'Prueba',tipoDocumento:'CE',documento:suffix,nacimiento:'1990-01-01',sexo:'Femenino',telefono:'999999999',direccion:'Prueba',correo:''},409);
 await request('PUT',`/pacientes/${p.id}/anamnesis`,{antecedentes:[{nombre:'Diabetes',controlado:false}],alergias:['Penicilina'],medicacion:'Prueba',derivacionMedico:'Profesional de prueba',derivacionMotivo:'Control'});
 const summary=await request('GET',`/pacientes/${p.id}/resumen`);assert.equal(summary.historia.alergias[0].nombre,'Penicilina');assert.equal(summary.historia.antecedentes[0].controlado,false);
 const piezas=Array.from({length:4},(_,q)=>Array.from({length:8},(_,i)=>({numero:(q+1)*10+i+1,superficies:{oclusal:'Sano',mesial:'Sano',distal:'Sano',vestibular:'Sano',lingual:'Sano'}}))).flat();
 const v1=await request('POST',`/pacientes/${p.id}/odontograma`,{piezas});piezas[0].superficies.oclusal='Caries';await request('POST',`/pacientes/${p.id}/odontograma`,{piezas});
 const previous=await request('GET',`/pacientes/${p.id}/odontograma/${v1.id}`);assert.equal(previous.piezas.find(t=>t.numero===11).superficies.oclusal,'Sano');
 const plan=await request('POST',`/pacientes/${p.id}/tratamientos`,{nombre:'Plan de prueba',descripcion:'Verificación multisesión',totalSesiones:1,costo:100});
 const plans=await request('GET',`/pacientes/${p.id}/tratamientos`),session=plans[0].sesiones[0];
 const attention={fecha:today,diagnostico:'Prueba',procedimiento:'Prueba',piezas:[11],anestesico:'No',indicaciones:'Prueba',sesionId:session.id};
 await request('POST',`/pacientes/${p.id}/atenciones`,attention);await request('POST',`/pacientes/${p.id}/atenciones`,attention,409);
 assert.equal((await request('GET',`/pacientes/${p.id}/tratamientos`))[0].estado,'Finalizado');
 await request('POST',`/tratamientos/${plan.id}/cuotas`,{numero:3,frecuencia:'mensual',inicio:today});await request('POST',`/tratamientos/${plan.id}/cuotas`,{numero:3,frecuencia:'mensual',inicio:today},409);
 const billing=await request('GET',`/pacientes/${p.id}/pagos`),quota=billing.cuotas[0];assert.equal(billing.cuotas.reduce((s,c)=>s+Math.round(Number(c.monto)*100),0),10000);
 await request('POST',`/pacientes/${p.id}/pagos`,{cuotaId:quota.id,monto:10,fecha:today,medio:'Yape-Plin'});
 const partial=await request('GET',`/pacientes/${p.id}/pagos`);assert.equal(partial.saldo,90);assert.ok(partial.cuotas[0].restante>0);
 await request('POST',`/pacientes/${p.id}/pagos`,{cuotaId:quota.id,monto:100,fecha:today,medio:'Efectivo'},400);
 const day=new Date();day.setUTCDate(day.getUTCDate()+45);const future=day.toISOString().slice(0,10),cita={pacienteId:p.id,inicio:future+'T09:00:00-05:00',duracion:30,tipo:'Cita de prueba'};
 const a=await request('POST','/citas',cita);appointmentId=a.id;await request('POST','/citas',cita,409);
 await request('PUT','/citas/'+a.id,{...cita,inicio:future+'T10:00:00-05:00'});
 await request('POST','/citas',{...cita,inicio:future+'T12:45:00-05:00'},400);
 for(const tipo of ['Ingresos','Citas atendidas','Pacientes nuevos','Saldos pendientes','Tratamientos más frecuentes'])await request('GET',`/reportes?tipo=${encodeURIComponent(tipo)}&desde=2000-01-01&hasta=2100-12-31`);
 await file(`/pacientes/${p.id}/historia-clinica/pdf`,null,'%PDF');
 const report={tipo:'Ingresos',desde:today,hasta:today};await file('/reportes/generar',{...report,formato:'pdf'},'%PDF');await file('/reportes/generar',{...report,formato:'excel'},'PK');
 console.log('Prueba API completa aprobada.');
}finally{
 if(appointmentId)await request('PATCH','/citas/'+appointmentId,{estado:'Cancelada'});
 if(patientId)await request('DELETE','/pacientes/'+patientId,{});
}
