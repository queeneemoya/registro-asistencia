import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const [personasRes, asistenciasRes] = await Promise.all([
    supabase.from('personas').select('id, seccion_core, carrera'),
    supabase.from('asistencias').select('persona_id, restriccion_alimentaria'),
  ]);

  const personas = personasRes.data || [];
  const asistencias = asistenciasRes.data || [];
  const totalPersonas = personas.length;
  const totalAsistencias = asistencias.length;
  const personaIdsRegistrados = new Set(asistencias.map((a: { persona_id: string }) => a.persona_id));

  const porRestriccion: Record<string, number> = { ninguna: 0, vegano: 0, vegetariano: 0, celiaco: 0 };
  for (const a of asistencias) {
    const r = (a as { restriccion_alimentaria: string | null }).restriccion_alimentaria || 'ninguna';
    porRestriccion[r] = (porRestriccion[r] ?? 0) + 1;
  }

  const porSeccion: Record<string, { total: number; registrados: number }> = {};
  const porCarrera: Record<string, { total: number; registrados: number }> = {};
  for (const p of personas) {
    const sec = (p as { seccion_core: string }).seccion_core;
    if (!porSeccion[sec]) porSeccion[sec] = { total: 0, registrados: 0 };
    porSeccion[sec].total += 1;
    const reg = personaIdsRegistrados.has((p as { id: string }).id);
    if (reg) porSeccion[sec].registrados += 1;

    const car = (p as { carrera: string | null }).carrera || '(sin carrera)';
    if (!porCarrera[car]) porCarrera[car] = { total: 0, registrados: 0 };
    porCarrera[car].total += 1;
    if (reg) porCarrera[car].registrados += 1;
  }

  return NextResponse.json({
    total_personas: totalPersonas,
    total_registrados: totalAsistencias,
    total_sin_registrar: totalPersonas - totalAsistencias,
    por_seccion: porSeccion,
    por_carrera: porCarrera,
    por_restriccion: porRestriccion,
  });
}
