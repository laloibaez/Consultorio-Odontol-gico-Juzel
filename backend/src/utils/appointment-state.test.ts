import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAppointmentState} from './appointment-state.js';
const now=new Date('2026-09-08T10:30:00-05:00');
test('No asistió solo se permite al terminar una cita confirmada',()=>{
  assert.doesNotThrow(()=>validateAppointmentState('Confirmada','No asistió',now,now));
  assert.throws(()=>validateAppointmentState('Confirmada','No asistió',new Date(+now+1),now));
  for(const state of ['Cancelada','Completada','No asistió'])assert.throws(()=>validateAppointmentState(state,'No asistió',now,now));
  assert.throws(()=>validateAppointmentState('Confirmada','Inventado',now,now));
});
