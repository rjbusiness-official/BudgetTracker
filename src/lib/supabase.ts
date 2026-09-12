import { createClient } from "@supabase/supabase-js";

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const supabaseHouseholdId = env.VITE_SUPABASE_HOUSEHOLD_ID || env.NEXT_PUBLIC_SUPABASE_HOUSEHOLD_ID || "ruru-joselle-household";
export const supabaseLoginUsername = env.VITE_SUPABASE_LOGIN_USERNAME || env.NEXT_PUBLIC_SUPABASE_LOGIN_USERNAME || "narding";
export const supabaseLoginEmail = env.VITE_SUPABASE_LOGIN_EMAIL || env.NEXT_PUBLIC_SUPABASE_LOGIN_EMAIL || "rj.business0416@gmail.com";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  : null;