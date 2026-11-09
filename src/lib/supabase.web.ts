import { createClient } from '@supabase/supabase-js';

import { CLIENT_KEY, CLIENT_URL } from './supabase-config';

// The browser already has localStorage; Supabase uses it by default.
export const supabase = createClient(CLIENT_URL, CLIENT_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
