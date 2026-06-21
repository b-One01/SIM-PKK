-- =============================================================================
-- MIGRASI 8: TAMBAH DUSUN ROLE & KOLOM DUSUN
-- =============================================================================

-- 1. Tambah kolom dusun_id di user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS dusun_id UUID REFERENCES public.wilayah_dusun(id) ON DELETE SET NULL;

-- 2. Update CHECK constraint untuk role agar mencakup verifikator_dusun
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (
    role IN (
        'super_admin',
        'admin_kabupaten',
        'admin_kecamatan',
        'admin_desa',
        'verifikator_dusun', -- Peran baru
        'verifikator_rw',
        'verifikator_rt',
        'kader_dasawisma'
    )
);

-- 3. Update trigger function handle_new_user() agar otomatis memetakan seluruh metadata wilayah
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, 
        nama_lengkap, 
        role, 
        nik,
        must_change_password,
        kabupaten_id,
        kecamatan_id,
        desa_id,
        dusun_id,
        rw_id,
        rt_id,
        dasawisma_id
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', 'User Baru'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'kader_dasawisma'),
        NEW.raw_user_meta_data->>'nik',
        TRUE,
        (NEW.raw_user_meta_data->>'kabupaten_id')::UUID,
        (NEW.raw_user_meta_data->>'kecamatan_id')::UUID,
        (NEW.raw_user_meta_data->>'desa_id')::UUID,
        (NEW.raw_user_meta_data->>'dusun_id')::UUID,
        (NEW.raw_user_meta_data->>'rw_id')::UUID,
        (NEW.raw_user_meta_data->>'rt_id')::UUID,
        (NEW.raw_user_meta_data->>'dasawisma_id')::UUID
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update helper function user_has_access_to_desa untuk menyertakan verifikator_dusun
CREATE OR REPLACE FUNCTION public.user_has_access_to_desa(target_desa_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_desa_id UUID;
    v_kecamatan_id UUID;
    v_kabupaten_id UUID;
BEGIN
    SELECT role, desa_id, kecamatan_id, kabupaten_id
    INTO v_role, v_desa_id, v_kecamatan_id, v_kabupaten_id
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF v_role IS NULL THEN RETURN FALSE; END IF;
    IF v_role = 'super_admin' THEN RETURN TRUE; END IF;
    
    IF v_role = 'admin_kabupaten' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.wilayah_desa 
            WHERE id = target_desa_id 
            AND kabupaten_id = v_kabupaten_id
        );
    END IF;
    
    IF v_role = 'admin_kecamatan' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.wilayah_desa 
            WHERE id = target_desa_id 
            AND kecamatan_id = v_kecamatan_id
        );
    END IF;
    
    -- Level Desa ke bawah (termasuk verifikator_dusun): hanya akses desa sendiri
    IF v_role IN ('admin_desa', 'verifikator_dusun', 'verifikator_rw', 'verifikator_rt', 'kader_dasawisma') THEN
        RETURN v_desa_id = target_desa_id;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
