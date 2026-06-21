// =============================================================================
// OVERVIEW DASHBOARD — SIM-PKK
// =============================================================================
// Halaman utama dashboard dengan gradient stat cards,
// timeline verifikasi premium, dan info cards.
// =============================================================================

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Button, Badge } from "@/components/ui";

interface DashboardStats {
  totalKK: number;
  totalJiwa: number;
  totalBalita: number;
  totalBumil: number;
  totalStunting: number;
  totalLansia: number;
  isDbUnmigrated?: boolean;
}

export default async function DashboardOverviewPage() {
  const supabase = await createClient();

  // Ambil user auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ambil user profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const role = profile?.role || "kader_dasawisma";

  // Data stats awal
  let stats: DashboardStats = {
    totalKK: 0,
    totalJiwa: 0,
    totalBalita: 0,
    totalBumil: 0,
    totalStunting: 0,
    totalLansia: 0,
    isDbUnmigrated: false,
  };

  try {
    // 1. Coba lakukan query ke database. Jika table/view belum di-migrasi,
    //    PostgREST akan mereturn error dan ditangkap block catch.
    if (role === "kader_dasawisma") {
      // Kader Dasawisma: Ambil data miliknya saja
      const { count: kkCount, error: err1 } = await supabase
        .from("keluarga")
        .select("id", { count: "exact", head: true })
        .eq("input_by", user?.id);

      if (err1) throw err1;

      const { count: jiwaCount } = await supabase
        .from("anggota_keluarga")
        .select("id", { count: "exact", head: true })
        .eq("desa_id", profile?.desa_id || "");

      // Ambil data sektoral balita & bumil (gabung data_kesehatan)
      const { data: kesehatanData } = await supabase
        .from("data_kesehatan")
        .select("is_balita, is_hamil, is_lansia, status_stunting")
        .eq("desa_id", profile?.desa_id || "");

      const balita = kesehatanData?.filter((d) => d.is_balita).length || 0;
      const bumil = kesehatanData?.filter((d) => d.is_hamil).length || 0;
      const lansia = kesehatanData?.filter((d) => d.is_lansia).length || 0;
      const stunting =
        kesehatanData?.filter(
          (d) =>
            d.status_stunting === "pendek" ||
            d.status_stunting === "sangat_pendek"
        ).length || 0;

      stats = {
        totalKK: kkCount || 0,
        totalJiwa: jiwaCount || 0,
        totalBalita: balita,
        totalBumil: bumil,
        totalStunting: stunting,
        totalLansia: lansia,
      };
    } else if (role === "verifikator_rt" || role === "verifikator_rw") {
      // Verifikator RT/RW: Ambil dari view summary_rt
      const filterKey = role === "verifikator_rt" ? "rt_id" : "rw_id";
      const filterVal = role === "verifikator_rt" ? profile?.rt_id : profile?.rw_id;

      const { data: summaryRows, error: errSummary } = await supabase
        .from("v_summary_rt")
        .select("*")
        .eq(filterKey, filterVal || "");

      if (errSummary) throw errSummary;

      if (summaryRows && summaryRows.length > 0) {
        // Jumlahkan data jika ada beberapa baris (misal beda periode)
        const activeRow = summaryRows[0];
        stats = {
          totalKK: activeRow.total_kk || 0,
          totalJiwa: activeRow.total_jiwa || 0,
          totalBalita: activeRow.total_balita || 0,
          totalBumil: activeRow.total_bumil || 0,
          totalStunting: activeRow.total_stunting || 0,
          totalLansia: activeRow.total_lansia || 0,
        };
      }
    } else {
      // Admin Desa / Admin Kabupaten / Super Admin: Ambil dari v_summary_desa
      const { data: summaryDesa, error: errDesa } = await supabase
        .from("v_summary_desa")
        .select("*")
        .eq("desa_id", profile?.desa_id || "");

      if (errDesa) throw errDesa;

      if (summaryDesa && summaryDesa.length > 0) {
        const activeRow = summaryDesa[0];
        stats = {
          totalKK: activeRow.total_kk || 0,
          totalJiwa: activeRow.total_jiwa || 0,
          totalBalita: activeRow.total_balita || 0,
          totalBumil: activeRow.total_bumil || 0,
          totalStunting: activeRow.total_stunting || 0,
          totalLansia: activeRow.total_lansia || 0,
        };
      }
    }
  } catch (error: any) {
    console.warn("Koneksi database berhasil, namun terdeteksi tabel belum di-migrasi:", error.message);
    // Set flag unmigrated agar UI menampilkan panduan migrasi
    stats.isDbUnmigrated = true;
    
    // Set data dummy untuk visualisasi UI agar user bisa melihat mockup dashboard
    stats.totalKK = 24;
    stats.totalJiwa = 96;
    stats.totalBalita = 12;
    stats.totalBumil = 3;
    stats.totalStunting = 2;
    stats.totalLansia = 8;
  }

  // Stat card configurations
  const statCards = [
    {
      label: "Kepala Keluarga",
      value: stats.totalKK,
      unit: "KK",
      gradient: "from-tosca-500 to-tosca-600",
      iconBg: "bg-tosca-400/20",
      icon: (
        <svg className="w-6 h-6 text-tosca-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Anggota Keluarga",
      value: stats.totalJiwa,
      unit: "Jiwa",
      gradient: "from-tosca-400 to-tosca-500",
      iconBg: "bg-tosca-300/20",
      icon: (
        <svg className="w-6 h-6 text-tosca-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Balita / Stunting",
      value: stats.totalBalita,
      unit: null,
      extra: { label: "Stunting", value: stats.totalStunting },
      gradient: "from-kuning-400 to-kuning-500",
      iconBg: "bg-kuning-300/20",
      icon: (
        <svg className="w-6 h-6 text-kuning-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      label: "Ibu Hamil / Lansia",
      value: stats.totalBumil,
      unit: null,
      extra: { label: "Lansia", value: stats.totalLansia },
      gradient: "from-maroon-400 to-maroon-500",
      iconBg: "bg-maroon-300/20",
      icon: (
        <svg className="w-6 h-6 text-maroon-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Peringatan Migrasi Database */}
      {stats.isDbUnmigrated && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-kuning-50 border border-amber-200/50 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900 font-display">
                Database Migrasi Diperlukan
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Tabel database belum terdeteksi di Supabase. Halaman ini saat ini menampilkan <strong>Data Simulasi/Mockup</strong> untuk peninjauan UI.
                Silakan jalankan file migrasi di folder <code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-mono">supabase/migrations/</code> melalui SQL Editor Supabase.
              </p>
              <div className="mt-3">
                <Badge variant="warning">Mode Simulasi UI</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-neutral-charcoal">
            Overview Pendataan Bulanan
          </h2>
          <p className="text-sm text-neutral-slate mt-1">
            Status statistik keluarga per periode <strong>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</strong>.
          </p>
        </div>

        {role === "kader_dasawisma" && (
          <Link href="/dashboard/keluarga/input">
            <Button variant="primary" size="md">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Pendataan Baru
            </Button>
          </Link>
        )}
      </div>

      {/* Grid Kartu Statistik — Gradient Premium */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
          >
            {/* Decorative Circle */}
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5" />

            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${card.iconBg} mb-3`}>
              {card.icon}
            </div>

            {/* Label */}
            <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
              {card.label}
            </span>

            {/* Value */}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl md:text-4xl font-display font-bold">
                {card.value}
              </span>
              {card.unit && (
                <span className="text-sm font-medium text-white/60">{card.unit}</span>
              )}
            </div>

            {/* Extra Metric */}
            {card.extra && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <span className="text-xs text-white/60">
                  {card.extra.label}: <strong className="text-white">{card.extra.value}</strong>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grid Konten Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alur & Status Verifikasi */}
        <Card padding="lg" className="lg:col-span-2">
          <h3 className="font-display font-bold text-lg text-neutral-charcoal">
            Status Verifikasi & Validasi
          </h3>
          <p className="text-xs text-neutral-slate mt-1">
            Riwayat persetujuan data dari tingkat Dasawisma hingga Desa.
          </p>

          <div className="mt-6 relative border-l-2 border-gradient-to-b from-tosca-300 to-tosca-100 pl-6 space-y-6">
            {/* Step 1: Input Kader */}
            <div className="relative animate-fade-in">
              <span className="absolute -left-[31px] top-0 flex items-center justify-center w-5 h-5 rounded-full bg-tosca-500 ring-4 ring-tosca-50 shadow-sm">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-neutral-charcoal">
                  1. Input Kader Dasawisma
                </h4>
                <Badge variant="success">Selesai</Badge>
              </div>
              <p className="text-xs text-neutral-slate mt-1 leading-relaxed">
                Kader menginput data KK dan sektoral. Status tersimpan lokal dan disinkronkan ke server.
              </p>
            </div>

            {/* Step 2: Verifikasi RT */}
            <div className="relative">
              <span className="absolute -left-[31px] top-0 flex items-center justify-center w-5 h-5 rounded-full bg-kuning-400 ring-4 ring-kuning-50 shadow-sm animate-pulse-soft" />
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-neutral-charcoal">
                  2. Persetujuan RT
                </h4>
                <Badge variant="warning">Menunggu</Badge>
              </div>
              <p className="text-xs text-neutral-slate mt-1 leading-relaxed">
                Menunggu verifikasi statistik makro oleh ketua RT setempat. Batas waktu SLA: 7 Hari.
              </p>
            </div>

            {/* Step 3: Verifikasi RW */}
            <div className="relative opacity-50">
              <span className="absolute -left-[31px] top-0 flex items-center justify-center w-5 h-5 rounded-full bg-neutral-light ring-4 ring-white shadow-sm" />
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-neutral-charcoal">
                  3. Persetujuan RW
                </h4>
                <Badge variant="neutral">Belum Dimulai</Badge>
              </div>
              <p className="text-xs text-neutral-slate mt-1 leading-relaxed">
                Akan otomatis terbuka setelah verifikasi tingkat RT disetujui.
              </p>
            </div>
          </div>
        </Card>

        {/* Info Cepat / Akses Cepat */}
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tosca-500 via-tosca-600 to-tosca-700 p-6 text-white shadow-xl">
            {/* Decorative */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />

            <h3 className="font-display font-bold text-lg relative">Informasi PKK</h3>
            <p className="text-xs text-tosca-100 mt-2 leading-relaxed relative">
              SIM-PKK memudahkan pelaporan dan analisis program 10 Pokok Program PKK. 
              Gunakan menu <strong>Data Keluarga</strong> untuk melihat daftar, melakukan entri data baru, dan melihat status ekspor Pokja.
            </p>
            <div className="mt-5 relative">
              <Link href="/dashboard/keluarga">
                <Button variant="outline" size="sm" className="bg-white/20 text-white border-white/20 hover:bg-white/30 hover:translate-y-0">
                  Lihat Data Keluarga
                </Button>
              </Link>
            </div>
          </div>

          <Card padding="lg">
            <h3 className="font-display font-bold text-sm text-neutral-charcoal">Panduan Role Anda</h3>
            <div className="mt-4 space-y-3">
              <div className="flex gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-lg bg-tosca-50 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-tosca-500" />
                </span>
                <p className="text-xs text-neutral-slate leading-relaxed">
                  <strong className="text-neutral-charcoal">Kader</strong>: Input data KK, Anggota Keluarga, dan Data Sektoral bulanan.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-lg bg-kuning-50 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-kuning-500" />
                </span>
                <p className="text-xs text-neutral-slate leading-relaxed">
                  <strong className="text-neutral-charcoal">Verifikator RT/RW</strong>: Verifikasi summary wilayah (tanpa data individu) sebelum diteruskan ke admin desa.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-lg bg-maroon-50 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-maroon-500" />
                </span>
                <p className="text-xs text-neutral-slate leading-relaxed">
                  <strong className="text-neutral-charcoal">Admin Desa</strong>: Monitor seluruh wilayah, ekspor laporan PDF/Excel per Pokja.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
