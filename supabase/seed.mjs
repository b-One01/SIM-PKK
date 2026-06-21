import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local file to load keys
const envPath = path.join(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseServiceKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('#') || !cleanLine) continue;
    const parts = cleanLine.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = val;
    }
  }
} catch (e) {
  console.error("Gagal membaca .env.local:", e.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables in .env.local");
  process.exit(1);
}

console.log("Supabase URL:", supabaseUrl);
console.log("Using Service Role Key for seeding...");

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function getOrCreate(table, query, insertData) {
  const { data: existing, error: findError } = await supabase
    .from(table)
    .select()
    .match(query)
    .maybeSingle();
    
  if (findError) {
    console.error(`Error checking ${table}:`, findError.message);
    throw findError;
  }
  
  if (existing) {
    console.log(`Record already exists in ${table}:`, existing.id);
    return existing;
  }
  
  console.log(`Inserting new record into ${table}...`);
  const { data: inserted, error: insertError } = await supabase
    .from(table)
    .insert(insertData)
    .select()
    .single();
    
  if (insertError) {
    console.error(`Error inserting into ${table}:`, insertError.message);
    throw insertError;
  }
  
  console.log(`Successfully inserted into ${table} with ID:`, inserted.id);
  return inserted;
}

async function seed() {
  try {
    console.log("--- MEMULAI SEEDING DATA ---");

    // 1. Seed Kabupaten
    const kab = await getOrCreate(
      'wilayah_kabupaten',
      { kode_bps: '3404' },
      { nama: 'Sleman', kode_bps: '3404' }
    );

    // 2. Seed Kecamatan
    const kec = await getOrCreate(
      'wilayah_kecamatan',
      { kode_bps: '3404070' },
      { kabupaten_id: kab.id, nama: 'Depok', kode_bps: '3404070' }
    );

    // 3. Seed Desa
    const des = await getOrCreate(
      'wilayah_desa',
      { kode_bps: '3404070001' },
      {
        kecamatan_id: kec.id,
        kabupaten_id: kab.id,
        nama: 'Caturtunggal',
        kode_bps: '3404070001',
        jenis: 'desa'
      }
    );

    // 4. Seed Dusun
    const dus = await getOrCreate(
      'wilayah_dusun',
      { desa_id: des.id, nama: 'Manggung' },
      { desa_id: des.id, nama: 'Manggung' }
    );

    // 5. Seed RW
    const rw = await getOrCreate(
      'wilayah_rw',
      { dusun_id: dus.id, nomor: '001' },
      { dusun_id: dus.id, desa_id: des.id, nomor: '001' }
    );

    // 6. Seed RT
    const rt = await getOrCreate(
      'wilayah_rt',
      { rw_id: rw.id, nomor: '001' },
      { rw_id: rw.id, desa_id: des.id, nomor: '001' }
    );

    // 7. Seed Dasawisma
    const dasa = await getOrCreate(
      'kelompok_dasawisma',
      { rt_id: rt.id, nama: 'Dasawisma Melati 1' },
      { rt_id: rt.id, desa_id: des.id, nama: 'Dasawisma Melati 1', ketua: 'Ibu Rahayu' }
    );

    // 8. Membuat Admin User Pertama (super_admin)
    console.log("Membuat akun admin pertama...");
    const nikAdmin = '3404071234560001';
    const emailAdmin = `${nikAdmin}@sim-pkk.local`;
    
    // Cek apakah user sudah ada di auth
    const { data: authList, error: authListErr } = await supabase.auth.admin.listUsers();
    if (authListErr) {
      console.error("Error checking auth users:", authListErr.message);
      return;
    }
    
    const existingUser = authList.users.find(u => u.email === emailAdmin);
    
    if (existingUser) {
      console.log("Akun admin sudah ada dengan ID:", existingUser.id);
      
      // Update metadata jika perlu
      const { error: updateErr } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            nama_lengkap: 'Super Admin PKK',
            role: 'super_admin',
            nik: nikAdmin,
            kabupaten_id: kab.id,
            kecamatan_id: kec.id,
            desa_id: des.id
          }
        }
      );
      if (updateErr) console.error("Gagal mengupdate metadata user auth:", updateErr.message);
      else console.log("Metadata user auth berhasil diperbarui.");
    } else {
      // Buat baru
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: emailAdmin,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          nama_lengkap: 'Super Admin PKK',
          role: 'super_admin',
          nik: nikAdmin,
          kabupaten_id: kab.id,
          kecamatan_id: kec.id,
          desa_id: des.id
        }
      });
      
      if (createErr) {
        console.error("Error membuat user baru:", createErr);
        return;
      }
      
      console.log("Akun admin berhasil dibuat!");
      console.log("Email/Username:", emailAdmin);
      console.log("NIK:", nikAdmin);
      console.log("Password:", "password123");
    }

    console.log("--- SEEDING SELESAI DENGAN SUKSES ---");
  } catch (err) {
    console.error("Kesalahan tidak terduga saat seeding:", err.message);
  }
}

seed();
