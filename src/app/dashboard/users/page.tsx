// =============================================================================
// MANAJEMEN PENGGUNA — SIM-PKK
// =============================================================================
// Mengelola akun Kader Dasawisma dan Verifikator di desa/wilayah terkait.
// Hanya dapat diakses oleh Admin Desa, Admin Kabupaten, dan Super Admin.
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { Card, Button, Badge } from "@/components/ui";
import AddUserButtonWrapper from "@/components/dashboard/AddUserButtonWrapper";
import UserListTable from "@/components/dashboard/UserListTable";

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
    // Membaca daftar pengguna di desa/wilayah yang sama sesuai hak akses
    let query = supabase
      .from("user_profiles")
      .select(`
        id,
        nama_lengkap,
        role,
        nik,
        no_hp,
        is_active,
        wilayah_kabupaten (nama),
        wilayah_kecamatan (nama),
        wilayah_desa (nama),
        wilayah_dusun (nama),
        kelompok_dasawisma (nama),
        wilayah_rt (nomor),
        wilayah_rw (nomor)
      `);

    if (role === "admin_desa") {
      query = query.eq("desa_id", profile?.desa_id || "");
    } else if (role === "admin_kecamatan") {
      query = query.eq("kecamatan_id", profile?.kecamatan_id || "");
    } else if (role === "admin_kabupaten") {
      query = query.eq("kabupaten_id", profile?.kabupaten_id || "");
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    if (rows && rows.length > 0) {
      userList = rows.map((row: any) => {
        let wilayahStr = "-";
        if (row.role === "super_admin" || row.role === "admin_kabupaten") {
          wilayahStr = row.wilayah_kabupaten?.nama ? `Kab. ${row.wilayah_kabupaten.nama}` : "Kabupaten -";
        } else if (row.role === "admin_kecamatan") {
          wilayahStr = row.wilayah_kecamatan?.nama ? `Kec. ${row.wilayah_kecamatan.nama}` : "Kecamatan -";
        } else if (row.role === "admin_desa") {
          wilayahStr = row.wilayah_desa?.nama ? `Desa ${row.wilayah_desa.nama}` : "Desa -";
        } else if (row.role === "verifikator_dusun") {
          wilayahStr = row.wilayah_dusun?.nama ? `Dusun ${row.wilayah_dusun.nama}` : "Dusun -";
        } else if (row.role === "verifikator_rw") {
          wilayahStr = row.wilayah_rw?.nomor ? `RW ${row.wilayah_rw.nomor}` : "RW -";
        } else if (row.role === "verifikator_rt") {
          wilayahStr = row.wilayah_rt?.nomor ? `RT ${row.wilayah_rt.nomor}` : "RT -";
        } else if (row.role === "kader_dasawisma") {
          wilayahStr = row.kelompok_dasawisma?.nama ? `Dasawisma ${row.kelompok_dasawisma.nama}` : "Dasawisma -";
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
      <UserListTable userList={userList} />
    </div>
  );
}
