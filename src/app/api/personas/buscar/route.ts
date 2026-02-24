import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/personas/buscar?rut=12345678&dv=9
export async function GET(request: NextRequest) {
  const rut = request.nextUrl.searchParams.get('rut')?.trim();
  const dv = request.nextUrl.searchParams.get('dv')?.trim();

  if (!rut || !dv) {
    return NextResponse.json(
      { error: 'Faltan parámetros rut y dv' },
      { status: 400 }
    );
  }

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
      asistencias (id, registrado_at, restriccion_alimentaria)
    `)
    .eq('rut', rut)
    .eq('dv', dv)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'No se encontró persona con ese RUT' }, { status: 404 });
  }

  const raw = (data as { asistencias?: unknown }).asistencias;
  const asistencia = Array.isArray(raw) ? raw[0] ?? null : raw ?? null;
  const rest = { ...data } as Record<string, unknown>;
  delete rest.asistencias;
  return NextResponse.json({ ...rest, asistencia });
}
