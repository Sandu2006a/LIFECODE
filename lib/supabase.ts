import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Fallback placeholders prevent crash at build time when env vars are absent
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Server-side client (API routes)
export const supabase = createClient(url, key);

// Browser client (auth + session)
export function createSupabaseBrowser() {
  return createBrowserClient(url, key);
}
