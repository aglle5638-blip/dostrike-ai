import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Return the Supabase client using environment variables.
  // In a real application, ensure NEXT_PUBLIC_SUPABASE_URL and ANON_KEY are set in .env.local
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );
}
