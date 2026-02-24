import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';
import type { PersonaInsert } from '@/lib/types';

// GET /api/admin/personas - Listar todas con estado de asistencia
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('personas')
    .select(`
      id,
      rut,
      dv,
      nombres,
      apellido_paterno,
      apellido_materno,
      correo_uai,
      seccion_core,
      carrera,
      created_at,
      asistencias (id, registrado_at, restriccion_alimentaria)
    `)
    .order('apellido_paterno');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (data || []).map((p: Record<string, unknown>) => ({
    ...p,
    asistencia: Array.isArray(p.asistencias) ? (p.asistencias as unknown[])[0] ?? null : p.asistencias,
  }));
  return NextResponse.json(list);
}

// POST /api/admin/personas - Añadir persona manualmente
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as PersonaInsert & { restriccion_alimentaria?: string };
  const {
    rut,
    dv,
    nombres,
    apellido_paterno,
    apellido_materno,
    correo_uai,
    seccion_core,
    carrera,
    restriccion_alimentaria,
  } = body;

  const restriccionDb = ['ninguna', 'celiaco', 'vegetariano'].includes(restriccion_alimentaria ?? '')
    ? restriccion_alimentaria
    : 'ninguna';

  if (!rut || !dv || !nombres || !apellido_paterno || !apellido_materno || !seccion_core) {
    return NextResponse.json(
      { error: 'Faltan campos: rut, dv, nombres, apellido_paterno, apellido_materno, seccion_core' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('personas')
    .insert({
      rut: String(rut).trim(),
      dv: String(dv).trim(),
      nombres: String(nombres).trim(),
      apellido_paterno: String(apellido_paterno).trim(),
      apellido_materno: String(apellido_materno).trim(),
      correo_uai: correo_uai ? String(correo_uai).trim() : null,
      seccion_core: String(seccion_core).trim(),
      carrera: carrera ? String(carrera).trim() : null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe una persona con ese RUT y DV' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: errorAsistencia } = await supabase
    .from('asistencias')
    .insert({ persona_id: data.id, restriccion_alimentaria: restriccionDb });

  if (errorAsistencia) {
    return NextResponse.json({ error: errorAsistencia.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/admin/personas - Eliminar toda la lista (todas las personas y sus asistencias)
export async function DELETE() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  // Borrar asistencias primero (por si en algún caso no hay CASCADE)
  await supabase.from('asistencias').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error } = await supabase.from('personas').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
