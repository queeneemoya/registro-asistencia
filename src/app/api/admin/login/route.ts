import { NextRequest, NextResponse } from 'next/server';
import { setAdminSession, clearAdminSession, getAdminPassword } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({}));
  const valid = getAdminPassword();

  if (password === valid) {
    await setAdminSession();
    return NextResponse.json({ ok: true });
  }

  await clearAdminSession();
  return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
