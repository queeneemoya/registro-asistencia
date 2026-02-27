import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/admin/buses - Listar secciones marcadas como subida a buses
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('secciones_buses')
    .select('seccion_core')
    .order('seccion_core');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const secciones = (data || []).map((r: { seccion_core: string }) => r.seccion_core);
  return NextResponse.json(secciones);
}

// POST /api/admin/buses - Marcar sección como subida a buses
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({})) as { seccion_core?: string };
  const seccion_core = body.seccion_core?.trim();
  if (!seccion_core) {
    return NextResponse.json({ error: 'seccion_core requerido' }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('secciones_buses')
    .upsert({ seccion_core }, { onConflict: 'seccion_core' });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/buses?seccion_core=X - Quitar marca de subida a buses
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const seccion_core = request.nextUrl.searchParams.get('seccion_core')?.trim();
  if (!seccion_core) {
    return NextResponse.json({ error: 'seccion_core requerido' }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('secciones_buses')
    .delete()
    .eq('seccion_core', seccion_core);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
