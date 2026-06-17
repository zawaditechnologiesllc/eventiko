import { createClient } from "@supabase/supabase-js";
import { config } from "../config";

/**
 * Service-role Supabase client. Bypasses RLS — use only on the trusted backend.
 */
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);
