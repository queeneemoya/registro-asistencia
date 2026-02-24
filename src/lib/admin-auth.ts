import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 horas

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || 'admin';
}

export async function setAdminSession() {
  const c = await cookies();
  c.set(ADMIN_COOKIE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function clearAdminSession() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const c = await cookies();
  return c.get(ADMIN_COOKIE)?.value === '1';
}

export async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    throw new Error('No autorizado');
  }
}
