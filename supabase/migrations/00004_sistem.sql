-- =============================================================================
-- MIGRASI 4: TABEL SISTEM (Profil User, Verifikasi, Sync Log)
-- =============================================================================

-- ============================================
-- 1. USER PROFILES (Ekstensi dari auth.users Supabase)
-- ============================================
-- Menyimpan data profil dan role pengguna beserta wilayah tugasnya.
-- Relasi 1:1 dengan auth.users (Supabase Auth).
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identitas
    nama_lengkap VARCHAR(150) NOT NULL,
    no_hp VARCHAR(20),
    avatar_url TEXT,
    
    -- Role pengguna dalam sistem PKK
    role VARCHAR(30) NOT NULL CHECK (
        role IN (
            'super_admin',        -- Tier 4: Admin Kabupaten / Command Center
            'admin_kabupaten',    -- Tier 4: Admin level Kabupaten
            'admin_kecamatan',    -- Opsional: Admin level Kecamatan
            'admin_desa',         -- Tier 3: Operator utama level Desa
            'verifikator_rw',     -- Tier 2: Verifikator RW
            'verifikator_rt',     -- Tier 2: Verifikator RT
            'kader_dasawisma'     -- Tier 1: Kader input data
        )
    ),
    
    -- Wilayah tugas (nullable sesuai level role)
    kabupaten_id UUID REFERENCES wilayah_kabupaten(id),
    kecamatan_id UUID REFERENCES wilayah_kecamatan(id),
    desa_id UUID REFERENCES wilayah_desa(id),
    rw_id UUID REFERENCES wilayah_rw(id),   -- Khusus verifikator RW
    rt_id UUID REFERENCES wilayah_rt(id),   -- Khusus verifikator RT
    dasawisma_id UUID REFERENCES kelompok_dasawisma(id), -- Khusus kader

    -- Autentikasi berbasis NIK
    nik VARCHAR(16) UNIQUE, -- NIK sebagai username login
    must_change_password BOOLEAN DEFAULT TRUE, -- Wajib ganti password saat login pertama

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_role ON user_profiles(role);
CREATE INDEX idx_profile_desa ON user_profiles(desa_id);
CREATE INDEX idx_profile_kabupaten ON user_profiles(kabupaten_id);
CREATE INDEX idx_profile_kecamatan ON user_profiles(kecamatan_id);

COMMENT ON TABLE user_profiles IS 'Profil pengguna dengan role PKK dan wilayah tugas — ekstensi dari auth.users';

-- ============================================
-- 2. VERIFIKASI DATA (Sistem Approval Tier 2)
-- ============================================
-- RT/RW memverifikasi data yang diinput oleh Dasawisma.
-- Termasuk logika SLA: auto-approve setelah 7 hari tanpa aksi.
CREATE TABLE verifikasi_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Referensi data yang diverifikasi
    periode VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
    rt_id UUID REFERENCES wilayah_rt(id),
    rw_id UUID REFERENCES wilayah_rw(id),
    desa_id UUID NOT NULL REFERENCES wilayah_desa(id) ON DELETE CASCADE,
    
    -- Level verifikasi
    level_verifikasi VARCHAR(5) NOT NULL CHECK (
        level_verifikasi IN ('rt', 'rw')
    ),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'returned')
    ),
    
    -- Data summary (snapshot angka makro untuk RT/RW — tanpa data nama)
    summary_data JSONB DEFAULT '{}', -- Contoh: {"total_kk": 20, "total_balita": 5}
    
    -- Approval info
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    catatan TEXT, -- Catatan jika dikembalikan
    
    -- SLA Logic
    sla_deadline TIMESTAMPTZ, -- Deadline auto-approve (7 hari setelah submit)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verifikasi_periode ON verifikasi_data(periode);
CREATE INDEX idx_verifikasi_desa ON verifikasi_data(desa_id);
CREATE INDEX idx_verifikasi_status ON verifikasi_data(status);
CREATE INDEX idx_verifikasi_sla ON verifikasi_data(sla_deadline) WHERE status = 'pending';

COMMENT ON TABLE verifikasi_data IS 'Sistem verifikasi berjenjang (RT → RW) dengan SLA auto-approve 7 hari';

-- ============================================
-- 3. SYNC LOG (Log Sinkronisasi Offline)
-- ============================================
-- Mencatat setiap sinkronisasi data dari perangkat offline.
CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(100), -- ID unik perangkat (fingerprint)
    
    -- Detail sinkronisasi
    records_count INTEGER DEFAULT 0,      -- Jumlah record yang disinkronkan
    sync_type VARCHAR(20) DEFAULT 'push' CHECK (
        sync_type IN ('push', 'pull', 'full')
    ),
    status VARCHAR(20) DEFAULT 'success' CHECK (
        status IN ('success', 'partial', 'failed')
    ),
    error_detail TEXT, -- Detail error jika gagal
    
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_user ON sync_log(user_id);
CREATE INDEX idx_sync_time ON sync_log(synced_at);

COMMENT ON TABLE sync_log IS 'Log sinkronisasi data offline — mencatat setiap push/pull dari perangkat Dasawisma';

-- ============================================
-- TRIGGER: Auto-update timestamp
-- ============================================
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_verifikasi
    BEFORE UPDATE ON verifikasi_data
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================
-- TRIGGER: Auto-set SLA deadline pada verifikasi baru
-- ============================================
CREATE OR REPLACE FUNCTION set_sla_deadline()
RETURNS TRIGGER AS $$
BEGIN
    -- Set deadline SLA 7 hari setelah data disubmit
    NEW.sla_deadline := NOW() + INTERVAL '7 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_sla
    BEFORE INSERT ON verifikasi_data
    FOR EACH ROW EXECUTE FUNCTION set_sla_deadline();

-- ============================================
-- TRIGGER: Auto-create user_profile saat user baru dibuat
-- ============================================
-- CATATAN: Akun dibuat dari atas ke bawah (oleh admin), bukan self-registration.
-- Username = NIK (16 digit), password default = 'pkk12345'.
-- User WAJIB mengganti password saat login pertama kali.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (
        id, 
        nama_lengkap, 
        role, 
        nik,
        must_change_password,
        kabupaten_id,
        kecamatan_id,
        desa_id
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', 'User Baru'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'kader_dasawisma'),
        NEW.raw_user_meta_data->>'nik',
        TRUE, -- Wajib ganti password saat login pertama
        (NEW.raw_user_meta_data->>'kabupaten_id')::UUID,
        (NEW.raw_user_meta_data->>'kecamatan_id')::UUID,
        (NEW.raw_user_meta_data->>'desa_id')::UUID
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
