import {AppError} from './domain.js';

export function validateAppointmentState(current:string,next:string,fin:Date,now=new Date()){
  if(!['Cancelada','Completada','No asistió'].includes(next))throw new AppError(400,'Estado inválido');
  if(current!=='Confirmada')throw new AppError(409,'La cita ya fue cerrada');
  if(next==='No asistió'&&fin>now)throw new AppError(400,'Puedes marcar «No asistió» después de la hora de término de la cita.');
}
