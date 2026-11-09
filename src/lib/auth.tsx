import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import { supabase } from './supabase';
import { MIN_PASSWORD, normalizeUsername, USERNAME_RE, usernameToEmail } from './supabase-config';

export type Role = 'user' | 'admin';
export type Profile = { id: string; username: string; role: Role; created_at: string };

/** Error codes the UI translates. */
export type AuthErrorCode =
  | 'invalidUsername'
  | 'passwordTooShort'
  | 'usernameTaken'
  | 'wrongCredentials'
  | 'network';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode) {
    super(code);
  }
}

type AuthCtx = {
  session: Session | null;
  profile: Profile | null;
  /** True until the stored session (and its profile) has been loaded. */
  loading: boolean;
  isAdmin: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = React.createContext<AuthCtx | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    const apply = async (s: Session | null) => {
      const p = s ? await fetchProfile(s.user.id) : null;
      if (!active) return;
      setSession(s);
      setProfile(p);
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session)).catch(() => setLoading(false));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      // Defer: calling Supabase inside this callback can deadlock the auth lock.
      setTimeout(() => {
        apply(s);
        queryClient.invalidateQueries();
      }, 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = React.useMemo<AuthCtx>(
    () => ({
      session,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      async signIn(username, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email: usernameToEmail(username),
          password,
        });
        if (error) throw new AuthError(error.status === 400 ? 'wrongCredentials' : 'network');
      },
      async signUp(username, password) {
        const name = normalizeUsername(username);
        if (!USERNAME_RE.test(name)) throw new AuthError('invalidUsername');
        if (password.length < MIN_PASSWORD) throw new AuthError('passwordTooShort');
        const { data: free } = await supabase.rpc('username_available', { name });
        if (free === false) throw new AuthError('usernameTaken');
        const { error } = await supabase.auth.signUp({
          email: usernameToEmail(name),
          password,
          options: { data: { username: name } },
        });
        if (error) {
          if (/already registered|already exists/i.test(error.message)) throw new AuthError('usernameTaken');
          throw new AuthError('network');
        }
      },
      async signOut() {
        await supabase.auth.signOut();
      },
      async refreshProfile() {
        if (session) setProfile(await fetchProfile(session.user.id));
      },
    }),
    [session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
