// =============================================================================
// REKAPITULASI POKJA 1-4 — SIM-PKK
// =============================================================================
// Halaman agregasi laporan terbagi atas Pokja 1, 2, 3, dan 4.
// Admin Desa & Kabupaten dapat mengekspor rekap dalam format CSV/Excel.
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { Card, Button, Badge } from "@/components/ui";
import LaporanTabs from "@/components/dashboard/LaporanTabs";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab || "pokja1";
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

  let reportData: any[] = [];
  let isDbUnmigrated = false;

  try {
    let tableName = "";
    if (activeTab === "pokja1") tableName = "v_pokja1_karakter";
    else if (activeTab === "pokja2") tableName = "v_pokja2_ekonomi";
    else if (activeTab === "pokja3") tableName = "v_pokja3_perumahan";
    else if (activeTab === "pokja4") tableName = "v_pokja4_kesehatan";

    if (tableName) {
      let query = supabase.from(tableName).select("*");

      if (profile?.desa_id) {
        query = query.eq("desa_id", profile.desa_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      reportData = data || [];
    }
  } catch (err) {
    console.warn(`Gagal memuat view ${activeTab}, menggunakan data mockup:`, err);
    isDbUnmigrated = true;

    // Data Simulasi berdasarkan Tab yang Aktif
    if (activeTab === "pokja1") {
      reportData = [
        {
          nomor_rt: "001",
          nomor_rw: "001",
          nama_dusun: "Manggung",
          total_kk: 14,
          total_warga: 56,
          jml_aktif_pengajian: 45,
          jml_aktif_gotong_royong: 50,
          jml_ikut_arisan: 12,
        },
        {
          nomor_rt: "002",
          nomor_rw: "001",
          nama_dusun: "Manggung",
          total_kk: 10,
          total_warga: 40,
          jml_aktif_pengajian: 30,
          jml_aktif_gotong_royong: 38,
          jml_ikut_arisan: 8,
        },
      ];
    } else if (activeTab === "pokja2") {
      reportData = [
        {
          nomor_rt: "001",
          nomor_rw: "001",
          nama_dusun: "Manggung",
          total_kk: 14,
          jml_up2k: 4,
          jml_koperasi: 2,
          jml_paud_bkb: 6,
        },
        {
          nomor_rt: "002",
          nomor_rw: "001",
          nama_dusun: "Manggung",
          total_kk: 10,
          jml_up2k: 2,
          jml_koperasi: 1,
          jml_paud_bkb: 4,
        },
      ];
    } else if (activeTab === "pokja3") {
      reportData = [
        {
          nomor_rt: "001",
          nomor_rw: "001",
          nama_dusun: "Manggung",
          total_kk: 14,
          rumah_sehat: 12,
          rumah_kurang_sehat: 2,
          punya_jamban: 14,
          kelola_sampah: 13,
          punya_spal: 11,
          jml_hatinya_pkk: 5,
        },
        {
          nomor_rt: "002",
          nomor_rw: "001",
          nama_dusun: "Manggung",
          total_kk: 10,
          rumah_sehat: 9,
          rumah_kurang_sehat: 1,
          punya_jamban: 10,
          kelola_sampah: 8,
          punya_spal: 8,
          jml_hatinya_pkk: 3,
        },
      ];
    } else if (activeTab === "pokja4") {
      reportData = [
        {
          nomor_rt: "001",
          nomor_rw: "001",
          nama_dusun: "Manggung",
          total_kk: 14,
          total_jiwa: 56,
          jml_bumil: 2,
          jml_busui: 3,
          jml_balita: 12,
          jml_stunting: 1,
          jml_lansia: 8,
          jml_akseptor_kb: 10,
        },
        {
          nomor_rt: "002",
          nomor_rw: "001",
          nama_dusun: "Manggung",
          total_kk: 10,
          total_jiwa: 40,
          jml_bumil: 1,
          jml_busui: 2,
          jml_balita: 8,
          jml_stunting: 1,
          jml_lansia: 6,
          jml_akseptor_kb: 8,
        },
      ];
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Peringatan DB */}
      {isDbUnmigrated && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-800 leading-relaxed font-semibold">
            ⚠️ Menampilkan **Data Simulasi** karena view Pokja belum terdeteksi di database.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-neutral-charcoal">
            Rekapitulasi Pokja PKK
          </h2>
          <p className="text-sm text-neutral-slate">
            Unduh laporan rekapitulasi 10 Pokok Program PKK per Pokja.
          </p>
        </div>
      </div>

      {/* Tabs Menu Navigasi Pokja */}
      <LaporanTabs activeTab={activeTab} reportData={reportData} />
    </div>
  );
}
