-- Ejecutar en el SQL Editor de Supabase (copia y pega cada bloque y ejecuta)

-- 1. Actualizar datos existentes por si tenías 'vegano' o 'vegetariano_vegano'
UPDATE asistencias
SET restriccion_alimentaria = 'vegetariano'
WHERE restriccion_alimentaria IN ('vegano', 'vegetariano_vegano');

-- 2. Quitar la restricción antigua
ALTER TABLE asistencias
DROP CONSTRAINT IF EXISTS asistencias_restriccion_alimentaria_check;

-- 3. Añadir la nueva (solo: ninguna, celiaco, vegetariano)
ALTER TABLE asistencias
ADD CONSTRAINT asistencias_restriccion_alimentaria_check
CHECK (restriccion_alimentaria IN ('ninguna', 'celiaco', 'vegetariano'));
