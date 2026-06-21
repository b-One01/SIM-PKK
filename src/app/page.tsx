// =============================================================================
// HALAMAN UTAMA — SIM-PKK
// =============================================================================
// Redirect ke /login atau /dashboard berdasarkan status autentikasi.
// Middleware sudah menangani redirect, ini hanya fallback.
// =============================================================================

import { redirect } from "next/navigation";

export default function HomePage() {
  // Middleware akan redirect ke /login jika belum auth,
  // atau ke /dashboard jika sudah auth.
  // Ini hanya fallback jika middleware belum berjalan.
  redirect("/login");
}
