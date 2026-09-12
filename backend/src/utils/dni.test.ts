import test from 'node:test';
import assert from 'node:assert/strict';
import {lookupDni} from '../modules/pacientes/dni.js';
const fixture='<table><tr><td>00000000</td><td>Lucía &amp; Ana</td><td>De la Cruz</td><td>Rojas</td></tr></table>';
test('DNI reutiliza sesión y formulario; separa nombres y apellidos sin perder compuestos',async()=>{
  let calls=0;
  const fake:typeof fetch=async(_url,options)=>{
    calls++;
    if(calls===1)return new Response('<input name="_token" value="token-de-prueba">',{headers:{'set-cookie':'session=prueba; HttpOnly'}});
    assert.equal(options?.method,'POST');assert.equal(new Headers(options?.headers).get('cookie'),'session=prueba');
    assert.equal((options?.body as FormData).get('dni'),'00000000');
    return new Response(fixture);
  };
  assert.deepEqual(await lookupDni('00000000',fake),{dni:'00000000',nombres:'Lucía & Ana',apellidos:'De la Cruz Rojas',fuente:'eldni.com'});
  assert.equal(calls,2);
});
test('DNI inválido no inicia consultas y errores del proveedor no inventan nombres',async()=>{
  let calls=0;const fake:typeof fetch=async()=>{calls++;return new Response('Sin datos');};
  await assert.rejects(lookupDni('123',fake));assert.equal(calls,0);
  await assert.rejects(lookupDni('00000000',fake),{status:502});
  await assert.rejects(lookupDni('00000000',async()=>{throw new Error('Sin red');}),{status:502});
});
test('Una fila con otro documento nunca rellena el formulario',async()=>{
  let calls=0;const fake:typeof fetch=async()=>++calls===1?new Response('<input name="_token" value="x">',{headers:{'set-cookie':'session=x'}}):new Response(fixture.replace('00000000','11111111'));
  await assert.rejects(lookupDni('00000000',fake),{status:404});
});
