import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerConfig } from "@/lib/env/server";

export function createAdminClient() {
  const { url, secretKey } = getSupabaseServerConfig();

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}