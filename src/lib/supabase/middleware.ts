// =============================================================================
// SUPABASE MIDDLEWARE — Auth Session Refresh
// =============================================================================
// Middleware yang berjalan di setiap request untuk me-refresh session
// dan melindungi route yang membutuhkan autentikasi.
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware utama: refresh session token dan proteksi route.
 * Dipanggil otomatis oleh Next.js untuk setiap request.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // PENTING: Jangan menambahkan logika apapun antara createServerClient
  // dan supabase.auth.getUser(). Bug sederhana bisa menyebabkan user
  // ter-logout secara acak.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route yang tidak memerlukan autentikasi
  const publicRoutes = ["/login", "/api/cron"];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Jika user belum login dan mengakses route privat, redirect ke login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Jika user sudah login dan mengakses halaman login, redirect ke dashboard
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
