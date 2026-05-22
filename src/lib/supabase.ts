// Supabase client + configuration flag. When env vars are absent (or you
// haven't created a project yet), `isSupabaseConfigured` is false and the
// auth UI shows a "Supabase not configured" notice instead of breaking.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// When not configured, we still export a value-shaped client so call sites
// can `import { supabase }` without conditionals — but the methods will be
// no-ops at runtime (and the `isSupabaseConfigured` guard prevents real use).
export const supabase: SupabaseClient | null =
  isSupabaseConfigured
    ? createClient(url as string, anonKey as string, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
