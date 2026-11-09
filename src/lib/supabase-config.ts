export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
export const SUPABASE_CONFIGURED = !!SUPABASE_URL && !!SUPABASE_KEY;

/** createClient throws on an empty URL; use a placeholder so the app still renders (requests just fail). */
export const CLIENT_URL = SUPABASE_URL || 'https://not-configured.supabase.co';
export const CLIENT_KEY = SUPABASE_KEY || 'not-configured';

export const PHOTO_BUCKET = 'listing-photos';

/** Hidden email domain: accounts use a username only, Supabase Auth needs an email. */
const USER_EMAIL_DOMAIN = 'users.rentobile.app';

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const MIN_PASSWORD = 8;

export function normalizeUsername(name: string) {
  return name.trim().toLowerCase();
}

export function usernameToEmail(name: string) {
  return `${normalizeUsername(name)}@${USER_EMAIL_DOMAIN}`;
}

/** Public URL for a stored photo path; full URLs (and local URIs) pass through unchanged. */
export function photoUrl(path: string) {
  if (/^(https?:|file:|blob:|data:)/.test(path)) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}
