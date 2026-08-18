import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.SESSION_SECRET || 'gradion_default_session_secret_key_2026';
export const COOKIE_NAME = 'book_studio_session';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
}

export function hashEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  return 'usr_' + crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 12);
}

export function signToken(user: UserSession): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (err) {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
