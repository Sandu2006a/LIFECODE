import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET      = new TextEncoder().encode(process.env.JWT_SECRET || 'lifecode-secret-key-2026-xk9p');
const COOKIE_NAME = 'lc_session';

export async function signToken(payload: { userId: string; username: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; username: string };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ userId: string; username: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(response: Response, token: string) {
  response.headers.set(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
  );
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
