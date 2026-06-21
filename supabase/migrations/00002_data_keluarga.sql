-- =============================================================================
-- MIGRASI 2: TABEL DATA KELUARGA & ANGGOTA KELUARGA
-- =============================================================================
-- Ini adalah tabel inti pendataan Dasawisma.
-- Filosofi: "Single Data Entry" — Kader Dasawisma input data sekali,
-- lalu sistem otomatis mendistribusikan ke Pokja 1-4 via SQL Views.
-- =============================================================================

-- ============================================
-- 1. KELUARGA (Kartu Keluarga)
-- ============================================
-- Denormalisasi penuh: menyimpan seluruh hierarki ID wilayah
-- agar query dan RLS bisa berjalan tanpa JOIN ke tabel wilayah.
CREATE TABLE keluarga (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identitas KK
    no_kk VARCHAR(16) NOT NULL, -- Nomor Kartu Keluarga (16 digit)
    nama_kepala_keluarga VARCHAR(150) NOT NULL,
    alamat TEXT,

    -- Relasi Wilayah (denormalisasi penuh)
    dasawisma_id UUID NOT NULL REFERENCES kelompok_dasawisma(id) ON DELETE RESTRICT,
    rt_id UUID NOT NULL REFERENCES wilayah_rt(id) ON DELETE RESTRICT,
    rw_id UUID NOT NULL REFERENCES wilayah_rw(id) ON DELETE RESTRICT,
    dusun_id UUID NOT NULL REFERENCES wilayah_dusun(id) ON DELETE RESTRICT,
    desa_id UUID NOT NULL REFERENCES wilayah_desa(id) ON DELETE RESTRICT,
    kecamatan_id UUID NOT NULL REFERENCES wilayah_kecamatan(id) ON DELETE RESTRICT,
    kabupaten_id UUID NOT NULL REFERENCES wilayah_kabupaten(id) ON DELETE RESTRICT,

    -- Periode pendataan (format: '2026-06' untuk bulan Juni 2026)
    periode VARCHAR(7) NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),

    -- Metadata
    input_by UUID REFERENCES auth.users(id), -- Kader yang menginput
    is_synced BOOLEAN DEFAULT TRUE, -- Apakah sudah tersinkron dari offline
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: satu KK hanya bisa didaftarkan sekali per periode
    UNIQUE(no_kk, periode)
);

-- Index untuk query umum
CREATE INDEX idx_keluarga_dasawisma ON keluarga(dasawisma_id);
CREATE INDEX idx_keluarga_rt ON keluarga(rt_id);
CREATE INDEX idx_keluarga_rw ON keluarga(rw_id);
CREATE INDEX idx_keluarga_dusun ON keluarga(dusun_id);
CREATE INDEX idx_keluarga_desa ON keluarga(desa_id);
CREATE INDEX idx_keluarga_kecamatan ON keluarga(kecamatan_id);
CREATE INDEX idx_keluarga_kabupaten ON keluarga(kabupaten_id);
CREATE INDEX idx_keluarga_periode ON keluarga(periode);
CREATE INDEX idx_keluarga_no_kk ON keluarga(no_kk);

COMMENT ON TABLE keluarga IS 'Data Kartu Keluarga — unit dasar pendataan PKK Dasawisma';

-- ============================================
-- 2. ANGGOTA KELUARGA (Per Individu)
-- ============================================
-- Setiap anggota dalam satu KK disimpan terpisah.
-- Data demografi dasar ada di sini, data sektoral di tabel terpisah.
CREATE TABLE anggota_keluarga (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keluarga_id UUID NOT NULL REFERENCES keluarga(id) ON DELETE CASCADE,
    
    -- Identitas
    nik VARCHAR(16), -- NIK (16 digit), nullable karena bayi mungkin belum punya
    nama VARCHAR(150) NOT NULL,
    
    -- Demografis
    hubungan_keluarga VARCHAR(30) NOT NULL CHECK (
        hubungan_keluarga IN (
            'kepala_keluarga', 'istri', 'anak', 'menantu', 
            'cucu', 'orang_tua', 'mertua', 'famili_lain', 'lainnya'
        )
    ),
    jenis_kelamin VARCHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
    tanggal_lahir DATE NOT NULL,
    tempat_lahir VARCHAR(100),
    
    -- Status Sosial
    agama VARCHAR(20) DEFAULT 'islam' CHECK (
        agama IN ('islam', 'kristen', 'katolik', 'hindu', 'buddha', 'konghucu', 'lainnya')
    ),
    pendidikan VARCHAR(30) CHECK (
        pendidikan IN (
            'tidak_sekolah', 'belum_sekolah', 'sd', 'smp', 'sma', 
            'd1', 'd2', 'd3', 's1', 's2', 's3'
        )
    ),
    pekerjaan VARCHAR(50), -- Free text: Petani, PNS, Wiraswasta, dll.
    status_perkawinan VARCHAR(20) DEFAULT 'belum_kawin' CHECK (
        status_perkawinan IN ('belum_kawin', 'kawin', 'cerai_hidup', 'cerai_mati')
    ),

    -- Toggle PKK
    is_pus BOOLEAN DEFAULT FALSE,        -- Pasangan Usia Subur
    is_wus BOOLEAN DEFAULT FALSE,        -- Wanita Usia Subur
    is_disabilitas BOOLEAN DEFAULT FALSE, -- Penyandang Disabilitas
    is_buta_huruf BOOLEAN DEFAULT FALSE, -- Buta Huruf / Tidak Bisa Baca Tulis

    -- Denormalisasi untuk query dan RLS
    desa_id UUID NOT NULL REFERENCES wilayah_desa(id) ON DELETE RESTRICT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query umum
CREATE INDEX idx_anggota_keluarga ON anggota_keluarga(keluarga_id);
CREATE INDEX idx_anggota_desa ON anggota_keluarga(desa_id);
CREATE INDEX idx_anggota_nik ON anggota_keluarga(nik);
CREATE INDEX idx_anggota_jenis_kelamin ON anggota_keluarga(jenis_kelamin);
CREATE INDEX idx_anggota_tanggal_lahir ON anggota_keluarga(tanggal_lahir);

COMMENT ON TABLE anggota_keluarga IS 'Data individu per anggota keluarga — relasi 1:N dengan tabel keluarga';

-- ============================================
-- TRIGGER: Auto-update timestamp
-- ============================================
CREATE TRIGGER set_updated_at_keluarga
    BEFORE UPDATE ON keluarga
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_anggota
    BEFORE UPDATE ON anggota_keluarga
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================
-- TRIGGER: Auto-fill desa_id pada anggota_keluarga dari keluarga
-- ============================================
CREATE OR REPLACE FUNCTION auto_fill_desa_id_anggota()
RETURNS TRIGGER AS $$
BEGIN
    -- Otomatis isi desa_id dari tabel keluarga induk
    IF NEW.desa_id IS NULL THEN
        SELECT desa_id INTO NEW.desa_id
        FROM keluarga
        WHERE id = NEW.keluarga_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_desa_anggota
    BEFORE INSERT ON anggota_keluarga
    FOR EACH ROW EXECUTE FUNCTION auto_fill_desa_id_anggota();
