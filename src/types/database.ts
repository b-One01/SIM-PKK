// =============================================================================
// TIPE TYPESCRIPT — Database SIM-PKK
// =============================================================================
// Definisi tipe untuk semua tabel dan view di database Supabase.
// Digunakan di seluruh aplikasi untuk type safety.
// =============================================================================

// ============================
// ENUMS & CONSTANTS
// ============================

/** Role pengguna dalam sistem PKK */
export type UserRole =
  | "super_admin"
  | "admin_kabupaten"
  | "admin_kecamatan"
  | "admin_desa"
  | "verifikator_dusun"
  | "verifikator_rw"
  | "verifikator_rt"
  | "kader_dasawisma";

/** Status hubungan dalam keluarga */
export type HubunganKeluarga =
  | "kepala_keluarga"
  | "istri"
  | "anak"
  | "menantu"
  | "cucu"
  | "orang_tua"
  | "mertua"
  | "famili_lain"
  | "lainnya";

/** Jenis kelamin */
export type JenisKelamin = "L" | "P";

/** Agama */
export type Agama =
  | "islam"
  | "kristen"
  | "katolik"
  | "hindu"
  | "buddha"
  | "konghucu"
  | "lainnya";

/** Pendidikan terakhir */
export type Pendidikan =
  | "tidak_sekolah"
  | "belum_sekolah"
  | "sd"
  | "smp"
  | "sma"
  | "d1"
  | "d2"
  | "d3"
  | "s1"
  | "s2"
  | "s3";

/** Status perkawinan */
export type StatusPerkawinan =
  | "belum_kawin"
  | "kawin"
  | "cerai_hidup"
  | "cerai_mati";

/** Jenis KB */
export type JenisKB =
  | "tidak"
  | "pil"
  | "suntik"
  | "implant"
  | "iud"
  | "kondom"
  | "mow"
  | "mop"
  | "lainnya";

/** Status stunting */
export type StatusStunting = "normal" | "pendek" | "sangat_pendek";

/** Kriteria rumah */
export type KriteriaRumah = "sehat" | "kurang_sehat";

/** Sumber air bersih */
export type SumberAir =
  | "pdam"
  | "sumur_gali"
  | "sumur_pompa"
  | "mata_air"
  | "air_hujan"
  | "sungai"
  | "lainnya";

/** Jenis pemanfaatan pekarangan (Hatinya PKK) */
export type JenisPernanfaatan =
  | "toga"
  | "warung_hidup"
  | "tanaman_keras"
  | "peternakan"
  | "perikanan"
  | "lainnya";

/** Status verifikasi */
export type StatusVerifikasi = "pending" | "approved" | "returned";

/** Level verifikasi */
export type LevelVerifikasi = "rt" | "rw";

// ============================
// TABEL WILAYAH
// ============================

export interface WilayahKabupaten {
  id: string;
  nama: string;
  kode_bps: string | null;
  created_at: string;
  updated_at: string;
}

export interface WilayahKecamatan {
  id: string;
  kabupaten_id: string;
  nama: string;
  kode_bps: string | null;
  created_at: string;
  updated_at: string;
}

export interface WilayahDesa {
  id: string;
  kecamatan_id: string;
  kabupaten_id: string;
  nama: string;
  kode_bps: string | null;
  jenis: "desa" | "kelurahan";
  created_at: string;
  updated_at: string;
}

export interface WilayahDusun {
  id: string;
  desa_id: string;
  nama: string;
  created_at: string;
  updated_at: string;
}

export interface WilayahRW {
  id: string;
  dusun_id: string;
  desa_id: string;
  nomor: string;
  created_at: string;
  updated_at: string;
}

export interface WilayahRT {
  id: string;
  rw_id: string;
  desa_id: string;
  nomor: string;
  created_at: string;
  updated_at: string;
}

export interface KelompokDasawisma {
  id: string;
  rt_id: string;
  desa_id: string;
  nama: string;
  ketua: string | null;
  created_at: string;
  updated_at: string;
}

// ============================
// TABEL DATA INTI
// ============================

export interface Keluarga {
  id: string;
  no_kk: string;
  nama_kepala_keluarga: string;
  alamat: string | null;
  dasawisma_id: string;
  rt_id: string;
  rw_id: string;
  dusun_id: string;
  desa_id: string;
  kecamatan_id: string;
  kabupaten_id: string;
  periode: string; // Format: 'YYYY-MM'
  input_by: string | null;
  is_synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnggotaKeluarga {
  id: string;
  keluarga_id: string;
  nik: string | null;
  nama: string;
  hubungan_keluarga: HubunganKeluarga;
  jenis_kelamin: JenisKelamin;
  tanggal_lahir: string;
  tempat_lahir: string | null;
  agama: Agama;
  pendidikan: Pendidikan | null;
  pekerjaan: string | null;
  status_perkawinan: StatusPerkawinan;
  is_pus: boolean;
  is_wus: boolean;
  is_disabilitas: boolean;
  is_buta_huruf: boolean;
  desa_id: string;
  created_at: string;
  updated_at: string;
}

// ============================
// TABEL DATA SEKTORAL
// ============================

export interface DataKesehatan {
  id: string;
  anggota_id: string;
  is_hamil: boolean;
  is_menyusui: boolean;
  is_balita: boolean;
  status_stunting: StatusStunting | null;
  is_kms: boolean;
  is_lansia: boolean;
  jenis_kb: JenisKB | null;
  desa_id: string;
  created_at: string;
  updated_at: string;
}

export interface DataRumah {
  id: string;
  keluarga_id: string;
  kriteria_rumah: KriteriaRumah;
  sumber_air: SumberAir | null;
  is_jamban: boolean;
  is_sampah: boolean;
  is_spal: boolean;
  stiker_p4k: boolean;
  desa_id: string;
  created_at: string;
  updated_at: string;
}

export interface DataEkonomi {
  id: string;
  keluarga_id: string;
  is_up2k: boolean;
  jenis_up2k: string | null;
  is_hatinya_pkk: boolean;
  jenis_pemanfaatan: JenisPernanfaatan | null;
  is_koperasi: boolean;
  is_paud_bkb: boolean;
  desa_id: string;
  created_at: string;
  updated_at: string;
}

export interface DataKarakter {
  id: string;
  anggota_id: string;
  is_pengajian: boolean;
  is_gotong_royong: boolean;
  is_arisan: boolean;
  kegiatan_lain: string[];
  desa_id: string;
  created_at: string;
  updated_at: string;
}

// ============================
// TABEL SISTEM
// ============================

export interface UserProfile {
  id: string;
  nama_lengkap: string;
  no_hp: string | null;
  avatar_url: string | null;
  role: UserRole;
  kabupaten_id: string | null;
  kecamatan_id: string | null;
  desa_id: string | null;
  rw_id: string | null;
  rt_id: string | null;
  dasawisma_id: string | null;
  nik: string | null;
  must_change_password: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VerifikasiData {
  id: string;
  periode: string;
  rt_id: string | null;
  rw_id: string | null;
  desa_id: string;
  level_verifikasi: LevelVerifikasi;
  status: StatusVerifikasi;
  summary_data: Record<string, number>;
  approved_by: string | null;
  approved_at: string | null;
  catatan: string | null;
  sla_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  user_id: string;
  device_id: string | null;
  records_count: number;
  sync_type: "push" | "pull" | "full";
  status: "success" | "partial" | "failed";
  error_detail: string | null;
  synced_at: string;
}

// ============================
// VIEW TYPES (untuk Magic Routing)
// ============================

export interface ViewPokja1Karakter {
  desa_id: string;
  nama_desa: string;
  dusun_id: string;
  nama_dusun: string;
  rw_id: string;
  nomor_rw: string;
  rt_id: string;
  nomor_rt: string;
  periode: string;
  total_kk: number;
  total_warga: number;
  jml_aktif_pengajian: number;
  jml_aktif_gotong_royong: number;
  jml_ikut_arisan: number;
  persen_pengajian: number;
  persen_gotong_royong: number;
}

export interface ViewPokja4Kesehatan {
  desa_id: string;
  nama_desa: string;
  dusun_id: string;
  nama_dusun: string;
  rw_id: string;
  nomor_rw: string;
  rt_id: string;
  nomor_rt: string;
  periode: string;
  total_kk: number;
  total_jiwa: number;
  jml_bumil: number;
  jml_busui: number;
  jml_balita: number;
  jml_stunting: number;
  jml_punya_kms: number;
  jml_lansia: number;
  jml_akseptor_kb: number;
  jml_pus: number;
  jml_wus: number;
  persen_stunting: number;
}

export interface ViewSummaryRT {
  rt_id: string;
  nomor_rt: string;
  rw_id: string;
  nomor_rw: string;
  dusun_id: string;
  nama_dusun: string;
  desa_id: string;
  nama_desa: string;
  periode: string;
  total_kk: number;
  total_jiwa: number;
  total_laki: number;
  total_perempuan: number;
  total_balita: number;
  total_bumil: number;
  total_lansia: number;
  total_stunting: number;
  total_disabilitas: number;
  total_buta_huruf: number;
  status_verifikasi: StatusVerifikasi | null;
  sla_deadline: string | null;
}
