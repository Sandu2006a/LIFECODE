import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Server-side client (API routes) — lazy so build doesn't fail without env vars
let _supabase: ReturnType<typeof createClient> | null = null;
export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Keep `supabase` as a named export for backward compatibility
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_t, prop) {
    return getSupabase()[prop as keyof ReturnType<typeof createClient>];
  },
});

// Browser client (auth + session)
export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, key);
}
