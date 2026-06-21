// =============================================================================
// MANAJEMEN PENGGUNA — SIM-PKK
// =============================================================================
// Mengelola akun Kader Dasawisma dan Verifikator di desa/wilayah terkait.
// Hanya dapat diakses oleh Admin Desa, Admin Kabupaten, dan Super Admin.
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { Card, Button, Badge } from "@/components/ui";
import AddUserButtonWrapper from "@/components/dashboard/AddUserButtonWrapper";

interface ProfileRow {
  id: string;
  nama_lengkap: string;
  role: string;
  nik: string;
  no_hp: string;
  is_active: boolean;
  wilayah: string;
}

export default async function UsersPage() {
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

  let userList: ProfileRow[] = [];
  let isDbUnmigrated = false;

  try {
    // Membaca daftar pengguna di desa yang sama
    let query = supabase
      .from("user_profiles")
      .select(`
        id,
        nama_lengkap,
        role,
        nik,
        no_hp,
        is_active,
        wilayah_desa (nama),
        kelompok_dasawisma (nama),
        wilayah_rt (nomor),
        wilayah_rw (nomor)
      `);

    if (role === "admin_desa") {
      query = query.eq("desa_id", profile?.desa_id || "");
    } else if (role === "admin_kabupaten") {
      query = query.eq("kabupaten_id", profile?.kabupaten_id || "");
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    if (rows && rows.length > 0) {
      userList = rows.map((row: any) => {
        let wilayahStr = "Desa";
        if (row.role === "kader_dasawisma") {
          wilayahStr = row.kelompok_dasawisma?.nama || "Dasawisma";
        } else if (row.role === "verifikator_rt") {
          wilayahStr = `RT ${row.wilayah_rt?.nomor || "-"}`;
        } else if (row.role === "verifikator_rw") {
          wilayahStr = `RW ${row.wilayah_rw?.nomor || "-"}`;
        } else {
          wilayahStr = `Desa ${row.wilayah_desa?.nama || "-"}`;
        }

        return {
          id: row.id,
          nama_lengkap: row.nama_lengkap,
          role: row.role,
          nik: row.nik || "-",
          no_hp: row.no_hp || "-",
          is_active: row.is_active,
          wilayah: wilayahStr,
        };
      });
    }
  } catch (err) {
    console.warn("Tabel user_profiles belum di-migrasi, memuat mock data:", err);
    isDbUnmigrated = true;

    // Data Simulasi
    userList = [
      {
        id: "usr-1",
        nama_lengkap: "Ibu Rahayu",
        role: "kader_dasawisma",
        nik: "3404074403800001",
        no_hp: "081234567890",
        is_active: true,
        wilayah: "Dasawisma Melati 1",
      },
      {
        id: "usr-2",
        nama_lengkap: "Pak RT Slamet",
        role: "verifikator_rt",
        nik: "3404071206750002",
        no_hp: "085678901234",
        is_active: true,
        wilayah: "RT 001",
      },
      {
        id: "usr-3",
        nama_lengkap: "Pak RW Joko",
        role: "verifikator_rw",
        nik: "3404070805700003",
        no_hp: "087789012345",
        is_active: true,
        wilayah: "RW 001",
      },
    ];
  }

  // Teks label role yang user-friendly
  function getRoleLabel(r: string) {
    switch (r) {
      case "super_admin": return "Super Admin";
      case "admin_kabupaten": return "Admin Kabupaten";
      case "admin_desa": return "Admin Desa";
      case "verifikator_rw": return "Verifikator RW";
      case "verifikator_rt": return "Verifikator RT";
      case "kader_dasawisma": return "Kader Dasawisma";
      default: return "Anggota";
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Peringatan DB */}
      {isDbUnmigrated && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-kuning-50 border border-amber-200/50">
          <p className="text-xs text-amber-800 leading-relaxed font-semibold">
            ⚠️ Menampilkan <strong>Data Simulasi</strong> karena tabel user profiles belum terdeteksi di database.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-neutral-charcoal">
            Manajemen Pengguna (User)
          </h2>
          <p className="text-sm text-neutral-slate">
            Kelola data dan wilayah tugas Kader Dasawisma serta Verifikator RT/RW.
          </p>
        </div>

        <AddUserButtonWrapper 
          profile={{
            role: profile?.role || "kader_dasawisma",
            kabupaten_id: profile?.kabupaten_id || null,
            kecamatan_id: profile?.kecamatan_id || null,
            desa_id: profile?.desa_id || null,
          }}
        />
      </div>

      {/* List Users */}
      <Card padding="none" className="overflow-hidden shadow-dropdown">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-neutral-snow border-b border-neutral-light text-neutral-slate font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">NIK (Username)</th>
                <th className="px-6 py-4">No. Handphone</th>
                <th className="px-6 py-4">Role Tugas</th>
                <th className="px-6 py-4">Wilayah Kerja</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light">
              {userList.map((row) => (
                <tr key={row.id} className="hover:bg-tosca-50/30 transition-all duration-200 group">
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tosca-400 to-tosca-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {row.nama_lengkap.charAt(0)}
                      </div>
                      <span className="font-semibold text-neutral-charcoal">{row.nama_lengkap}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 font-mono text-xs text-neutral-charcoal">{row.nik}</td>
                  <td className="px-6 py-4.5 text-neutral-slate">{row.no_hp}</td>
                  <td className="px-6 py-4.5">
                    <Badge variant={row.role === "kader_dasawisma" ? "neutral" : row.role.includes("admin") ? "success" : "warning"} showDot>
                      {getRoleLabel(row.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4.5 text-neutral-slate font-medium">{row.wilayah}</td>
                  <td className="px-6 py-4.5 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      row.is_active ? "bg-tosca-50 text-tosca-700" : "bg-neutral-light text-neutral-slate"
                    }`}>
                      {row.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    <Button variant="outline" size="sm">Edit</Button>
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
