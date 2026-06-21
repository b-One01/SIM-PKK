// =============================================================================
// SUPABASE CLIENT — Browser (Client Component)
// =============================================================================
// Digunakan di komponen client-side (use client).
// Menggunakan createBrowserClient dari @supabase/ssr.
// =============================================================================

import { createBrowserClient } from "@supabase/ssr";

/**
 * Membuat Supabase client untuk penggunaan di browser (client-side).
 * Client ini menggunakan anon key dan menghormati RLS policies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
