import { Preferences } from "@capacitor/preferences";
import { createClient, SupabaseClient } from "@supabase/supabase-js"; // eslint-disable-line no-restricted-imports

import { isNativePlatform } from "./platform";

const customStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string): Promise<void> => {
    await Preferences.remove({ key });
  },
};

let supabase: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase URL and Anon Key must be provided in environment variables.",
      );
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: isNativePlatform() ? customStorageAdapter : undefined,
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        // Detects session changes across browser tabs
        detectSessionInUrl: true,
      },
    });
  }
  return supabase;
};
