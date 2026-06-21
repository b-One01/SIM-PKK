// =============================================================================
// COMPONENT: LAPORAN TABS & TABLES — SIM-PKK
// =============================================================================
// Tab selector untuk memilih Pokja 1 s/d 4.
// Menyajikan data agregat dan tombol ekspor CSV client-side.
// =============================================================================

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button } from "@/components/ui";

interface LaporanTabsProps {
  activeTab: string;
  reportData: any[];
}

export default function LaporanTabs({ activeTab, reportData }: LaporanTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ubah tab aktif dengan mengganti query parameter di URL
  function handleTabChange(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/dashboard/laporan?${params.toString()}`);
  }

  // Fungsi Ekspor CSV di Client Side
  function exportToCSV() {
    if (reportData.length === 0) return;

    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeTab === "pokja1") {
      headers = [
        "RT",
        "RW",
        "Dusun",
        "Total KK",
        "Total Warga",
        "Aktif Pengajian",
        "Aktif Gotong Royong",
        "Ikut Arisan",
      ];
      rows = reportData.map((d) => [
        d.nomor_rt,
        d.nomor_rw,
        d.nama_dusun,
        d.total_kk.toString(),
        d.total_warga.toString(),
        d.jml_aktif_pengajian.toString(),
        d.jml_aktif_gotong_royong.toString(),
        d.jml_ikut_arisan.toString(),
      ]);
    } else if (activeTab === "pokja2") {
      headers = [
        "RT",
        "RW",
        "Dusun",
        "Total KK",
        "UP2K Usaha",
        "Anggota Koperasi",
        "Peserta PAUD/BKB",
      ];
      rows = reportData.map((d) => [
        d.nomor_rt,
        d.nomor_rw,
        d.nama_dusun,
        d.total_kk.toString(),
        d.jml_up2k.toString(),
        d.jml_koperasi.toString(),
        d.jml_paud_bkb.toString(),
      ]);
    } else if (activeTab === "pokja3") {
      headers = [
        "RT",
        "RW",
        "Dusun",
        "Total KK",
        "Rumah Sehat",
        "Rumah Kurang Sehat",
        "Punya Jamban",
        "Kelola Sampah",
        "Punya SPAL",
        "Hatinya PKK",
      ];
      rows = reportData.map((d) => [
        d.nomor_rt,
        d.nomor_rw,
        d.nama_dusun,
        d.total_kk.toString(),
        d.rumah_sehat.toString(),
        d.rumah_kurang_sehat.toString(),
        d.punya_jamban.toString(),
        d.kelola_sampah.toString(),
        d.punya_spal.toString(),
        d.jml_hatinya_pkk.toString(),
      ]);
    } else if (activeTab === "pokja4") {
      headers = [
        "RT",
        "RW",
        "Dusun",
        "Total KK",
        "Total Jiwa",
        "Ibu Hamil",
        "Ibu Menyusui",
        "Balita",
        "Kasus Stunting",
        "Lansia",
        "Akseptor KB",
      ];
      rows = reportData.map((d) => [
        d.nomor_rt,
        d.nomor_rw,
        d.nama_dusun,
        d.total_kk.toString(),
        d.total_jiwa.toString(),
        d.jml_bumil.toString(),
        d.jml_busui?.toString() || "0",
        d.jml_balita.toString(),
        d.jml_stunting.toString(),
        d.jml_lansia.toString(),
        d.jml_akseptor_kb.toString(),
      ]);
    }

    // Bangun string CSV
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_SIM-PKK_${activeTab}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // List tabs
  const tabList = [
    { id: "pokja1", label: "Pokja 1 (Karakter & Keagamaan)" },
    { id: "pokja2", label: "Pokja 2 (Ekonomi & Koperasi)" },
    { id: "pokja3", label: "Pokja 3 (Perumahan & Sanitasi)" },
    { id: "pokja4", label: "Pokja 4 (Kesehatan & Lansia)" },
  ];

  return (
    <div className="space-y-6">
      {/* Tombol Selektor Tab */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-light pb-3">
        {tabList.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-button transition-all duration-150 ${
              activeTab === tab.id
                ? "bg-tosca-500 text-white shadow-sm"
                : "bg-white text-neutral-slate hover:bg-neutral-snow border border-neutral-light"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Card Aksi Laporan */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-neutral-light shadow-sm">
        <span className="text-xs font-medium text-neutral-slate">
          Ditemukan **{reportData.length} baris** data rekap wilayah.
        </span>
        <Button variant="secondary" size="sm" onClick={exportToCSV} disabled={reportData.length === 0}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Ekspor Rekap (CSV)
        </Button>
      </div>

      {/* Tabel Data Pokja */}
      <Card padding="none" className="overflow-hidden shadow-dropdown">
        <div className="overflow-x-auto">
          {activeTab === "pokja1" && (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-neutral-snow border-b border-neutral-light text-neutral-slate font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">RT / RW</th>
                  <th className="px-6 py-4">Dusun</th>
                  <th className="px-6 py-4 text-center">Total KK</th>
                  <th className="px-6 py-4 text-center">Total Jiwa</th>
                  <th className="px-6 py-4 text-center">Aktif Pengajian</th>
                  <th className="px-6 py-4 text-center">Gotong Royong</th>
                  <th className="px-6 py-4 text-center">Ikut Arisan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-light">
                {reportData.map((row, i) => (
                  <tr key={i} className="hover:bg-tosca-50/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-neutral-charcoal">RT {row.nomor_rt} / RW {row.nomor_rw}</td>
                    <td className="px-6 py-4 text-neutral-slate">{row.nama_dusun}</td>
                    <td className="px-6 py-4 text-center font-medium text-neutral-charcoal">{row.total_kk}</td>
                    <td className="px-6 py-4 text-center text-neutral-charcoal">{row.total_warga}</td>
                    <td className="px-6 py-4 text-center text-neutral-slate">{row.jml_aktif_pengajian}</td>
                    <td className="px-6 py-4 text-center text-neutral-slate">{row.jml_aktif_gotong_royong}</td>
                    <td className="px-6 py-4 text-center text-neutral-slate">{row.jml_ikut_arisan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "pokja2" && (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-neutral-snow border-b border-neutral-light text-neutral-slate font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">RT / RW</th>
                  <th className="px-6 py-4">Dusun</th>
                  <th className="px-6 py-4 text-center">Total KK</th>
                  <th className="px-6 py-4 text-center">UP2K Usaha</th>
                  <th className="px-6 py-4 text-center">Koperasi</th>
                  <th className="px-6 py-4 text-center">Peserta PAUD/BKB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-light">
                {reportData.map((row, i) => (
                  <tr key={i} className="hover:bg-tosca-50/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-neutral-charcoal">RT {row.nomor_rt} / RW {row.nomor_rw}</td>
                    <td className="px-6 py-4 text-neutral-slate">{row.nama_dusun}</td>
                    <td className="px-6 py-4 text-center font-medium text-neutral-charcoal">{row.total_kk}</td>
                    <td className="px-6 py-4 text-center text-neutral-charcoal">{row.jml_up2k}</td>
                    <td className="px-6 py-4 text-center text-neutral-slate">{row.jml_koperasi}</td>
                    <td className="px-6 py-4 text-center text-neutral-slate">{row.jml_paud_bkb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "pokja3" && (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-neutral-snow border-b border-neutral-light text-neutral-slate font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">RT / RW</th>
                  <th className="px-6 py-4">Dusun</th>
                  <th className="px-6 py-4 text-center">Total KK</th>
                  <th className="px-6 py-4 text-center">Rumah Sehat</th>
                  <th className="px-6 py-4 text-center">Punya Jamban</th>
                  <th className="px-6 py-4 text-center">Kelola Sampah</th>
                  <th className="px-6 py-4 text-center">Punya SPAL</th>
                  <th className="px-6 py-4 text-center">Hatinya PKK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-light">
                {reportData.map((row, i) => (
                  <tr key={i} className="hover:bg-tosca-50/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-neutral-charcoal">RT {row.nomor_rt} / RW {row.nomor_rw}</td>
                    <td className="px-6 py-4 text-neutral-slate">{row.nama_dusun}</td>
                    <td className="px-6 py-4 text-center font-medium text-neutral-charcoal">{row.total_kk}</td>
                    <td className="px-6 py-4 text-center text-neutral-charcoal">
                      {row.rumah_sehat} <span className="text-[10px] text-neutral-slate">sehat</span>
                    </td>
                    <td className="px-6 py-4 text-center text-neutral-slate">{row.punya_jamban}</td>
                    <td className="px-6 py-4 text-center text-neutral-slate">{row.kelola_sampah}</td>
                    <td className="px-6 py-4 text-center text-neutral-slate">{row.punya_spal}</td>
                    <td className="px-6 py-4 text-center text-neutral-slate">{row.jml_hatinya_pkk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "pokja4" && (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-neutral-snow border-b border-neutral-light text-neutral-slate font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">RT / RW</th>
                  <th className="px-6 py-4">Dusun</th>
                  <th className="px-6 py-4 text-center">Total KK</th>
                  <th className="px-6 py-4 text-center">Total Jiwa</th>
                  <th className="px-6 py-4 text-center">Ibu Hamil</th>
                  <th className="px-6 py-4 text-center">Balita / Stunting</th>
                  <th className="px-6 py-4 text-center">Lansia</th>
                  <th className="px-6 py-4 text-center">KB Aktif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-light">
                {reportData.map((row, i) => (
                  <tr key={i} className="hover:bg-tosca-50/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-neutral-charcoal">RT {row.nomor_rt} / RW {row.nomor_rw}</td>
                    <td className="px-6 py-4 text-neutral-slate">{row.nama_dusun}</td>
                    <td className="px-6 py-4 text-center font-medium text-neutral-charcoal">{row.total_kk}</td>
                    <td className="px-6 py-4 text-center text-neutral-charcoal">{row.total_jiwa}</td>
                    <td className="px-6 py-4 text-center text-neutral-slate">{row.jml_bumil}</td>
                    <td className="px-6 py-4 text-center text-neutral-slate">
                      {row.jml_balita} / <span className="text-maroon-600 font-bold">{row.jml_stunting}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-neutral-slate">{row.jml_lansia}</td>
                    <td className="px-6 py-4 text-center text-neutral-slate">{row.jml_akseptor_kb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
