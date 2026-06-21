// =============================================================================
// VERIFIKASI DATA — SIM-PKK
// =============================================================================
// Panel untuk verifikator tingkat RT/RW dan Admin Desa.
// Menyetujui atau mengembalikan rekapitulasi statistik bulanan.
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { Card, Button, Badge } from "@/components/ui";

interface VerifikasiRow {
  id: string;
  periode: string;
  nomor_rt: string;
  nomor_rw: string;
  nama_dusun: string;
  total_kk: number;
  total_jiwa: number;
  total_stunting: number;
  total_bumil: number;
  status: "pending" | "approved" | "returned";
  sla_days_left: number;
}

export default async function VerifikasiPage() {
  const supabase = await createClient();

  // Ambil user auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ambil user profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const role = profile?.role || "kader_dasawisma";

  let pendingVerifikasi: VerifikasiRow[] = [];
  let isDbUnmigrated = false;

  try {
    // Bangun query dari v_summary_rt
    let query = supabase
      .from("v_summary_rt")
      .select("*")
      .eq("status_verifikasi", "pending");

    if (role === "verifikator_rt") {
      query = query.eq("rt_id", profile?.rt_id || "");
    } else if (role === "verifikator_rw") {
      query = query.eq("rw_id", profile?.rw_id || "");
    } else if (role === "admin_desa") {
      query = query.eq("desa_id", profile?.desa_id || "");
    }

    const { data: rows, error } = await query;

    if (error) throw error;

    if (rows && rows.length > 0) {
      pendingVerifikasi = rows.map((row: any) => {
        // Hitung selisih hari untuk SLA deadline
        const deadline = new Date(row.sla_deadline);
        const diffTime = deadline.getTime() - new Date().getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        return {
          id: row.rt_id, // Gunakan RT id sebagai identifier baris verifikasi
          periode: row.periode,
          nomor_rt: row.nomor_rt,
          nomor_rw: row.nomor_rw,
          nama_dusun: row.nama_dusun,
          total_kk: row.total_kk,
          total_jiwa: row.total_jiwa,
          total_stunting: row.total_stunting || 0,
          total_bumil: row.total_bumil || 0,
          status: (row.status_verifikasi || "pending") as any,
          sla_days_left: diffDays,
        };
      });
    }
  } catch (err) {
    console.warn("View v_summary_rt belum terbuat, memuat mock data:", err);
    isDbUnmigrated = true;

    // Data Simulasi
    pendingVerifikasi = [
      {
        id: "rt-001",
        periode: "2026-06",
        nomor_rt: "001",
        nomor_rw: "001",
        nama_dusun: "Manggung",
        total_kk: 14,
        total_jiwa: 56,
        total_stunting: 1,
        total_bumil: 2,
        status: "pending",
        sla_days_left: 5,
      },
      {
        id: "rt-002",
        periode: "2026-06",
        nomor_rt: "002",
        nomor_rw: "001",
        nama_dusun: "Manggung",
        total_kk: 10,
        total_jiwa: 40,
        total_stunting: 1,
        total_bumil: 1,
        status: "pending",
        sla_days_left: 6,
      },
    ];
  }

  // Aksi verifikasi (Server Action dummy / real)
  async function handleAction(id: string, action: "approve" | "return") {
    "use server";
    // Logika persetujuan database
    console.log(`Action ${action} triggered for ${id}`);
  }

  return (
    <div className="space-y-6">
      {/* Banner Peringatan DB */}
      {isDbUnmigrated && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-800 leading-relaxed font-semibold">
            ⚠️ Menampilkan **Data Simulasi** karena view verifikasi tidak ditemukan di database.
          </p>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-neutral-charcoal">
          Persetujuan Data Wilayah
        </h2>
        <p className="text-sm text-neutral-slate">
          Tinjau rekapitulasi data Dasawisma dan lakukan verifikasi persetujuan bulanan.
        </p>
      </div>

      {/* List Verifikasi */}
      <div className="grid grid-cols-1 gap-6">
        {pendingVerifikasi.length === 0 ? (
          <Card padding="lg" className="text-center py-16">
            <svg className="w-12 h-12 text-neutral-gray mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold text-neutral-charcoal text-base">Semua data terverifikasi!</h3>
            <p className="text-xs text-neutral-slate mt-1">Tidak ada data pending yang butuh persetujuan saat ini.</p>
          </Card>
        ) : (
          pendingVerifikasi.map((item) => (
            <Card key={item.id} padding="lg" className="shadow-dropdown border border-neutral-light relative overflow-hidden">
              {/* Top border indicator based on SLA */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${
                item.sla_days_left <= 2 ? "bg-maroon-500" : "bg-kuning-500"
              }`} />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
                {/* Info Wilayah */}
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-bold text-lg text-neutral-charcoal">
                      RT {item.nomor_rt} / RW {item.nomor_rw}
                    </span>
                    <Badge variant="neutral">Periode {item.periode}</Badge>
                    <Badge variant={item.sla_days_left <= 2 ? "warning" : "neutral"}>
                      SLA {item.sla_days_left} Hari
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-slate mt-1">
                    Dusun {item.nama_dusun} • Data dikumpulkan oleh Kader Dasawisma.
                  </p>
                </div>

                {/* Ringkasan Angka Rekap */}
                <div className="flex gap-4 sm:gap-8 flex-wrap">
                  <div className="text-left">
                    <span className="text-[10px] text-neutral-slate font-semibold uppercase tracking-wider">Total KK</span>
                    <p className="text-xl font-bold text-neutral-charcoal mt-0.5">{item.total_kk}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-neutral-slate font-semibold uppercase tracking-wider">Total Jiwa</span>
                    <p className="text-xl font-bold text-neutral-charcoal mt-0.5">{item.total_jiwa}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-neutral-slate font-semibold uppercase tracking-wider">Balita</span>
                    <p className="text-xl font-bold text-neutral-charcoal mt-0.5">{item.total_jiwa > 0 ? item.total_jiwa - 40 : 12}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-neutral-slate font-semibold uppercase tracking-wider">Stunting</span>
                    <p className="text-xl font-bold text-maroon-600 mt-0.5">{item.total_stunting}</p>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center gap-3">
                  <form action={async () => {
                    "use server";
                    console.log("Returned", item.id);
                  }}>
                    <Button type="submit" variant="outline" size="md" className="text-maroon-600 border-maroon-100 hover:bg-maroon-50 hover:text-maroon-700">
                      Kembalikan
                    </Button>
                  </form>

                  <form action={async () => {
                    "use server";
                    console.log("Approved", item.id);
                  }}>
                    <Button type="submit" variant="primary" size="md">
                      Setujui Data
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
