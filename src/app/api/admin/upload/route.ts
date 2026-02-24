import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';
import type { PersonaInsert } from '@/lib/types';

function normalizeHeader(h: string): string {
  return String(h).toLowerCase().trim();
}

function findCol(row: Record<string, unknown>, ...names: string[]): string | null {
  for (const name of names) {
    for (const key of Object.keys(row)) {
      if (normalizeHeader(key) === name.toLowerCase()) {
        const v = row[key];
        return v != null ? String(v).trim() : null;
      }
    }
  }
  return null;
}

function rowToPersona(row: Record<string, unknown>): PersonaInsert | null {
  const rut = findCol(row, 'rut');
  const dv = findCol(row, 'dv', 'dv_alt');
  const nombres = findCol(row, 'nombres');
  const apellido_paterno = findCol(row, 'apellido paterno', 'apellido_paterno');
  const apellido_materno = findCol(row, 'apellido materno', 'apellido_materno');
  const correo_uai = findCol(row, 'correo uai', 'correo uai', 'correo_uai');
  const seccion_core = findCol(row, 'sección core', 'seccion core', 'seccion_core');
  const carrera = findCol(row, 'carrera');

  if (!rut || !dv || !nombres || !apellido_paterno || !apellido_materno || !seccion_core) {
    return null;
  }

  return {
    rut,
    dv,
    nombres,
    apellido_paterno,
    apellido_materno,
    correo_uai: correo_uai || undefined,
    seccion_core,
    carrera: carrera || undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: 'buffer' });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) {
    return NextResponse.json({ error: 'El archivo no tiene hojas' }, { status: 400 });
  }
  const ws = wb.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

  const personas: PersonaInsert[] = [];
  for (const row of rows) {
    const p = rowToPersona(row);
    if (p) personas.push(p);
  }

  if (personas.length === 0) {
    return NextResponse.json({
      error: 'No se encontraron filas válidas. Columnas esperadas: RUT, DV, nombres, apellido paterno, apellido materno, correo UAI, sección CORE, carrera.',
    }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('personas')
    .upsert(personas, { onConflict: 'rut,dv', ignoreDuplicates: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: personas.length });
}
