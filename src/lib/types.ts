export type RestriccionAlimentaria = 'ninguna' | 'vegano' | 'vegetariano' | 'celiaco';

export interface Persona {
  id: string;
  rut: string;
  dv: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo_uai: string | null;
  seccion_core: string;
  carrera: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PersonaConAsistencia extends Persona {
  asistencia: Asistencia | null;
}

export interface Asistencia {
  id: string;
  persona_id: string;
  registrado_at: string;
  restriccion_alimentaria: RestriccionAlimentaria | null;
  created_at?: string;
}

export interface PersonaInsert {
  rut: string;
  dv: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo_uai?: string;
  seccion_core: string;
  carrera?: string;
}

export interface AsistenciaInsert {
  persona_id: string;
  restriccion_alimentaria?: RestriccionAlimentaria;
}
