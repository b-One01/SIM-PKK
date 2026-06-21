// =============================================================================
// COMPONENT: DASHBOARD SIDEBAR — SIM-PKK
// =============================================================================
// Navigasi vertikal utama dashboard.
// Menyesuaikan menu berdasarkan role pengguna.
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfile } from "@/types/database";

interface DashboardSidebarProps {
  profile: UserProfile & {
    wilayah_kabupaten?: { nama: string };
    wilayah_kecamatan?: { nama: string };
    wilayah_desa?: { nama: string };
    wilayah_dusun?: { nama: string };
    wilayah_rw?: { nomor: string };
    wilayah_rt?: { nomor: string };
    kelompok_dasawisma?: { nama: string };
  };
}

export default function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Fungsi helper untuk menentukan wilayah kerja user
  function getWilayahKerja() {
    switch (profile.role) {
      case "super_admin":
        return "Command Center";
      case "admin_kabupaten":
        return `Kab. ${profile.wilayah_kabupaten?.nama || "-"}`;
      case "admin_kecamatan":
        return `Kec. ${profile.wilayah_kecamatan?.nama || "-"}`;
      case "admin_desa":
        return `Desa ${profile.wilayah_desa?.nama || "-"}`;
      case "verifikator_rw":
        return `RW ${profile.wilayah_rw?.nomor || "-"} / Desa ${profile.wilayah_desa?.nama || "-"}`;
      case "verifikator_rt":
        return `RT ${profile.wilayah_rt?.nomor || "-"} / RW ${profile.wilayah_rw?.nomor || "-"}`;
      case "kader_dasawisma":
        return profile.kelompok_dasawisma?.nama || "Kader Dasawisma";
      default:
        return "PKK";
    }
  }

  // Teks label role yang user-friendly
  function getRoleLabel() {
    switch (profile.role) {
      case "super_admin":
        return "Super Admin";
      case "admin_kabupaten":
        return "Admin Kabupaten";
      case "admin_kecamatan":
        return "Admin Kecamatan";
      case "admin_desa":
        return "Admin Desa";
      case "verifikator_rw":
        return "Verifikator RW";
      case "verifikator_rt":
        return "Verifikator RT";
      case "kader_dasawisma":
        return "Kader Dasawisma";
      default:
        return "Anggota";
    }
  }

  // Daftar menu lengkap
  const menus = [
    {
      title: "Ringkasan",
      href: "/dashboard",
      roles: ["super_admin", "admin_kabupaten", "admin_kecamatan", "admin_desa", "verifikator_rw", "verifikator_rt", "kader_dasawisma"],
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      title: "Data Keluarga",
      href: "/dashboard/keluarga",
      roles: ["super_admin", "admin_kabupaten", "admin_kecamatan", "admin_desa", "kader_dasawisma"],
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: "Verifikasi Data",
      href: "/dashboard/verifikasi",
      roles: ["super_admin", "verifikator_rw", "verifikator_rt", "admin_desa"],
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "Laporan & Pokja",
      href: "/dashboard/laporan",
      roles: ["super_admin", "admin_kabupaten", "admin_kecamatan", "admin_desa"],
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: "Manajemen User",
      href: "/dashboard/users",
      roles: ["super_admin", "admin_kabupaten", "admin_desa"],
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 00-2 2v1c0 .552.448 1 1 1h6c.552 0 1-.448 1-1v-1a2 2 0 00-2-2m6 0a2 2 0 00-2 2v1c0 .552.448 1 1 1h6c.552 0 1-.448 1-1v-1a2 2 0 00-2-2" />
        </svg>
      ),
    },
  ];

  // Saring menu berdasarkan role user
  const allowedMenus = menus.filter((menu) => menu.roles.includes(profile.role));

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <div className="fixed top-0 left-0 z-40 flex items-center justify-between w-full h-16 px-4 bg-white border-b border-neutral-light md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-tosca-500 to-tosca-600 shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="font-display font-bold text-lg text-neutral-charcoal">SIM-PKK</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-neutral-slate hover:bg-neutral-snow focus:outline-none"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Backdrop (Mobile) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-35 flex flex-col w-64 h-screen bg-white border-r border-neutral-light transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } pt-16 md:pt-0`}
      >
        {/* Logo - Desktop only */}
        <div className="hidden md:flex items-center gap-3 px-6 h-20 border-b border-neutral-light">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-tosca-500 to-tosca-600 shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-neutral-charcoal leading-tight">SIM-PKK</h2>
            <span className="text-[10px] font-semibold text-tosca-600 tracking-wider uppercase">Kabupaten Sleman</span>
          </div>
        </div>

        {/* User Card - Profil Ringkas */}
        <div className="p-4 mx-4 my-6 rounded-2xl bg-gradient-to-br from-tosca-50/50 to-neutral-snow border border-tosca-100/50">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-xl bg-tosca-100 flex items-center justify-center text-tosca-700 font-bold text-lg border border-tosca-200">
              {profile.nama_lengkap.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-neutral-charcoal truncate">
                {profile.nama_lengkap}
              </h4>
              <p className="text-xs font-medium text-neutral-slate">
                {getRoleLabel()}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-tosca-100/30 flex items-start gap-1.5">
            <svg className="w-3.5 h-3.5 text-tosca-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[11px] font-medium text-neutral-slate leading-tight truncate">
              {getWilayahKerja()}
            </span>
          </div>
        </div>

        {/* Menus */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {allowedMenus.map((menu) => {
            const isActive =
              pathname === menu.href ||
              (menu.href !== "/dashboard" && pathname.startsWith(menu.href));

            return (
              <Link
                key={menu.href}
                href={menu.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-button font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-tosca-500 text-white shadow-md shadow-tosca-500/20"
                    : "text-neutral-slate hover:bg-neutral-snow hover:text-neutral-charcoal"
                }`}
              >
                {menu.icon}
                {menu.title}
              </Link>
            );
          })}
        </nav>

        {/* Footer - Sign Out */}
        <div className="p-4 border-t border-neutral-light">
          <button
            onClick={async () => {
              const { createClient } = await import("@/lib/supabase/client");
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-button text-sm font-semibold text-maroon-600 hover:bg-maroon-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar Aplikasi
          </button>
        </div>
      </aside>
    </>
  );
}
