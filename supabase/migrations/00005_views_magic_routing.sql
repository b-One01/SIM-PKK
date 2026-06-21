-- =============================================================================
-- MIGRASI 5: SQL VIEWS — MAGIC ROUTING POKJA 1-4
-- =============================================================================
-- Filosofi "Single Data Entry, Multi-Purpose Output":
-- Kader Dasawisma input data SEKALI, lalu view ini otomatis memilah
-- data ke masing-masing Pokja. Admin Desa tinggal klik "Export PDF"
-- dari view yang sesuai.
-- =============================================================================

-- ============================================
-- VIEW POKJA 1: Penghayatan & Pengamalan Pancasila
-- ============================================
-- Data: Kegiatan keagamaan, gotong royong, arisan
-- Dikelompokkan per RT/RW dalam satu desa
CREATE OR REPLACE VIEW v_pokja1_karakter AS
SELECT 
    dk.desa_id,
    wd.nama AS nama_desa,
    k.dusun_id,
    wdn.nama AS nama_dusun,
    k.rw_id,
    wrw.nomor AS nomor_rw,
    k.rt_id,
    wrt.nomor AS nomor_rt,
    k.periode,
    
    -- Agregasi per RT
    COUNT(DISTINCT k.id) AS total_kk,
    COUNT(DISTINCT ak.id) AS total_warga,
    COUNT(*) FILTER (WHERE dk.is_pengajian = TRUE) AS jml_aktif_pengajian,
    COUNT(*) FILTER (WHERE dk.is_gotong_royong = TRUE) AS jml_aktif_gotong_royong,
    COUNT(*) FILTER (WHERE dk.is_arisan = TRUE) AS jml_ikut_arisan,
    
    -- Persentase partisipasi
    ROUND(
        COUNT(*) FILTER (WHERE dk.is_pengajian = TRUE) * 100.0 / NULLIF(COUNT(DISTINCT ak.id), 0), 1
    ) AS persen_pengajian,
    ROUND(
        COUNT(*) FILTER (WHERE dk.is_gotong_royong = TRUE) * 100.0 / NULLIF(COUNT(DISTINCT ak.id), 0), 1
    ) AS persen_gotong_royong

FROM data_karakter dk
JOIN anggota_keluarga ak ON dk.anggota_id = ak.id
JOIN keluarga k ON ak.keluarga_id = k.id
JOIN wilayah_desa wd ON dk.desa_id = wd.id
JOIN wilayah_dusun wdn ON k.dusun_id = wdn.id
JOIN wilayah_rw wrw ON k.rw_id = wrw.id
JOIN wilayah_rt wrt ON k.rt_id = wrt.id
GROUP BY 
    dk.desa_id, wd.nama, k.dusun_id, wdn.nama,
    k.rw_id, wrw.nomor, k.rt_id, wrt.nomor, k.periode;

COMMENT ON VIEW v_pokja1_karakter IS 'View Magic Routing Pokja 1 — Rekapitulasi kegiatan keagamaan, gotong royong, arisan per RT';

-- ============================================
-- VIEW POKJA 2: Pendidikan & Keterampilan / Ekonomi
-- ============================================
-- Data: UP2K, koperasi, PAUD/BKB
CREATE OR REPLACE VIEW v_pokja2_ekonomi AS
SELECT 
    de.desa_id,
    wd.nama AS nama_desa,
    k.dusun_id,
    wdn.nama AS nama_dusun,
    k.rw_id,
    wrw.nomor AS nomor_rw,
    k.rt_id,
    wrt.nomor AS nomor_rt,
    k.periode,
    
    -- Agregasi
    COUNT(DISTINCT k.id) AS total_kk,
    COUNT(*) FILTER (WHERE de.is_up2k = TRUE) AS jml_up2k,
    COUNT(*) FILTER (WHERE de.is_koperasi = TRUE) AS jml_koperasi,
    COUNT(*) FILTER (WHERE de.is_paud_bkb = TRUE) AS jml_paud_bkb,
    
    -- Persentase
    ROUND(
        COUNT(*) FILTER (WHERE de.is_up2k = TRUE) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1
    ) AS persen_up2k,
    ROUND(
        COUNT(*) FILTER (WHERE de.is_koperasi = TRUE) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1
    ) AS persen_koperasi

FROM data_ekonomi de
JOIN keluarga k ON de.keluarga_id = k.id
JOIN wilayah_desa wd ON de.desa_id = wd.id
JOIN wilayah_dusun wdn ON k.dusun_id = wdn.id
JOIN wilayah_rw wrw ON k.rw_id = wrw.id
JOIN wilayah_rt wrt ON k.rt_id = wrt.id
GROUP BY 
    de.desa_id, wd.nama, k.dusun_id, wdn.nama,
    k.rw_id, wrw.nomor, k.rt_id, wrt.nomor, k.periode;

COMMENT ON VIEW v_pokja2_ekonomi IS 'View Magic Routing Pokja 2 — Rekapitulasi UP2K, koperasi, PAUD per RT';

-- ============================================
-- VIEW POKJA 3: Perumahan & Tata Laksana Rumah Tangga
-- ============================================
-- Data: Kondisi rumah, sumber air, sanitasi, pemanfaatan pekarangan
CREATE OR REPLACE VIEW v_pokja3_perumahan AS
SELECT 
    dr.desa_id,
    wd.nama AS nama_desa,
    k.dusun_id,
    wdn.nama AS nama_dusun,
    k.rw_id,
    wrw.nomor AS nomor_rw,
    k.rt_id,
    wrt.nomor AS nomor_rt,
    k.periode,
    
    -- Agregasi rumah
    COUNT(DISTINCT k.id) AS total_kk,
    COUNT(*) FILTER (WHERE dr.kriteria_rumah = 'sehat') AS rumah_sehat,
    COUNT(*) FILTER (WHERE dr.kriteria_rumah = 'kurang_sehat') AS rumah_kurang_sehat,
    
    -- Sanitasi
    COUNT(*) FILTER (WHERE dr.is_jamban = TRUE) AS punya_jamban,
    COUNT(*) FILTER (WHERE dr.is_sampah = TRUE) AS kelola_sampah,
    COUNT(*) FILTER (WHERE dr.is_spal = TRUE) AS punya_spal,
    
    -- Persentase sanitasi
    ROUND(
        COUNT(*) FILTER (WHERE dr.is_jamban = TRUE) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1
    ) AS persen_jamban,
    
    -- Hatinya PKK (dari tabel data_ekonomi — cross pokja)
    COALESCE(de_agg.jml_hatinya_pkk, 0) AS jml_hatinya_pkk

FROM data_rumah dr
JOIN keluarga k ON dr.keluarga_id = k.id
JOIN wilayah_desa wd ON dr.desa_id = wd.id
JOIN wilayah_dusun wdn ON k.dusun_id = wdn.id
JOIN wilayah_rw wrw ON k.rw_id = wrw.id
JOIN wilayah_rt wrt ON k.rt_id = wrt.id
LEFT JOIN LATERAL (
    SELECT COUNT(*) FILTER (WHERE de.is_hatinya_pkk = TRUE) AS jml_hatinya_pkk
    FROM data_ekonomi de
    WHERE de.keluarga_id = k.id
) de_agg ON TRUE
GROUP BY 
    dr.desa_id, wd.nama, k.dusun_id, wdn.nama,
    k.rw_id, wrw.nomor, k.rt_id, wrt.nomor, k.periode, de_agg.jml_hatinya_pkk;

COMMENT ON VIEW v_pokja3_perumahan IS 'View Magic Routing Pokja 3 — Rekapitulasi rumah sehat, sanitasi, pekarangan per RT';

-- ============================================
-- VIEW POKJA 4: Kesehatan
-- ============================================
-- Data: Ibu hamil, menyusui, balita, stunting, KB, lansia
CREATE OR REPLACE VIEW v_pokja4_kesehatan AS
SELECT 
    dks.desa_id,
    wd.nama AS nama_desa,
    k.dusun_id,
    wdn.nama AS nama_dusun,
    k.rw_id,
    wrw.nomor AS nomor_rw,
    k.rt_id,
    wrt.nomor AS nomor_rt,
    k.periode,
    
    -- Populasi
    COUNT(DISTINCT k.id) AS total_kk,
    COUNT(DISTINCT ak.id) AS total_jiwa,
    
    -- Kesehatan ibu
    COUNT(*) FILTER (WHERE dks.is_hamil = TRUE) AS jml_bumil,
    COUNT(*) FILTER (WHERE dks.is_menyusui = TRUE) AS jml_busui,
    
    -- Balita & Stunting
    COUNT(*) FILTER (WHERE dks.is_balita = TRUE) AS jml_balita,
    COUNT(*) FILTER (WHERE dks.status_stunting IN ('pendek', 'sangat_pendek')) AS jml_stunting,
    COUNT(*) FILTER (WHERE dks.is_kms = TRUE) AS jml_punya_kms,
    
    -- Lansia
    COUNT(*) FILTER (WHERE dks.is_lansia = TRUE) AS jml_lansia,
    
    -- KB
    COUNT(*) FILTER (WHERE dks.jenis_kb IS NOT NULL AND dks.jenis_kb != 'tidak') AS jml_akseptor_kb,
    
    -- PUS & WUS (dari anggota_keluarga)
    COUNT(*) FILTER (WHERE ak.is_pus = TRUE) AS jml_pus,
    COUNT(*) FILTER (WHERE ak.is_wus = TRUE) AS jml_wus,
    
    -- Persentase kritis
    ROUND(
        COUNT(*) FILTER (WHERE dks.status_stunting IN ('pendek', 'sangat_pendek')) * 100.0 
        / NULLIF(COUNT(*) FILTER (WHERE dks.is_balita = TRUE), 0), 1
    ) AS persen_stunting

FROM data_kesehatan dks
JOIN anggota_keluarga ak ON dks.anggota_id = ak.id
JOIN keluarga k ON ak.keluarga_id = k.id
JOIN wilayah_desa wd ON dks.desa_id = wd.id
JOIN wilayah_dusun wdn ON k.dusun_id = wdn.id
JOIN wilayah_rw wrw ON k.rw_id = wrw.id
JOIN wilayah_rt wrt ON k.rt_id = wrt.id
GROUP BY 
    dks.desa_id, wd.nama, k.dusun_id, wdn.nama,
    k.rw_id, wrw.nomor, k.rt_id, wrt.nomor, k.periode;

COMMENT ON VIEW v_pokja4_kesehatan IS 'View Magic Routing Pokja 4 — Rekapitulasi bumil, balita, stunting, KB, lansia per RT';

-- ============================================
-- VIEW SUMMARY RT (Untuk Tier 2 — Auto-Summary Approval)
-- ============================================
-- RT/RW hanya melihat angka makro, TANPA nama individu
CREATE OR REPLACE VIEW v_summary_rt AS
SELECT 
    k.rt_id,
    wrt.nomor AS nomor_rt,
    k.rw_id,
    wrw.nomor AS nomor_rw,
    k.dusun_id,
    wdn.nama AS nama_dusun,
    k.desa_id,
    wd.nama AS nama_desa,
    k.periode,
    
    -- Statistik makro
    COUNT(DISTINCT k.id) AS total_kk,
    COUNT(DISTINCT ak.id) AS total_jiwa,
    COUNT(DISTINCT ak.id) FILTER (WHERE ak.jenis_kelamin = 'L') AS total_laki,
    COUNT(DISTINCT ak.id) FILTER (WHERE ak.jenis_kelamin = 'P') AS total_perempuan,
    
    -- Kesehatan (dari tabel data_kesehatan)
    COUNT(*) FILTER (WHERE dks.is_balita = TRUE) AS total_balita,
    COUNT(*) FILTER (WHERE dks.is_hamil = TRUE) AS total_bumil,
    COUNT(*) FILTER (WHERE dks.is_lansia = TRUE) AS total_lansia,
    COUNT(*) FILTER (WHERE dks.status_stunting IN ('pendek', 'sangat_pendek')) AS total_stunting,
    
    -- Sosial (dari anggota_keluarga)
    COUNT(*) FILTER (WHERE ak.is_disabilitas = TRUE) AS total_disabilitas,
    COUNT(*) FILTER (WHERE ak.is_buta_huruf = TRUE) AS total_buta_huruf,
    
    -- Status verifikasi
    vd.status AS status_verifikasi,
    vd.sla_deadline

FROM keluarga k
JOIN wilayah_rt wrt ON k.rt_id = wrt.id
JOIN wilayah_rw wrw ON k.rw_id = wrw.id
JOIN wilayah_dusun wdn ON k.dusun_id = wdn.id
JOIN wilayah_desa wd ON k.desa_id = wd.id
LEFT JOIN anggota_keluarga ak ON k.id = ak.keluarga_id
LEFT JOIN data_kesehatan dks ON ak.id = dks.anggota_id
LEFT JOIN verifikasi_data vd ON (
    vd.rt_id = k.rt_id 
    AND vd.periode = k.periode 
    AND vd.level_verifikasi = 'rt'
)
GROUP BY 
    k.rt_id, wrt.nomor, k.rw_id, wrw.nomor,
    k.dusun_id, wdn.nama, k.desa_id, wd.nama,
    k.periode, vd.status, vd.sla_deadline;

COMMENT ON VIEW v_summary_rt IS 'Summary makro per RT untuk approval Tier 2 — tanpa data nama individu';

-- ============================================
-- VIEW SUMMARY DESA (Untuk Tier 3 — Dashboard Admin Desa)
-- ============================================
CREATE OR REPLACE VIEW v_summary_desa AS
SELECT 
    k.desa_id,
    wd.nama AS nama_desa,
    k.kecamatan_id,
    wkec.nama AS nama_kecamatan,
    k.kabupaten_id,
    wkab.nama AS nama_kabupaten,
    k.periode,
    
    -- Populasi
    COUNT(DISTINCT k.id) AS total_kk,
    COUNT(DISTINCT ak.id) AS total_jiwa,
    
    -- Demografi
    COUNT(DISTINCT ak.id) FILTER (WHERE ak.jenis_kelamin = 'L') AS total_laki,
    COUNT(DISTINCT ak.id) FILTER (WHERE ak.jenis_kelamin = 'P') AS total_perempuan,
    
    -- Kesehatan
    COUNT(*) FILTER (WHERE dks.is_balita = TRUE) AS total_balita,
    COUNT(*) FILTER (WHERE dks.is_hamil = TRUE) AS total_bumil,
    COUNT(*) FILTER (WHERE dks.status_stunting IN ('pendek', 'sangat_pendek')) AS total_stunting,
    COUNT(*) FILTER (WHERE dks.jenis_kb IS NOT NULL AND dks.jenis_kb != 'tidak') AS total_akseptor_kb,
    COUNT(*) FILTER (WHERE dks.is_lansia = TRUE) AS total_lansia,
    
    -- Rumah
    COUNT(DISTINCT dr.id) FILTER (WHERE dr.kriteria_rumah = 'sehat') AS total_rumah_sehat,
    COUNT(DISTINCT dr.id) FILTER (WHERE dr.is_jamban = TRUE) AS total_punya_jamban,
    
    -- Ekonomi
    COUNT(DISTINCT de.id) FILTER (WHERE de.is_up2k = TRUE) AS total_up2k,
    COUNT(DISTINCT de.id) FILTER (WHERE de.is_koperasi = TRUE) AS total_koperasi

FROM keluarga k
JOIN wilayah_desa wd ON k.desa_id = wd.id
JOIN wilayah_kecamatan wkec ON k.kecamatan_id = wkec.id
JOIN wilayah_kabupaten wkab ON k.kabupaten_id = wkab.id
LEFT JOIN anggota_keluarga ak ON k.id = ak.keluarga_id
LEFT JOIN data_kesehatan dks ON ak.id = dks.anggota_id
LEFT JOIN data_rumah dr ON k.id = dr.keluarga_id
LEFT JOIN data_ekonomi de ON k.id = de.keluarga_id
GROUP BY 
    k.desa_id, wd.nama, k.kecamatan_id, wkec.nama,
    k.kabupaten_id, wkab.nama, k.periode;

COMMENT ON VIEW v_summary_desa IS 'Summary makro per Desa untuk Dashboard Admin & Command Center Kabupaten';
