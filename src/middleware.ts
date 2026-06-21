// =============================================================================
// NEXT.JS MIDDLEWARE — Entry Point
// =============================================================================
// File ini harus berada di root folder `src/`.
// Menghubungkan middleware Supabase untuk session management.
// =============================================================================

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Jalankan middleware untuk semua route KECUALI:
    // - _next/static (file statis)
    // - _next/image (optimasi gambar)
    // - favicon.ico, sitemap.xml, robots.txt
    // - File aset (svg, png, jpg, dll.)
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
