import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local file to load keys
const envPath = path.join(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseServiceKey = '';

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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  console.log("=== MEMULAI VERIFIKASI DATA DATABASE ===");

  const { data: kab, error: kabErr } = await supabase.from('wilayah_kabupaten').select('*');
  console.log("Kabupaten count:", kab ? kab.length : 0, kabErr ? kabErr.message : "Success");
  if (kab) console.log("Data Kabupaten:", kab);

  const { data: profiles, error: profErr } = await supabase.from('user_profiles').select('*');
  console.log("User Profiles count:", profiles ? profiles.length : 0, profErr ? profErr.message : "Success");
  if (profiles) console.log("Data Profiles:", profiles);
}

verify();
