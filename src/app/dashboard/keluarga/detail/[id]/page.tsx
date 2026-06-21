// =============================================================================
// DETAIL KELUARGA — SIM-PKK
// =============================================================================
// Menampilkan informasi terperinci dari satu Kartu Keluarga.
// Menunjukkan data demografi anggota dan data sektoral Pokja terkait.
// =============================================================================

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Button, Badge } from "@/components/ui";

interface DetailMemberRow {
  id: string;
  nik: string;
  nama: string;
  hubungan_keluarga: string;
  jenis_kelamin: "L" | "P";
  usia: number;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  is_pus: boolean;
  is_wus: boolean;
  is_disabilitas: boolean;
  
  // Kesehatan
  is_hamil: boolean;
  is_balita: boolean;
  status_stunting: string | null;
  
  // Karakter
  is_pengajian: boolean;
  is_gotong_royong: boolean;
}

export default async function KeluargaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  let familyInfo: any = null;
  let membersList: DetailMemberRow[] = [];
  let houseInfo: any = null;
  let econInfo: any = null;
  let isDbUnmigrated = false;

  try {
    // 1. Fetch info keluarga
    const { data: fam, error: famErr } = await supabase
      .from("keluarga")
      .select(`
        *,
        kelompok_dasawisma (nama),
        wilayah_rt (nomor),
        wilayah_rw (nomor),
        wilayah_dusun (nama),
        wilayah_desa (nama)
      `)
      .eq("id", id)
      .single();

    if (famErr) throw famErr;
    familyInfo = fam;

    // 2. Fetch anggota keluarga
    const { data: members, error: memErr } = await supabase
      .from("anggota_keluarga")
      .select("*")
      .eq("keluarga_id", id);

    if (memErr) throw memErr;

    // 3. Ambil data sektoral tambahan
    if (members && members.length > 0) {
      membersList = await Promise.all(
        members.map(async (m: any) => {
          // Ambil data kesehatan (Pokja 4)
          const { data: kes } = await supabase
            .from("data_kesehatan")
            .select("*")
            .eq("anggota_id", m.id)
            .maybeSingle();

          // Ambil data karakter (Pokja 1)
          const { data: kar } = await supabase
            .from("data_karakter")
            .select("*")
            .eq("anggota_id", m.id)
            .maybeSingle();

          // Hitung usia
          const birthDate = new Date(m.tanggal_lahir);
          const age = new Date().getFullYear() - birthDate.getFullYear();

          return {
            id: m.id,
            nik: m.nik || "-",
            nama: m.nama,
            hubungan_keluarga: m.hubungan_keluarga,
            jenis_kelamin: m.jenis_kelamin,
            usia: age,
            agama: m.agama,
            pendidikan: m.pendidikan || "-",
            pekerjaan: m.pekerjaan || "-",
            is_pus: m.is_pus,
            is_wus: m.is_wus,
            is_disabilitas: m.is_disabilitas,
            is_hamil: kes?.is_hamil || false,
            is_balita: kes?.is_balita || false,
            status_stunting: kes?.status_stunting || null,
            is_pengajian: kar?.is_pengajian || false,
            is_gotong_royong: kar?.is_gotong_royong || false,
          };
        })
      );
    }

    // 4. Fetch data rumah (Pokja 3)
    const { data: rum } = await supabase
      .from("data_rumah")
      .select("*")
      .eq("keluarga_id", id)
      .maybeSingle();
    houseInfo = rum;

    // 5. Fetch data ekonomi (Pokja 2 & 3)
    const { data: eko } = await supabase
      .from("data_ekonomi")
      .select("*")
      .eq("keluarga_id", id)
      .maybeSingle();
    econInfo = eko;

  } catch (err) {
    console.warn("Gagal mengambil data detail KK, memuat mock data:", err);
    isDbUnmigrated = true;

    // Data Simulasi Detail Keluarga
    familyInfo = {
      no_kk: "3404071206120001",
      nama_kepala_keluarga: "Budi Santoso",
      alamat: "Manggung, RT 01 / RW 01, Caturtunggal",
      kelompok_dasawisma: { nama: "Dasawisma Melati 1" },
      wilayah_dusun: { nama: "Manggung" },
      wilayah_rt: { nomor: "001" },
      wilayah_rw: { nomor: "001" },
      wilayah_desa: { nama: "Caturtunggal" },
    };

    membersList = [
      {
        id: "m1",
        nik: "3404071206750001",
        nama: "Budi Santoso",
        hubungan_keluarga: "kepala_keluarga",
        jenis_kelamin: "L",
        usia: 51,
        agama: "islam",
        pendidikan: "sma",
        pekerjaan: "Wiraswasta",
        is_pus: true,
        is_wus: false,
        is_disabilitas: false,
        is_hamil: false,
        is_balita: false,
        status_stunting: null,
        is_pengajian: true,
        is_gotong_royong: true,
      },
      {
        id: "m2",
        nik: "3404074403800002",
        nama: "Siti Aminah",
        hubungan_keluarga: "istri",
        jenis_kelamin: "P",
        usia: 46,
        agama: "islam",
        pendidikan: "sma",
        pekerjaan: "Mengurus Rumah Tangga",
        is_pus: true,
        is_wus: true,
        is_disabilitas: false,
        is_hamil: false,
        is_balita: false,
        status_stunting: null,
        is_pengajian: true,
        is_gotong_royong: false,
      },
      {
        id: "m3",
        nik: "3404072210140003",
        nama: "Roni Santoso",
        hubungan_keluarga: "anak",
        jenis_kelamin: "L",
        usia: 11,
        agama: "islam",
        pendidikan: "sd",
        pekerjaan: "Pelajar",
        is_pus: false,
        is_wus: false,
        is_disabilitas: false,
        is_hamil: false,
        is_balita: false,
        status_stunting: null,
        is_pengajian: false,
        is_gotong_royong: true,
      },
    ];

    houseInfo = {
      kriteria_rumah: "sehat",
      sumber_air: "pdam",
      is_jamban: true,
      is_sampah: true,
      is_spal: true,
      stiker_p4k: true,
    };

    econInfo = {
      is_up2k: true,
      jenis_up2k: "Makanan Ringan",
      is_hatinya_pkk: true,
      jenis_pemanfaatan: "toga",
      is_koperasi: true,
      is_paud_bkb: false,
    };
  }

  // Teks label role yang user-friendly
  function getHubunganLabel(h: string) {
    switch (h) {
      case "kepala_keluarga": return "Kepala Keluarga";
      case "istri": return "Istri";
      case "anak": return "Anak";
      case "orang_tua": return "Orang Tua";
      default: return h;
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Peringatan DB */}
      {isDbUnmigrated && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-800 leading-relaxed font-semibold">
            ⚠️ Menampilkan **Data Simulasi** karena tabel keluarga tidak ditemukan di database.
          </p>
        </div>
      )}

      {/* Header & Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/keluarga" className="text-xs font-semibold text-tosca-600 hover:underline">
              &larr; Kembali ke Daftar
            </Link>
          </div>
          <h2 className="text-2xl font-display font-bold text-neutral-charcoal mt-1">
            Detail Keluarga Budi Santoso
          </h2>
          <p className="text-sm text-neutral-slate">
            No. KK: <span className="font-semibold text-neutral-charcoal">{familyInfo.no_kk}</span>
          </p>
        </div>
      </div>

      {/* Grid Informasi Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Info KK & Wilayah */}
        <Card padding="lg" className="shadow-sm">
          <h3 className="font-display font-bold text-sm text-neutral-charcoal border-b pb-2 uppercase tracking-wider">
            Informasi Kartu Keluarga
          </h3>
          
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <span className="text-neutral-gray block">Kepala Keluarga</span>
              <span className="font-bold text-neutral-charcoal text-sm">{familyInfo.nama_kepala_keluarga}</span>
            </div>
            <div>
              <span className="text-neutral-gray block">Alamat</span>
              <span className="font-medium text-neutral-charcoal">{familyInfo.alamat}</span>
            </div>
            <div>
              <span className="text-neutral-gray block">Dasawisma</span>
              <span className="font-bold text-tosca-600">{familyInfo.kelompok_dasawisma?.nama}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-light/50">
              <div>
                <span className="text-neutral-gray block">RT / RW</span>
                <span className="font-semibold text-neutral-charcoal">
                  RT {familyInfo.wilayah_rt?.nomor} / RW {familyInfo.wilayah_rw?.nomor}
                </span>
              </div>
              <div>
                <span className="text-neutral-gray block">Dusun</span>
                <span className="font-semibold text-neutral-charcoal">{familyInfo.wilayah_dusun?.nama}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pokja 3: Perumahan */}
        <Card padding="lg" className="shadow-sm">
          <h3 className="font-display font-bold text-sm text-neutral-charcoal border-b pb-2 uppercase tracking-wider">
            Pokja 3: Rumah & Sanitasi
          </h3>
          
          <div className="mt-4 space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-gray">Kriteria Kondisi Rumah</span>
              <Badge variant={houseInfo?.kriteria_rumah === "sehat" ? "success" : "warning"}>
                Rumah {houseInfo?.kriteria_rumah === "sehat" ? "Sehat" : "Kurang Sehat"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-gray">Sumber Air Bersih</span>
              <span className="font-semibold text-neutral-charcoal uppercase">{houseInfo?.sumber_air}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-light/50">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${houseInfo?.is_jamban ? "bg-tosca-500" : "bg-neutral-light"}`} />
                <span className="text-neutral-charcoal font-medium">Jamban Sehat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${houseInfo?.is_sampah ? "bg-tosca-500" : "bg-neutral-light"}`} />
                <span className="text-neutral-charcoal font-medium">Kelola Sampah</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${houseInfo?.is_spal ? "bg-tosca-500" : "bg-neutral-light"}`} />
                <span className="text-neutral-charcoal font-medium">Saluran SPAL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${houseInfo?.stiker_p4k ? "bg-tosca-500" : "bg-neutral-light"}`} />
                <span className="text-neutral-charcoal font-medium">Stiker P4K</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pokja 2 & 3: Ekonomi */}
        <Card padding="lg" className="shadow-sm">
          <h3 className="font-display font-bold text-sm text-neutral-charcoal border-b pb-2 uppercase tracking-wider">
            Pokja 2 & 3: Ekonomi Keluarga
          </h3>
          
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <span className="text-neutral-gray block">Usaha Peningkatan Keluarga (UP2K)</span>
              {econInfo?.is_up2k ? (
                <span className="font-bold text-tosca-600">Aktif — {econInfo.jenis_up2k}</span>
              ) : (
                <span className="text-neutral-slate font-medium">Tidak Aktif</span>
              )}
            </div>
            <div>
              <span className="text-neutral-gray block">Hatinya PKK (Pekarangan)</span>
              {econInfo?.is_hatinya_pkk ? (
                <span className="font-bold text-tosca-600">Aktif — {econInfo.jenis_pemanfaatan?.toUpperCase()}</span>
              ) : (
                <span className="text-neutral-slate font-medium">Tidak Aktif</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-light/50">
              <div>
                <span className="text-neutral-gray block">Koperasi</span>
                <span className="font-semibold text-neutral-charcoal">
                  {econInfo?.is_koperasi ? "Anggota Aktif" : "Bukan Anggota"}
                </span>
              </div>
              <div>
                <span className="text-neutral-gray block">PAUD / BKB</span>
                <span className="font-semibold text-neutral-charcoal">
                  {econInfo?.is_paud_bkb ? "Mengikuti" : "Tidak"}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabel Anggota Keluarga */}
      <Card padding="none" className="overflow-hidden shadow-dropdown">
        <div className="p-6 border-b border-neutral-light">
          <h3 className="font-display font-bold text-base text-neutral-charcoal">
            Daftar Anggota Keluarga ({membersList.length} Jiwa)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-neutral-snow border-b border-neutral-light text-neutral-slate font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Nama / NIK</th>
                <th className="px-6 py-4">Hubungan</th>
                <th className="px-6 py-4">L/P</th>
                <th className="px-6 py-4">Usia</th>
                <th className="px-6 py-4">Pendidikan / Kerja</th>
                <th className="px-6 py-4">Pokja 4 Kesehatan</th>
                <th className="px-6 py-4">Pokja 1 Karakter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light">
              {membersList.map((row) => (
                <tr key={row.id} className="hover:bg-tosca-50/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-neutral-charcoal">{row.nama}</div>
                    <div className="text-[10px] text-neutral-gray mt-0.5">NIK: {row.nik}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={row.hubungan_keluarga === "kepala_keluarga" ? "success" : "neutral"}>
                      {getHubunganLabel(row.hubungan_keluarga)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-neutral-charcoal font-semibold">{row.jenis_kelamin}</td>
                  <td className="px-6 py-4 text-neutral-charcoal">{row.usia} Tahun</td>
                  <td className="px-6 py-4 text-neutral-slate">
                    <div>{row.pendidikan.toUpperCase()}</div>
                    <div className="text-[10px] text-neutral-gray mt-0.5">{row.pekerjaan}</div>
                  </td>
                  <td className="px-6 py-4 text-neutral-slate text-xs space-y-1">
                    {row.is_hamil && <div className="text-pink-600 font-bold">🤰 Ibu Hamil</div>}
                    {row.is_balita && (
                      <div className="font-medium text-neutral-charcoal">
                        👶 Balita {row.status_stunting && `(${row.status_stunting})`}
                      </div>
                    )}
                    {row.is_pus && <div>💑 PUS</div>}
                    {row.is_wus && <div>👩 WUS</div>}
                  </td>
                  <td className="px-6 py-4 text-neutral-slate text-xs space-y-1">
                    {row.is_pengajian && <div>🕌 Aktif Keagamaan</div>}
                    {row.is_gotong_royong && <div>🤝 Aktif Gotong Royong</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
