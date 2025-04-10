import { createClient } from "@supabase/supabase-js"; // eslint-disable-line no-restricted-imports

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be provided in environment variables.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Recommended: Use localStorage for session persistence in SPAs
    persistSession: true,
    // Automatically refreshes the token when expired
    autoRefreshToken: true,
    // Detects session changes across browser tabs
    detectSessionInUrl: true, // Important for OAuth/magic link redirects
  },
});
