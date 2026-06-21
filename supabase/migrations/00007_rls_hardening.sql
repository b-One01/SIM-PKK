-- =============================================================================
-- MIGRASI 7: RLS HARDENING — Perbaikan Policy Wilayah
-- =============================================================================
-- Sebelumnya, policy SELECT pada tabel wilayah tidak secara eksplisit
-- membatasi ke role 'authenticated', sehingga Supabase Dashboard menandainya
-- sebagai "UNRESTRICTED". Migrasi ini memperbaiki hal tersebut.
-- =============================================================================

-- Recreate select policies agar eksplisit menggunakan TO authenticated
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'wilayah_kabupaten', 'wilayah_kecamatan', 'wilayah_desa',
        'wilayah_dusun', 'wilayah_rw', 'wilayah_rt', 'kelompok_dasawisma'
    ] LOOP
        -- Drop policy lama
        EXECUTE format(
            'DROP POLICY IF EXISTS "select_%1$s" ON %1$I',
            tbl
        );
        
        -- Buat ulang dengan TO authenticated secara eksplisit
        EXECUTE format(
            'CREATE POLICY "select_%1$s" ON %1$I FOR SELECT
             TO authenticated USING (true)',
            tbl
        );
    END LOOP;
END;
$$;

-- Verifikasi: Semua tabel sekarang memiliki policy yang terbatas pada 'authenticated'
-- Query: SELECT tablename, policyname, roles FROM pg_policies WHERE schemaname = 'public';
