-- Registro de Asistencia Mechoneo - Esquema PostgreSQL (Supabase)
-- Ejecutar en el SQL Editor de tu proyecto Supabase

-- Tabla de personas (cargadas desde XLS o añadidas manualmente)
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL,
  dv TEXT NOT NULL,
  nombres TEXT NOT NULL,
  apellido_paterno TEXT NOT NULL,
  apellido_materno TEXT NOT NULL,
  correo_uai TEXT,
  seccion_core TEXT NOT NULL,
  carrera TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rut, dv)
);

-- Tabla de asistencias (un registro por persona que asiste)
CREATE TABLE IF NOT EXISTS asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  registrado_at TIMESTAMPTZ DEFAULT now(),
  restriccion_alimentaria TEXT CHECK (restriccion_alimentaria IN ('ninguna', 'vegano', 'vegetariano', 'celiaco')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(persona_id)
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_personas_rut_dv ON personas(rut, dv);
CREATE INDEX IF NOT EXISTS idx_personas_seccion_core ON personas(seccion_core);
CREATE INDEX IF NOT EXISTS idx_personas_carrera ON personas(carrera);
CREATE INDEX IF NOT EXISTS idx_asistencias_persona_id ON asistencias(persona_id);

-- RLS (Row Level Security) - opcional: permite anónimo para lectura de personas por RUT y para insertar asistencias
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- Políticas: acceso público de lectura a personas (solo para buscar por RUT desde la app)
CREATE POLICY "Permitir lectura personas" ON personas FOR SELECT USING (true);

-- Cualquiera puede insertar en asistencias (registro de asistencia desde vista usuario)
CREATE POLICY "Permitir insertar asistencias" ON asistencias FOR INSERT WITH CHECK (true);

-- Solo lectura de asistencias para mostrar datos (admin y usuario)
CREATE POLICY "Permitir lectura asistencias" ON asistencias FOR SELECT USING (true);

-- Para que el admin pueda hacer todo desde el backend con service role key, no uses RLS para admin
-- o crea políticas con auth.role(). Aquí asumimos que las mutaciones admin se hacen con service role
-- que bypasea RLS, o añadimos políticas UPDATE/DELETE para authenticated.

-- Permitir actualización y eliminación en personas (admin vía API con service role)
CREATE POLICY "Permitir actualizar personas" ON personas FOR UPDATE USING (true);
CREATE POLICY "Permitir insertar personas" ON personas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir eliminar personas" ON personas FOR DELETE USING (true);

CREATE POLICY "Permitir actualizar asistencias" ON asistencias FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminar asistencias" ON asistencias FOR DELETE USING (true);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS personas_updated_at ON personas;
CREATE TRIGGER personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Si ya tenías la tabla sin "carrera", ejecuta solo esto en el SQL Editor:
-- ALTER TABLE personas ADD COLUMN IF NOT EXISTS carrera TEXT;
-- CREATE INDEX IF NOT EXISTS idx_personas_carrera ON personas(carrera);

-- Si ya tenías "intolerante_gluten" en restricción alimentaria, actualizar a "celiaco":
-- UPDATE asistencias SET restriccion_alimentaria = 'celiaco' WHERE restriccion_alimentaria = 'intolerante_gluten';
-- Luego ajustar el CHECK de la tabla asistencias (quitar 'intolerante_gluten', dejar 'celiaco').
