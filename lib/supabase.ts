import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Server-side admin client — uses service_role key to bypass RLS in API routes
// Falls back to anon key if service role key not set (localhost dev)
const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;
export const supabase = createClient(url, serverKey, {
  auth: { persistSession: false },
});

// Browser client (auth + session) — uses anon key, respects RLS
export function createSupabaseBrowser() {
  return createBrowserClient(url, anonKey);
}
