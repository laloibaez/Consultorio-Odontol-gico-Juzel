import bcrypt from 'bcrypt';
import {db} from '../config/db.js';
import {isLocalDatabase} from '../config/local-mode.js';
import {patientService} from '../modules/pacientes/service.js';
import {clinicalService} from '../modules/historia-clinica/service.js';
import {treatmentService} from '../modules/tratamientos/service.js';
import {paymentService} from '../modules/pagos/service.js';
import {odontogramService} from '../modules/odontograma/service.js';
import {agendaService} from '../modules/agenda/service.js';
import {peruDay} from '../utils/domain.js';
import {FDI} from '../utils/schemas.js';

if(!isLocalDatabase)throw new Error('Los datos de demostración solo se crean en modo local.');
try {
  await db.usuario.upsert({where:{username:'demo'},update:{},create:{username:'demo',nombre:'Odontóloga · Demostración',password:await bcrypt.hash('JuzelDemo2026!',12)}});
  // Este identificador evita duplicar datos al reiniciar, incluso si se archiva la ficha.
  if(!await db.paciente.findUnique({where:{documento:'DEMO0001'}})){
    const today=peruDay();
    const p=await patientService.create({nombres:'Lucía',apellidos:'Torres · Demo',tipoDocumento:'CE',documento:'DEMO0001',nacimiento:'1994-05-18',sexo:'Femenino',telefono:'999000001',direccion:'Paciente ficticio para pruebas',correo:''});
    await clinicalService.saveAnamnesis(p.id,{antecedentes:[{nombre:'Hipertensión',controlado:false}],alergias:['Penicilina'],medicacion:'Registro de demostración',derivacionMedico:'Profesional de demostración',derivacionMotivo:'Control previo al tratamiento'});
    const t=await treatmentService.create(p.id,{nombre:'Restauraciones · Demo',descripcion:'Plan ficticio de cuatro sesiones',totalSesiones:4,costo:800});
    await paymentService.quotas(t.id,{numero:4,frecuencia:'mensual',inicio:today});
    const cuotas=await paymentService.list(p.id);
    await paymentService.pay(p.id,{cuotaId:cuotas.cuotas[0].id,monto:100,fecha:today,medio:'Yape-Plin'});
    const plans=await treatmentService.list(p.id);
    await clinicalService.createAttention(p.id,{fecha:today,diagnostico:'Evaluación de demostración',procedimiento:'Registro clínico ficticio',piezas:[16],anestesico:'No',indicaciones:'Texto de prueba',sesionId:plans[0].sesiones[0].id});
    const piezas=FDI.map(numero=>({numero,superficies:{oclusal:numero===16?'Caries':'Sano',mesial:'Sano',distal:'Sano',vestibular:'Sano',lingual:'Sano'}}));
    await odontogramService.create(p.id,{piezas});
    await agendaService.save({pacienteId:p.id,inicio:today+'T10:00:00-05:00',duracion:30,tipo:'Evaluación · Demo'});
    await patientService.create({nombres:'Mateo',apellidos:'Rojas · Demo',tipoDocumento:'CE',documento:'DEMO0002',nacimiento:'1988-11-03',sexo:'Masculino',telefono:'999000002',direccion:'Paciente ficticio para pruebas',correo:''});
  }
  console.log('Base local preparada; los cambios anteriores se conservan.');
} finally {await db.$disconnect();}
