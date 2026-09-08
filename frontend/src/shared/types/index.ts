export interface Antecedente {
  nombre: string;
  controlado: boolean;
}
export interface Patient {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documento: string;
  nacimiento: string;
  sexo: string;
  telefono: string;
  direccion: string;
  correo?: string;
  historia: {
    numero: string;
    antecedentes: Antecedente[];
    alergias: {
      nombre: string;
    }[];
    atenciones: Attention[];
  };
}
export interface Attention {
  id: string;
  fecha: string;
  diagnostico: string;
  procedimiento: string;
  piezas: number[];
  anestesico: string;
  indicaciones: string;
  sesion?: {
    numero: number;
    tratamiento: {
      nombre: string;
    };
  };
}
export interface Payment {
  id: string;
  monto: string;
  fecha: string;
  medio: string;
}
export interface Quota {
  id: string;
  numero: number;
  monto: string;
  vencimiento: string;
  tratamiento: string;
  restante: number;
  dias: number;
  estado: string;
  pagos: Payment[];
}
export interface Treatment {
  id: string;
  nombre: string;
  descripcion: string;
  totalSesiones: number;
  costo: string;
  estado: string;
  sesiones: {
    id: string;
    numero: number;
    completada: boolean;
    atencion?: Attention;
  }[];
  cuotas: Quota[];
  pagos: Payment[];
}
export interface Appointment {
  id: string;
  pacienteId: string;
  paciente: Patient;
  inicio: string;
  fin: string;
  tipo: string;
  estado: string;
}
