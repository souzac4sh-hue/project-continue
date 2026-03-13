/**
 * Admin auth utilities — now uses Supabase Auth via useAuth() hook.
 * These legacy helpers are kept only for backward compatibility during migration.
 * The real auth check is done via useAuth().isAdmin in components.
 */

// No-op stubs — admin auth is now handled by Supabase Auth + has_role()
export function isAdminAuthenticated(): boolean {
  // Legacy stub — AdminPage now uses useAuth() hook
  return false;
}

export function setAdminSession(): void {
  // No-op — sessions are managed by Supabase Auth
}

export function clearAdminSession(): void {
  // No-op — use signOut() from useAuth() instead
}
