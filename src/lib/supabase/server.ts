// =============================================================================
// SUPABASE CLIENT — Server (Server Component / Route Handler)
// =============================================================================
// Digunakan di Server Components, Route Handlers, dan Server Actions.
// Menggunakan createServerClient dari @supabase/ssr dengan cookies.
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Membuat Supabase client untuk penggunaan di server-side.
 * Otomatis mengelola session melalui cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll dipanggil dari Server Component — abaikan error.
            // Ini terjadi saat middleware sudah meng-refresh session.
          }
        },
      },
    }
  );
}

/**
 * Membuat Supabase Admin client — bypass RLS.
 * HANYA gunakan di API routes yang aman (cron jobs, admin operations).
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
