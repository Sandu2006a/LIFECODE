import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client (API routes)
export const supabase = createClient(url, key);

// Browser client (auth + session)
export function createSupabaseBrowser() {
  return createBrowserClient(url, key);
}
