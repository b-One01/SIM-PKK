// =============================================================================
// COMPONENT: DASHBOARD HEADER — SIM-PKK
// =============================================================================
// Header horizontal untuk dashboard.
// Menampilkan judul halaman dinamis dan profil pengguna di kanan atas.
// =============================================================================

"use client";

import { usePathname } from "next/navigation";
import { UserProfile } from "@/types/database";

interface DashboardHeaderProps {
  profile: UserProfile & {
    wilayah_kabupaten?: { nama: string };
    wilayah_kecamatan?: { nama: string };
    wilayah_desa?: { nama: string };
  };
}

export default function DashboardHeader({ profile }: DashboardHeaderProps) {
  const pathname = usePathname();

  // Helper untuk judul halaman dinamis berdasarkan rute URL
  function getPageTitle() {
    if (pathname === "/dashboard") return "Ringkasan Dashboard";
    if (pathname.startsWith("/dashboard/keluarga/input")) return "Input Data Keluarga";
    if (pathname.startsWith("/dashboard/keluarga")) return "Data Keluarga";
    if (pathname.startsWith("/dashboard/verifikasi")) return "Verifikasi & Approval";
    if (pathname.startsWith("/dashboard/laporan")) return "Laporan & Agregasi Pokja";
    if (pathname.startsWith("/dashboard/users")) return "Manajemen Pengguna";
    return "Dashboard";
  }

  return (
    <header className="sticky top-0 z-20 hidden md:flex items-center justify-between w-full h-20 px-8 bg-white/80 backdrop-blur-md border-b border-neutral-light">
      {/* Judul Halaman */}
      <div>
        <h1 className="font-display font-bold text-xl text-neutral-charcoal">
          {getPageTitle()}
        </h1>
        <p className="text-xs text-neutral-slate mt-0.5">
          Selamat datang kembali, {profile.nama_lengkap}.
        </p>
      </div>

      {/* Konten Kanan: Jam/Tanggal & Profil Status */}
      <div className="flex items-center gap-6">
        {/* Tanggal Hari Ini */}
        <div className="text-right">
          <p className="text-xs font-semibold text-neutral-charcoal">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <span className="text-[10px] text-neutral-slate font-medium">
            SIM-PKK terintegrasi
          </span>
        </div>

        {/* Garis Pembatas */}
        <div className="w-[1px] h-8 bg-neutral-light" />

        {/* Notifikasi Icon (Dummy) */}
        <div className="relative p-2 rounded-lg text-neutral-slate hover:bg-neutral-snow hover:text-neutral-charcoal cursor-pointer transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Badge Notifikasi */}
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-tosca-500 border-2 border-white" />
        </div>
      </div>
    </header>
  );
}
