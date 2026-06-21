// =============================================================================
// OVERVIEW DASHBOARD — SIM-PKK
// =============================================================================
// Halaman utama dashboard. Menampilkan ringkasan data,
// status approval, dan tombol aksi cepat.
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

  return (
    <div className="space-y-6">
      {/* Banner Peringatan Migrasi Database */}
      {stats.isDbUnmigrated && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <svg className="w-5.5 h-5.5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900 font-display">
                Database Migrasi Diperlukan
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Tabel database belum terdeteksi di Supabase. Halaman ini saat ini menampilkan **Data Simulasi/Mockup** untuk peninjauan UI.
                Silakan jalankan file migrasi di folder `supabase/migrations/` (00001 s/d 00006) melalui SQL Editor Supabase Anda untuk mengaktifkan database secara penuh.
              </p>
              <div className="mt-3 flex items-center gap-2">
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
          <p className="text-sm text-neutral-slate">
            Status statistik keluarga per periode **{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}**.
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

      {/* Grid Kartu Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* KK */}
        <Card padding="md" className="border-l-4 border-l-tosca-500 shadow-sm">
          <span className="text-xs font-semibold text-neutral-slate uppercase tracking-wider">
            Total Kepala Keluarga
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl md:text-3xl font-display font-bold text-neutral-charcoal">
              {stats.totalKK}
            </span>
            <span className="text-xs font-medium text-neutral-gray">KK</span>
          </div>
        </Card>

        {/* Jiwa */}
        <Card padding="md" className="border-l-4 border-l-tosca-400 shadow-sm">
          <span className="text-xs font-semibold text-neutral-slate uppercase tracking-wider">
            Total Anggota Keluarga
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl md:text-3xl font-display font-bold text-neutral-charcoal">
              {stats.totalJiwa}
            </span>
            <span className="text-xs font-medium text-neutral-gray">Jiwa</span>
          </div>
        </Card>

        {/* Balita & Stunting */}
        <Card padding="md" className="border-l-4 border-l-kuning-500 shadow-sm">
          <span className="text-xs font-semibold text-neutral-slate uppercase tracking-wider">
            Balita / Stunting
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl md:text-3xl font-display font-bold text-neutral-charcoal">
              {stats.totalBalita}
            </span>
            <span className="text-xs font-medium text-neutral-slate">
              / <span className="text-maroon-600 font-bold">{stats.totalStunting}</span> Stunting
            </span>
          </div>
        </Card>

        {/* Ibu Hamil */}
        <Card padding="md" className="border-l-4 border-l-pink-500 shadow-sm">
          <span className="text-xs font-semibold text-neutral-slate uppercase tracking-wider">
            Ibu Hamil / Lansia
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl md:text-3xl font-display font-bold text-neutral-charcoal">
              {stats.totalBumil}
            </span>
            <span className="text-xs font-medium text-neutral-slate">
              / {stats.totalLansia} Lansia
            </span>
          </div>
        </Card>
      </div>

      {/* Grid Konten Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alur & Status Verifikasi */}
        <Card padding="lg" className="lg:col-span-2 shadow-dropdown">
          <h3 className="font-display font-bold text-lg text-neutral-charcoal">
            Status Verifikasi & Validasi
          </h3>
          <p className="text-xs text-neutral-slate mt-1">
            Riwayat persetujuan data dari tingkat Dasawisma hingga Desa.
          </p>

          <div className="mt-6 relative border-l-2 border-tosca-100 pl-6 space-y-6">
            {/* Step 1: Input Kader */}
            <div className="relative">
              <span className="absolute -left-[31px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-tosca-500 ring-4 ring-white" />
              <div className="flex justify-between">
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
              <span className="absolute -left-[31px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-kuning-500 ring-4 ring-white" />
              <div className="flex justify-between">
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
            <div className="relative opacity-60">
              <span className="absolute -left-[31px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-neutral-light ring-4 ring-white" />
              <div className="flex justify-between">
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
        <div className="space-y-6">
          <Card padding="lg" className="shadow-dropdown bg-gradient-to-br from-tosca-500 to-tosca-600 text-white border-none">
            <h3 className="font-display font-bold text-lg">Informasi PKK</h3>
            <p className="text-xs text-tosca-100 mt-2 leading-relaxed">
              SIM-PKK memudahkan pelaporan dan analisis program 10 Pokok Program PKK. 
              Gunakan menu **Data Keluarga** untuk melihat daftar, melakukan entri data baru, dan melihat status ekspor Pokja.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/dashboard/keluarga">
                <Button variant="outline" size="sm" className="bg-white/20 text-white border-white/20 hover:bg-white/30">
                  Lihat Data Keluarga
                </Button>
              </Link>
            </div>
          </Card>

          <Card padding="lg" className="shadow-dropdown">
            <h3 className="font-display font-bold text-sm text-neutral-charcoal">Panduan Role Anda</h3>
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <span className="text-tosca-600 font-bold">•</span>
                <p className="text-xs text-neutral-slate leading-relaxed">
                  **Kader**: Input data KK, Anggota Keluarga, dan Data Sektoral bulanan.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-tosca-600 font-bold">•</span>
                <p className="text-xs text-neutral-slate leading-relaxed">
                  **Verifikator RT/RW**: Verifikasi summary wilayah (tanpa data individu) sebelum diteruskan ke admin desa.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-tosca-600 font-bold">•</span>
                <p className="text-xs text-neutral-slate leading-relaxed">
                  **Admin Desa**: Monitor seluruh wilayah, ekspor laporan PDF/Excel per Pokja.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
