import { supabase } from './supabase';
import { getCachedTokens } from './auth-cache';

export type SessionInfo = {
  userId: string | null;
  accessToken: string | null;
};

export async function ensureSession(): Promise<SessionInfo> {
  let { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const fresh = await supabase.auth.getSession();
      session = fresh.data.session;
    }
  }
  if (!session) {
    const tokens = getCachedTokens();
    if (tokens) {
      const { data } = await supabase.auth.setSession(tokens);
      session = data?.session ?? null;
    }
  }
  return {
    userId: session?.user?.id ?? null,
    accessToken: session?.access_token ?? null,
  };
}

export function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
