// =============================================================================
// LIST DATA KELUARGA — SIM-PKK
// =============================================================================
// Halaman untuk melihat, mencari, dan mem-filter data Keluarga (KK).
// Menyesuaikan wilayah kerja user saat ini secara otomatis.
// =============================================================================

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Button, Badge } from "@/components/ui";

interface KeluargaListRow {
  id: string;
  no_kk: string;
  nama_kepala_keluarga: string;
  alamat: string;
  dasawisma_nama: string;
  nomor_rt: string;
  nomor_rw: string;
  nama_dusun: string;
  jumlah_anggota: number;
}

export default async function KeluargaPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; rt?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.query || "";
  const filterRt = params.rt || "";

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

  let keluargaList: KeluargaListRow[] = [];
  let isDbUnmigrated = false;

  try {
    // Bangun query keluarga berdasarkan role & wilayah tugas
    let query = supabase
      .from("keluarga")
      .select(`
        id,
        no_kk,
        nama_kepala_keluarga,
        alamat,
        kelompok_dasawisma (nama),
        wilayah_rt (nomor),
        wilayah_rw (nomor),
        wilayah_dusun (nama)
      `);

    // Terapkan filter wilayah sesuai dengan role
    if (role === "kader_dasawisma") {
      query = query.eq("input_by", user?.id);
    } else if (role === "verifikator_rt") {
      query = query.eq("rt_id", profile?.rt_id || "");
    } else if (role === "verifikator_rw") {
      query = query.eq("rw_id", profile?.rw_id || "");
    } else if (role === "admin_desa") {
      query = query.eq("desa_id", profile?.desa_id || "");
    } else if (role === "admin_kabupaten") {
      query = query.eq("kabupaten_id", profile?.kabupaten_id || "");
    }

    // Terapkan pencarian NIK/Nama jika ada
    if (searchQuery) {
      query = query.or(
        `no_kk.ilike.%${searchQuery}%,nama_kepala_keluarga.ilike.%${searchQuery}%`
      );
    }

    const { data: rows, error } = await query;

    if (error) throw error;

    // Untuk setiap keluarga, ambil jumlah anggotanya
    if (rows && rows.length > 0) {
      const formattedRows = await Promise.all(
        rows.map(async (row: any) => {
          const { count } = await supabase
            .from("anggota_keluarga")
            .select("id", { count: "exact", head: true })
            .eq("keluarga_id", row.id);

          return {
            id: row.id,
            no_kk: row.no_kk,
            nama_kepala_keluarga: row.nama_kepala_keluarga,
            alamat: row.alamat || "-",
            dasawisma_nama: row.kelompok_dasawisma?.nama || "-",
            nomor_rt: row.wilayah_rt?.nomor || "-",
            nomor_rw: row.wilayah_rw?.nomor || "-",
            nama_dusun: row.wilayah_dusun?.nama || "-",
            jumlah_anggota: count || 0,
          };
        })
      );
      keluargaList = formattedRows;
    }
  } catch (err) {
    console.warn("Table keluarga belum terbuat, memuat mock data:", err);
    isDbUnmigrated = true;

    // Data Simulasi / Mockup untuk UI
    keluargaList = [
      {
        id: "1",
        no_kk: "3404071206120001",
        nama_kepala_keluarga: "Budi Santoso",
        alamat: "Manggung, RT 01 / RW 01, Caturtunggal",
        dasawisma_nama: "Dasawisma Melati 1",
        nomor_rt: "001",
        nomor_rw: "001",
        nama_dusun: "Manggung",
        jumlah_anggota: 4,
      },
      {
        id: "2",
        no_kk: "3404072210140003",
        nama_kepala_keluarga: "Ahmad Dahlan",
        alamat: "Manggung, RT 01 / RW 01, Caturtunggal",
        dasawisma_nama: "Dasawisma Melati 1",
        nomor_rt: "001",
        nomor_rw: "001",
        nama_dusun: "Manggung",
        jumlah_anggota: 5,
      },
      {
        id: "3",
        no_kk: "3404071508080002",
        nama_kepala_keluarga: "Siti Rahma",
        alamat: "Manggung, RT 02 / RW 01, Caturtunggal",
        dasawisma_nama: "Dasawisma Melati 2",
        nomor_rt: "002",
        nomor_rw: "001",
        nama_dusun: "Manggung",
        jumlah_anggota: 3,
      },
    ];
  }

  return (
    <div className="space-y-6">
      {/* Banner Peringatan DB */}
      {isDbUnmigrated && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-kuning-50 border border-amber-200/50">
          <p className="text-xs text-amber-800 leading-relaxed font-semibold">
            ⚠️ Menampilkan <strong>Data Simulasi</strong> karena tabel keluarga tidak ditemukan di database.
          </p>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-neutral-charcoal">
            Daftar Keluarga
          </h2>
          <p className="text-sm text-neutral-slate">
            Kelola dan input pendataan keluarga Dasawisma.
          </p>
        </div>

        {role === "kader_dasawisma" && (
          <Link href="/dashboard/keluarga/input">
            <Button variant="primary">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Keluarga
            </Button>
          </Link>
        )}
      </div>

      {/* Filter / Search Bar */}
      <Card padding="md" className="shadow-sm">
        <form method="GET" action="/dashboard/keluarga" className="flex flex-col md:flex-row gap-3">
          {/* Input Pencarian */}
          <div className="flex-1 relative">
            <input
              type="text"
              name="query"
              defaultValue={searchQuery}
              placeholder="Cari berdasarkan No KK atau Kepala Keluarga..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-light rounded-button text-sm focus:border-tosca-500 focus:outline-none bg-neutral-snow/50"
            />
            <svg
              className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-gray"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Tombol Filter & Reset */}
          <div className="flex items-center gap-2">
            <Button type="submit" variant="secondary" size="md">
              Cari
            </Button>
            {searchQuery && (
              <Link href="/dashboard/keluarga">
                <Button variant="outline" size="md">
                  Reset
                </Button>
              </Link>
            )}
          </div>
        </form>
      </Card>

      {/* Grid atau Table */}
      <Card padding="none" className="overflow-hidden shadow-dropdown">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-neutral-snow border-b border-neutral-light text-neutral-slate font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Nomor KK</th>
                <th className="px-6 py-4">Kepala Keluarga</th>
                <th className="px-6 py-4">Wilayah Kerja</th>
                <th className="px-6 py-4 text-center">Jumlah Anggota</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light">
              {keluargaList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-slate">
                    Tidak ada data keluarga yang ditemukan.
                  </td>
                </tr>
              ) : (
                keluargaList.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-tosca-50/30 transition-all duration-200 group"
                  >
                    <td className="px-6 py-4.5 font-semibold text-neutral-charcoal font-mono text-xs">
                      {row.no_kk}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tosca-400 to-tosca-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {row.nama_kepala_keluarga.charAt(0)}
                        </div>
                        <span className="font-medium text-neutral-charcoal">{row.nama_kepala_keluarga}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-neutral-slate">
                      <div className="text-xs font-semibold text-neutral-charcoal">
                        {row.dasawisma_nama}
                      </div>
                      <div className="text-[10px] text-neutral-gray mt-0.5">
                        {row.nama_dusun} • RT {row.nomor_rt} / RW {row.nomor_rw}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <Badge variant="neutral">{row.jumlah_anggota} Jiwa</Badge>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="inline-flex gap-2">
                        <Link href={`/dashboard/keluarga/detail/${row.id}`}>
                          <Button variant="outline" size="sm">
                            Detail
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
