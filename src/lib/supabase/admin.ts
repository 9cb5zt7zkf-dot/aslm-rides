import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses row-level security. Used ONLY inside
// API routes for operations that must see across accounts (matching a
// ride to the nearest online driver). Never import this into a Client
// Component or expose the key with a NEXT_PUBLIC_ prefix.
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
