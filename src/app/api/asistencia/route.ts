import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { RestriccionAlimentaria } from '@/lib/types';

const RESTRICCIONES: RestriccionAlimentaria[] = ['ninguna', 'celiaco', 'vegetariano_vegano'];
// En la base de datos guardamos 'vegetariano' para el CHECK (ninguna, celiaco, vegetariano)
const RESTRICCION_TO_DB: Record<RestriccionAlimentaria, string> = {
  ninguna: 'ninguna',
  celiaco: 'celiaco',
  vegetariano_vegano: 'vegetariano',
};

// POST /api/asistencia - Registrar asistencia (vista usuario)
export async function POST(request: NextRequest) {
  let body: { persona_id: string; restriccion_alimentaria?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const { persona_id, restriccion_alimentaria } = body;
  if (!persona_id) {
    return NextResponse.json({ error: 'persona_id es obligatorio' }, { status: 400 });
  }

  const restriccion = restriccion_alimentaria && RESTRICCIONES.includes(restriccion_alimentaria as RestriccionAlimentaria)
    ? (restriccion_alimentaria as RestriccionAlimentaria)
    : 'ninguna';

  const valorDb = RESTRICCION_TO_DB[restriccion];

  const { data, error } = await supabase
    .from('asistencias')
    .upsert(
      { persona_id, restriccion_alimentaria: valorDb },
      { onConflict: 'persona_id' }
    )
    .select()
    .single();

  if (error) {
    if (error.code === '23503') {
      return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
