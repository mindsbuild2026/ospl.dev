import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create dummy client if env vars are missing to prevent crash before user setup,
// but show error message
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (supabase) {
  supabase.auth.getUser().then((result) => {
    // console.log(result, "USER");
  });
}
