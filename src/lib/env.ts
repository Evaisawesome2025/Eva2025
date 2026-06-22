// Runtime configuration detection. Lets the app run in "demo mode" (sample
// data, no auth gate) when Supabase / the database aren't configured yet, and
// switch on real auth + persistence the moment the env vars are present.

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
