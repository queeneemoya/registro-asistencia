import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';

// DELETE /api/admin/asistencias/[personaId] - Quitar el registro de asistencia (no borra la persona)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ personaId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { personaId } = await params;
  if (!personaId) {
    return NextResponse.json({ error: 'personaId requerido' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('asistencias')
    .delete()
    .eq('persona_id', personaId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
