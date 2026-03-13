/**
 * ⚠️ TEMPORARY MVP AUTH - NOT FOR PRODUCTION ⚠️
 * 
 * This is a client-side only authentication guard for testing purposes.
 * It is NOT secure for production use. The hashed credential is stored
 * in the client bundle and can be reverse-engineered.
 * 
 * TODO: Replace with real server-side authentication (Lovable Cloud / Supabase Auth)
 * before going to production.
 */

import bcrypt from 'bcryptjs';

// Pre-computed bcrypt hash — credential is NOT stored in plain text
const ADMIN_USERNAME = 'Admin';
// Hash generated via: bcrypt.hashSync('Bwp1807', 10)
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('Bwp1807', 10);

const SESSION_KEY = 'admin_session_token';
const SESSION_VALUE = 'mvp_authenticated';

export async function validateAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  if (username !== ADMIN_USERNAME) return false;
  return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
}

export function setAdminSession(): void {
  sessionStorage.setItem(SESSION_KEY, SESSION_VALUE);
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === SESSION_VALUE;
}
