-- =============================================================================
-- MIGRASI 3: TABEL DATA SEKTORAL (PER POKJA)
-- =============================================================================
-- Data sektoral dipisahkan dari tabel anggota_keluarga agar:
-- 1. Schema lebih bersih dan normalized
-- 2. Mudah di-query terpisah per Pokja
-- 3. Mendukung "Magic Routing" via SQL Views
-- =============================================================================

-- ============================================
-- 1. DATA KESEHATAN (POKJA 4)
-- ============================================
-- Relasi 1:1 dengan anggota_keluarga
-- Berisi data: ibu hamil, menyusui, balita, stunting, KB, lansia
CREATE TABLE data_kesehatan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anggota_id UUID NOT NULL UNIQUE REFERENCES anggota_keluarga(id) ON DELETE CASCADE,
    
    -- Status Kesehatan Ibu
    is_hamil BOOLEAN DEFAULT FALSE,          -- Ibu Hamil
    is_menyusui BOOLEAN DEFAULT FALSE,       -- Ibu Menyusui
    
    -- Status Balita
    is_balita BOOLEAN DEFAULT FALSE,         -- Usia < 5 tahun
    status_stunting VARCHAR(20) CHECK (
        status_stunting IN ('normal', 'pendek', 'sangat_pendek', NULL)
    ),
    is_kms BOOLEAN DEFAULT FALSE,            -- Punya Kartu Menuju Sehat
    
    -- Status Lansia (> 60 tahun)
    is_lansia BOOLEAN DEFAULT FALSE,
    
    -- Keluarga Berencana
    jenis_kb VARCHAR(30) CHECK (
        jenis_kb IN (
            'tidak', 'pil', 'suntik', 'implant', 'iud', 
            'kondom', 'mow', 'mop', 'lainnya', NULL
        )
    ),

    -- Denormalisasi
    desa_id UUID NOT NULL REFERENCES wilayah_desa(id) ON DELETE RESTRICT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kesehatan_anggota ON data_kesehatan(anggota_id);
CREATE INDEX idx_kesehatan_desa ON data_kesehatan(desa_id);
CREATE INDEX idx_kesehatan_hamil ON data_kesehatan(is_hamil) WHERE is_hamil = TRUE;
CREATE INDEX idx_kesehatan_balita ON data_kesehatan(is_balita) WHERE is_balita = TRUE;
CREATE INDEX idx_kesehatan_stunting ON data_kesehatan(status_stunting) WHERE status_stunting IS NOT NULL AND status_stunting != 'normal';
CREATE INDEX idx_kesehatan_lansia ON data_kesehatan(is_lansia) WHERE is_lansia = TRUE;

COMMENT ON TABLE data_kesehatan IS 'Data sektoral Pokja 4 (Kesehatan) — ibu hamil, balita, stunting, KB, lansia';

-- ============================================
-- 2. DATA PERUMAHAN (POKJA 3)
-- ============================================
-- Relasi 1:1 dengan keluarga (bukan anggota, karena rumah per KK)
CREATE TABLE data_rumah (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keluarga_id UUID NOT NULL UNIQUE REFERENCES keluarga(id) ON DELETE CASCADE,
    
    -- Kriteria Rumah
    kriteria_rumah VARCHAR(20) DEFAULT 'sehat' CHECK (
        kriteria_rumah IN ('sehat', 'kurang_sehat')
    ),
    
    -- Sumber Air Bersih
    sumber_air VARCHAR(30) CHECK (
        sumber_air IN (
            'pdam', 'sumur_gali', 'sumur_pompa', 'mata_air', 
            'air_hujan', 'sungai', 'lainnya'
        )
    ),
    
    -- Sanitasi
    is_jamban BOOLEAN DEFAULT FALSE,         -- Punya Jamban/WC
    is_sampah BOOLEAN DEFAULT FALSE,         -- Kelola Sampah (ada TPS/dikelola)
    is_spal BOOLEAN DEFAULT FALSE,           -- Saluran Pembuangan Air Limbah
    
    -- Program PKK
    stiker_p4k BOOLEAN DEFAULT FALSE,        -- Stiker P4K (Program Perencanaan Persalinan)

    -- Denormalisasi
    desa_id UUID NOT NULL REFERENCES wilayah_desa(id) ON DELETE RESTRICT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rumah_keluarga ON data_rumah(keluarga_id);
CREATE INDEX idx_rumah_desa ON data_rumah(desa_id);
CREATE INDEX idx_rumah_kriteria ON data_rumah(kriteria_rumah);

COMMENT ON TABLE data_rumah IS 'Data sektoral Pokja 3 (Perumahan) — kondisi rumah, sanitasi, sumber air';

-- ============================================
-- 3. DATA EKONOMI (POKJA 2 & 3)
-- ============================================
-- Relasi 1:1 dengan keluarga
CREATE TABLE data_ekonomi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keluarga_id UUID NOT NULL UNIQUE REFERENCES keluarga(id) ON DELETE CASCADE,
    
    -- Usaha Peningkatan Pendapatan Keluarga (UP2K)
    is_up2k BOOLEAN DEFAULT FALSE,
    jenis_up2k VARCHAR(50), -- Contoh: 'makanan', 'kerajinan', 'pertanian', dll.
    
    -- Hatinya PKK (Halaman Asri Teratur Indah & Nyaman)
    is_hatinya_pkk BOOLEAN DEFAULT FALSE,
    jenis_pemanfaatan VARCHAR(50) CHECK (
        jenis_pemanfaatan IN (
            'toga', 'warung_hidup', 'tanaman_keras', 
            'peternakan', 'perikanan', 'lainnya', NULL
        )
    ),
    
    -- Koperasi
    is_koperasi BOOLEAN DEFAULT FALSE,
    
    -- Pendidikan Anak
    is_paud_bkb BOOLEAN DEFAULT FALSE,       -- PAUD / BKB (Bina Keluarga Balita)

    -- Denormalisasi
    desa_id UUID NOT NULL REFERENCES wilayah_desa(id) ON DELETE RESTRICT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ekonomi_keluarga ON data_ekonomi(keluarga_id);
CREATE INDEX idx_ekonomi_desa ON data_ekonomi(desa_id);
CREATE INDEX idx_ekonomi_up2k ON data_ekonomi(is_up2k) WHERE is_up2k = TRUE;

COMMENT ON TABLE data_ekonomi IS 'Data sektoral Pokja 2 & 3 (Ekonomi) — UP2K, pekarangan, koperasi, PAUD';

-- ============================================
-- 4. DATA KARAKTER (POKJA 1)
-- ============================================
-- Relasi 1:1 dengan anggota_keluarga
-- Berisi: kegiatan keagamaan, gotong royong, arisan
CREATE TABLE data_karakter (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anggota_id UUID NOT NULL UNIQUE REFERENCES anggota_keluarga(id) ON DELETE CASCADE,
    
    -- Penghayatan & Pengamalan Pancasila
    is_pengajian BOOLEAN DEFAULT FALSE,       -- Aktif kegiatan keagamaan
    is_gotong_royong BOOLEAN DEFAULT FALSE,   -- Aktif gotong royong
    is_arisan BOOLEAN DEFAULT FALSE,          -- Ikut arisan
    
    -- Kegiatan tambahan (array untuk fleksibilitas)
    kegiatan_lain TEXT[] DEFAULT '{}',        -- Contoh: ['karang_taruna', 'posyandu']

    -- Denormalisasi
    desa_id UUID NOT NULL REFERENCES wilayah_desa(id) ON DELETE RESTRICT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_karakter_anggota ON data_karakter(anggota_id);
CREATE INDEX idx_karakter_desa ON data_karakter(desa_id);

COMMENT ON TABLE data_karakter IS 'Data sektoral Pokja 1 (Karakter) — kegiatan keagamaan, gotong royong, arisan';

-- ============================================
-- TRIGGER: Auto-update timestamp untuk semua tabel sektoral
-- ============================================
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'data_kesehatan', 'data_rumah', 'data_ekonomi', 'data_karakter'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
            tbl
        );
    END LOOP;
END;
$$;
