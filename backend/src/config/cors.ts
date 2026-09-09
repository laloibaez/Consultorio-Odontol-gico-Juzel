import type {CorsOptions} from 'cors';

export function createCorsOptions(frontendUrl:string,local:boolean):CorsOptions {
  return {
    origin: [...new Set([
      frontendUrl,
      ...(local ? ['http://localhost:5173','http://127.0.0.1:5173'] : [])
    ])]
  };
}
