import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/admin', '/dashboard', '/exams'];
const AUTH_PREFIXES = ['/login'];

function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1];
  if (!payload) return null;
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  try {
    const json = atob(padded);
    return JSON.parse(json) as { exp?: number; role?: string };
  } catch {
    return null;
  }
}

function hasValidToken(req: NextRequest) {
  const token = req.cookies.get('auth_access_token')?.value;
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
}

function roleAllowed(pathname: string, role?: string) {
  if (pathname.startsWith('/admin')) {
    return role && ['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU', 'PENGAWAS'].includes(role);
  }
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/exams')) {
    return role && ['SISWA', 'GURU', 'PENGAWAS', 'ADMIN_SEKOLAH', 'SUPER_ADMIN'].includes(role);
  }
  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('auth_access_token')?.value;
  const payload = token ? decodeJwtPayload(token) : null;

  if (AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && hasValidToken(req)) {
    const role = payload?.role;
    const url = req.nextUrl.clone();
    url.pathname = role === 'SISWA' ? '/dashboard' : '/admin';
    return NextResponse.redirect(url);
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  if (!hasValidToken(req)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (!roleAllowed(pathname, payload?.role)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/exams/:path*', '/login'],
};
