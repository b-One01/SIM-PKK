// =============================================================================
// DASHBOARD LAYOUT — SIM-PKK
// =============================================================================
// Layout utama untuk dashboard. Mengatur sidebar, header,
// dan pemilahan menu berdasarkan role pengguna.
// =============================================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { UserProfile } from "@/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Ambil user auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ambil user profile beserta nama wilayah tugasnya
  const { data: rawProfile, error } = await supabase
    .from("user_profiles")
    .select(`
      *,
      wilayah_kabupaten (nama),
      wilayah_kecamatan (nama),
      wilayah_desa (nama),
      wilayah_rw (nomor),
      wilayah_rt (nomor),
      kelompok_dasawisma (nama)
    `)
    .eq("id", user.id)
    .single();

  // Jika profile belum dibuat di DB (misal migrasi/seed baru berjalan sebagian),
  // buat profile default sementara agar tidak crash.
  let profile: UserProfile & {
    wilayah_kabupaten?: { nama: string };
    wilayah_kecamatan?: { nama: string };
    wilayah_desa?: { nama: string };
    wilayah_rw?: { nomor: string };
    wilayah_rt?: { nomor: string };
    kelompok_dasawisma?: { nama: string };
  } = rawProfile as any;

  if (error || !profile) {
    console.error("Gagal memuat profil pengguna:", error?.message);
    
    // Fallback profile jika record profil kosong / gagal dimuat
    profile = {
      id: user.id,
      nama_lengkap: user.user_metadata?.nama_lengkap || "User SIM-PKK",
      role: (user.user_metadata?.role || "kader_dasawisma") as any,
      nik: user.user_metadata?.nik || null,
      no_hp: null,
      avatar_url: null,
      kabupaten_id: null,
      kecamatan_id: null,
      desa_id: null,
      rw_id: null,
      rt_id: null,
      dasawisma_id: null,
      must_change_password: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Cek apakah wajib ganti password (kecuali untuk admin yang mem-bypass)
  if (profile.must_change_password) {
    // Kita bisa arahkan ke halaman ganti password jika diperlukan.
    // Sementara, biarkan masuk atau arahkan ke setting profil.
  }

  return (
    <div className="flex min-h-screen bg-neutral-snow">
      {/* Sidebar Navigasi - Desktop & Mobile */}
      <DashboardSidebar profile={profile} />

      {/* Konten Utama */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Header - Berisi info page title, notifikasi, dan profil dropdown */}
        <DashboardHeader profile={profile} />

        {/* Workspace Halaman */}
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
