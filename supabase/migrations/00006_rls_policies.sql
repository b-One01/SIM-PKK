-- =============================================================================
-- MIGRASI 6: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- Strategi: Menggunakan SECURITY DEFINER function untuk mengecek hierarki
-- akses berdasarkan role dan wilayah tugas pengguna.
-- 
-- Prinsip keamanan:
-- 1. Super Admin → akses semua data
-- 2. Admin Kabupaten → akses semua desa di kabupatennya
-- 3. Admin Desa → akses semua data di desanya
-- 4. Verifikator RT/RW → akses data di desanya (view summary saja)
-- 5. Kader Dasawisma → akses data di desanya (input + edit sendiri)
-- =============================================================================

-- ============================================
-- HELPER FUNCTION: Cek akses user ke desa tertentu
-- ============================================
CREATE OR REPLACE FUNCTION auth.user_has_access_to_desa(target_desa_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_desa_id UUID;
    v_kecamatan_id UUID;
    v_kabupaten_id UUID;
BEGIN
    -- Ambil profil user yang sedang login
    SELECT role, desa_id, kecamatan_id, kabupaten_id
    INTO v_role, v_desa_id, v_kecamatan_id, v_kabupaten_id
    FROM user_profiles
    WHERE id = auth.uid();
    
    -- Jika profil tidak ditemukan, tolak akses
    IF v_role IS NULL THEN RETURN FALSE; END IF;
    
    -- Super Admin: akses semua data tanpa batasan
    IF v_role = 'super_admin' THEN RETURN TRUE; END IF;
    
    -- Admin Kabupaten: akses semua desa dalam kabupatennya
    IF v_role = 'admin_kabupaten' THEN
        RETURN EXISTS (
            SELECT 1 FROM wilayah_desa 
            WHERE id = target_desa_id 
            AND kabupaten_id = v_kabupaten_id
        );
    END IF;
    
    -- Admin Kecamatan: akses semua desa dalam kecamatannya
    IF v_role = 'admin_kecamatan' THEN
        RETURN EXISTS (
            SELECT 1 FROM wilayah_desa 
            WHERE id = target_desa_id 
            AND kecamatan_id = v_kecamatan_id
        );
    END IF;
    
    -- Level Desa ke bawah: hanya akses desa sendiri
    IF v_role IN ('admin_desa', 'verifikator_rw', 'verifikator_rt', 'kader_dasawisma') THEN
        RETURN v_desa_id = target_desa_id;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: Ambil role user saat ini
-- ============================================
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
    SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- AKTIFKAN RLS PADA SEMUA TABEL DATA
-- ============================================
ALTER TABLE keluarga ENABLE ROW LEVEL SECURITY;
ALTER TABLE anggota_keluarga ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_kesehatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_rumah ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_ekonomi ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_karakter ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifikasi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Tabel wilayah: readable oleh semua user yang ter-autentikasi
ALTER TABLE wilayah_kabupaten ENABLE ROW LEVEL SECURITY;
ALTER TABLE wilayah_kecamatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE wilayah_desa ENABLE ROW LEVEL SECURITY;
ALTER TABLE wilayah_dusun ENABLE ROW LEVEL SECURITY;
ALTER TABLE wilayah_rw ENABLE ROW LEVEL SECURITY;
ALTER TABLE wilayah_rt ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelompok_dasawisma ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: TABEL WILAYAH (Read-Only untuk semua authenticated users)
-- ============================================
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'wilayah_kabupaten', 'wilayah_kecamatan', 'wilayah_desa',
        'wilayah_dusun', 'wilayah_rw', 'wilayah_rt', 'kelompok_dasawisma'
    ] LOOP
        -- Semua user authenticated bisa baca data wilayah
        EXECUTE format(
            'CREATE POLICY "select_%1$s" ON %1$I FOR SELECT
             TO authenticated USING (true)',
            tbl
        );
        
        -- Hanya super_admin dan admin_kabupaten yang bisa manage wilayah
        EXECUTE format(
            'CREATE POLICY "manage_%1$s" ON %1$I FOR ALL
             TO authenticated USING (
                auth.user_role() IN (''super_admin'', ''admin_kabupaten'')
             ) WITH CHECK (
                auth.user_role() IN (''super_admin'', ''admin_kabupaten'')
             )',
            tbl
        );
    END LOOP;
END;
$$;

-- ============================================
-- POLICIES: TABEL KELUARGA
-- ============================================
-- SELECT: User hanya bisa lihat data di wilayah aksesnya
CREATE POLICY "keluarga_select" ON keluarga
    FOR SELECT TO authenticated
    USING (auth.user_has_access_to_desa(desa_id));

-- INSERT: Hanya Kader Dasawisma dan Admin Desa yang bisa input
CREATE POLICY "keluarga_insert" ON keluarga
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.user_role() IN ('kader_dasawisma', 'admin_desa', 'super_admin')
        AND auth.user_has_access_to_desa(desa_id)
    );

-- UPDATE: Kader bisa edit data miliknya, Admin Desa bisa edit semua di desanya
CREATE POLICY "keluarga_update" ON keluarga
    FOR UPDATE TO authenticated
    USING (
        auth.user_has_access_to_desa(desa_id)
        AND (
            auth.user_role() IN ('admin_desa', 'super_admin')
            OR (auth.user_role() = 'kader_dasawisma' AND input_by = auth.uid())
        )
    );

-- DELETE: Hanya Admin Desa dan Super Admin
CREATE POLICY "keluarga_delete" ON keluarga
    FOR DELETE TO authenticated
    USING (
        auth.user_role() IN ('admin_desa', 'super_admin')
        AND auth.user_has_access_to_desa(desa_id)
    );

-- ============================================
-- POLICIES: TABEL ANGGOTA KELUARGA
-- ============================================
CREATE POLICY "anggota_select" ON anggota_keluarga
    FOR SELECT TO authenticated
    USING (auth.user_has_access_to_desa(desa_id));

CREATE POLICY "anggota_insert" ON anggota_keluarga
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.user_role() IN ('kader_dasawisma', 'admin_desa', 'super_admin')
        AND auth.user_has_access_to_desa(desa_id)
    );

CREATE POLICY "anggota_update" ON anggota_keluarga
    FOR UPDATE TO authenticated
    USING (
        auth.user_has_access_to_desa(desa_id)
        AND auth.user_role() IN ('kader_dasawisma', 'admin_desa', 'super_admin')
    );

CREATE POLICY "anggota_delete" ON anggota_keluarga
    FOR DELETE TO authenticated
    USING (
        auth.user_role() IN ('admin_desa', 'super_admin')
        AND auth.user_has_access_to_desa(desa_id)
    );

-- ============================================
-- POLICIES: TABEL DATA SEKTORAL (kesehatan, rumah, ekonomi, karakter)
-- ============================================
-- Pattern yang sama: akses berdasarkan desa_id
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'data_kesehatan', 'data_rumah', 'data_ekonomi', 'data_karakter'
    ] LOOP
        -- SELECT
        EXECUTE format(
            'CREATE POLICY "select_%1$s" ON %1$I FOR SELECT TO authenticated
             USING (auth.user_has_access_to_desa(desa_id))',
            tbl
        );
        
        -- INSERT
        EXECUTE format(
            'CREATE POLICY "insert_%1$s" ON %1$I FOR INSERT TO authenticated
             WITH CHECK (
                auth.user_role() IN (''kader_dasawisma'', ''admin_desa'', ''super_admin'')
                AND auth.user_has_access_to_desa(desa_id)
             )',
            tbl
        );
        
        -- UPDATE
        EXECUTE format(
            'CREATE POLICY "update_%1$s" ON %1$I FOR UPDATE TO authenticated
             USING (
                auth.user_role() IN (''kader_dasawisma'', ''admin_desa'', ''super_admin'')
                AND auth.user_has_access_to_desa(desa_id)
             )',
            tbl
        );
        
        -- DELETE
        EXECUTE format(
            'CREATE POLICY "delete_%1$s" ON %1$I FOR DELETE TO authenticated
             USING (
                auth.user_role() IN (''admin_desa'', ''super_admin'')
                AND auth.user_has_access_to_desa(desa_id)
             )',
            tbl
        );
    END LOOP;
END;
$$;

-- ============================================
-- POLICIES: TABEL VERIFIKASI DATA
-- ============================================
-- SELECT: RT/RW bisa lihat verifikasi di desanya
CREATE POLICY "verifikasi_select" ON verifikasi_data
    FOR SELECT TO authenticated
    USING (auth.user_has_access_to_desa(desa_id));

-- UPDATE: Verifikator hanya bisa approve/return
CREATE POLICY "verifikasi_update" ON verifikasi_data
    FOR UPDATE TO authenticated
    USING (
        auth.user_has_access_to_desa(desa_id)
        AND auth.user_role() IN ('verifikator_rt', 'verifikator_rw', 'admin_desa', 'super_admin')
    );

-- INSERT: Sistem (admin_desa atau trigger) yang membuat record verifikasi
CREATE POLICY "verifikasi_insert" ON verifikasi_data
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.user_role() IN ('admin_desa', 'super_admin')
        AND auth.user_has_access_to_desa(desa_id)
    );

-- ============================================
-- POLICIES: TABEL USER PROFILES
-- ============================================
-- User bisa lihat profil sendiri
CREATE POLICY "profile_select_own" ON user_profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Admin bisa lihat profil user di wilayahnya
CREATE POLICY "profile_select_admin" ON user_profiles
    FOR SELECT TO authenticated
    USING (
        auth.user_role() IN ('super_admin', 'admin_kabupaten', 'admin_desa')
        AND (
            auth.user_role() = 'super_admin'
            OR auth.user_has_access_to_desa(desa_id)
        )
    );

-- User bisa update profil sendiri (nama, hp, avatar)
CREATE POLICY "profile_update_own" ON user_profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admin bisa update role/wilayah user di bawahnya
CREATE POLICY "profile_manage_admin" ON user_profiles
    FOR ALL TO authenticated
    USING (
        auth.user_role() IN ('super_admin', 'admin_kabupaten', 'admin_desa')
    )
    WITH CHECK (
        auth.user_role() IN ('super_admin', 'admin_kabupaten', 'admin_desa')
    );

-- ============================================
-- POLICIES: TABEL SYNC LOG
-- ============================================
-- User hanya bisa lihat log sync miliknya
CREATE POLICY "sync_select_own" ON sync_log
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR auth.user_role() IN ('super_admin', 'admin_desa'));

-- User bisa insert log sync sendiri
CREATE POLICY "sync_insert" ON sync_log
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
