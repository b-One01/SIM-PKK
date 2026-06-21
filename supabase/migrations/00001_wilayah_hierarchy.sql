-- =============================================================================
-- MIGRASI 1: TABEL HIERARKI WILAYAH ADMINISTRATIF
-- =============================================================================
-- Struktur: Kabupaten → Kecamatan → Desa → Dusun → RW → RT → Dasawisma
-- Strategi: Denormalisasi ID induk (desa_id, kecamatan_id, kabupaten_id) 
--           di level bawah untuk mempercepat query dan RLS tanpa JOIN berlebih.
-- =============================================================================

-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. KABUPATEN / KOTA
-- ============================================
CREATE TABLE wilayah_kabupaten (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(100) NOT NULL,
    kode_bps VARCHAR(10) UNIQUE, -- Kode BPS resmi
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE wilayah_kabupaten IS 'Data Kabupaten/Kota — level tertinggi dalam hierarki wilayah PKK';

-- ============================================
-- 2. KECAMATAN
-- ============================================
CREATE TABLE wilayah_kecamatan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kabupaten_id UUID NOT NULL REFERENCES wilayah_kabupaten(id) ON DELETE CASCADE,
    nama VARCHAR(100) NOT NULL,
    kode_bps VARCHAR(15) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kecamatan_kabupaten ON wilayah_kecamatan(kabupaten_id);
COMMENT ON TABLE wilayah_kecamatan IS 'Data Kecamatan — di bawah Kabupaten';

-- ============================================
-- 3. DESA / KELURAHAN (Level kunci untuk RLS)
-- ============================================
CREATE TABLE wilayah_desa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kecamatan_id UUID NOT NULL REFERENCES wilayah_kecamatan(id) ON DELETE CASCADE,
    kabupaten_id UUID NOT NULL REFERENCES wilayah_kabupaten(id) ON DELETE CASCADE, -- Denormalisasi
    nama VARCHAR(100) NOT NULL,
    kode_bps VARCHAR(20) UNIQUE,
    jenis VARCHAR(20) DEFAULT 'desa' CHECK (jenis IN ('desa', 'kelurahan')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_desa_kecamatan ON wilayah_desa(kecamatan_id);
CREATE INDEX idx_desa_kabupaten ON wilayah_desa(kabupaten_id);
COMMENT ON TABLE wilayah_desa IS 'Data Desa/Kelurahan — level pivot utama untuk RLS dan data PKK';

-- ============================================
-- 4. DUSUN / LINGKUNGAN
-- ============================================
CREATE TABLE wilayah_dusun (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    desa_id UUID NOT NULL REFERENCES wilayah_desa(id) ON DELETE CASCADE,
    nama VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dusun_desa ON wilayah_dusun(desa_id);
COMMENT ON TABLE wilayah_dusun IS 'Data Dusun/Lingkungan — di bawah Desa';

-- ============================================
-- 5. RW (Rukun Warga)
-- ============================================
CREATE TABLE wilayah_rw (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dusun_id UUID NOT NULL REFERENCES wilayah_dusun(id) ON DELETE CASCADE,
    desa_id UUID NOT NULL REFERENCES wilayah_desa(id) ON DELETE CASCADE, -- Denormalisasi
    nomor VARCHAR(5) NOT NULL, -- Contoh: '001', '002'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dusun_id, nomor)
);

CREATE INDEX idx_rw_dusun ON wilayah_rw(dusun_id);
CREATE INDEX idx_rw_desa ON wilayah_rw(desa_id);
COMMENT ON TABLE wilayah_rw IS 'Data RW — denormalisasi desa_id untuk query cepat';

-- ============================================
-- 6. RT (Rukun Tetangga)
-- ============================================
CREATE TABLE wilayah_rt (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rw_id UUID NOT NULL REFERENCES wilayah_rw(id) ON DELETE CASCADE,
    desa_id UUID NOT NULL REFERENCES wilayah_desa(id) ON DELETE CASCADE, -- Denormalisasi
    nomor VARCHAR(5) NOT NULL, -- Contoh: '001', '002'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rw_id, nomor)
);

CREATE INDEX idx_rt_rw ON wilayah_rt(rw_id);
CREATE INDEX idx_rt_desa ON wilayah_rt(desa_id);
COMMENT ON TABLE wilayah_rt IS 'Data RT — denormalisasi desa_id untuk query cepat';

-- ============================================
-- 7. KELOMPOK DASAWISMA
-- ============================================
CREATE TABLE kelompok_dasawisma (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rt_id UUID NOT NULL REFERENCES wilayah_rt(id) ON DELETE CASCADE,
    desa_id UUID NOT NULL REFERENCES wilayah_desa(id) ON DELETE CASCADE, -- Denormalisasi
    nama VARCHAR(100) NOT NULL, -- Contoh: 'Dasawisma Melati'
    ketua VARCHAR(100), -- Nama ketua kelompok
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dasawisma_rt ON kelompok_dasawisma(rt_id);
CREATE INDEX idx_dasawisma_desa ON kelompok_dasawisma(desa_id);
COMMENT ON TABLE kelompok_dasawisma IS 'Kelompok Dasawisma (10-20 KK per kelompok) — unit terkecil pendataan PKK';

-- ============================================
-- TRIGGER: Auto-update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Terapkan trigger ke semua tabel wilayah
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'wilayah_kabupaten', 'wilayah_kecamatan', 'wilayah_desa',
        'wilayah_dusun', 'wilayah_rw', 'wilayah_rt', 'kelompok_dasawisma'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
            tbl
        );
    END LOOP;
END;
$$;
