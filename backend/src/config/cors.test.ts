import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import {createCorsOptions} from './cors.js';
import type {AddressInfo} from 'node:net';

for(const local of [true,false])test(`CORS HTTP y preflight: modo ${local?'local':'PostgreSQL'}`,async()=>{
  const app=express();
  app.use(cors(createCorsOptions('http://localhost:5173',local)));
  app.get('/entorno',(_req,res)=>res.json({ok:true}));
  const server=app.listen(0,'127.0.0.1');
  await new Promise<void>(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for(const origin of ['http://localhost:5173','http://127.0.0.1:5173','http://127.0.0.1:9999','https://ajeno.example']){
      const allowed=origin==='http://localhost:5173'||(local&&origin==='http://127.0.0.1:5173');
      for(const method of ['GET','OPTIONS']){
        const response=await fetch(base+'/entorno',{method,headers:{Origin:origin,...(method==='OPTIONS'?{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,authorization'}:{})}});
        assert.equal(response.headers.get('access-control-allow-origin'),allowed?origin:null);
        if(method==='OPTIONS'&&allowed){assert.equal(response.status,204);assert.match(response.headers.get('access-control-allow-headers')||'',/authorization/);}
        await response.arrayBuffer();
      }
    }
  }finally{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
