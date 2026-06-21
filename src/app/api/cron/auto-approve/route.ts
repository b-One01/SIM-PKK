// =============================================================================
// API ROUTE: VERCEL CRON — Auto-Approve SLA 7 Hari
// =============================================================================
// Endpoint ini dijalankan oleh Vercel Cron Jobs setiap tengah malam.
// Mengupdate status verifikasi yang melewati deadline SLA 7 hari
// dari 'pending' menjadi 'approved' secara otomatis.
//
// Konfigurasi di vercel.json:
//   { "crons": [{ "path": "/api/cron/auto-approve", "schedule": "0 0 * * *" }] }
// =============================================================================

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/cron/auto-approve
 * 
 * Dipanggil oleh Vercel Cron setiap hari pukul 00:00.
 * Menggunakan Supabase Admin Client (bypass RLS) untuk mengupdate
 * data verifikasi yang telah melewati SLA deadline.
 */
export async function GET(request: Request) {
  // Verifikasi bahwa request berasal dari Vercel Cron (bukan pihak ketiga)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Akses tidak diizinkan. Token tidak valid." },
      { status: 401 }
    );
  }

  try {
    const supabase = createAdminClient();

    // Update semua verifikasi yang pending dan sudah lewat deadline SLA
    const { data, error, count } = await supabase
      .from("verifikasi_data")
      .update({
        status: "approved",
        catatan: "Auto-approved oleh sistem (SLA 7 hari terlewat)",
        approved_at: new Date().toISOString(),
      })
      .eq("status", "pending")
      .lt("sla_deadline", new Date().toISOString())
      .select("id")

    if (error) {
      console.error("[CRON] Error saat auto-approve:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 500 }
      );
    }

    const totalUpdated = data?.length || 0;

    console.log(
      `[CRON] Auto-approve selesai: ${totalUpdated} record disetujui otomatis`
    );

    return NextResponse.json({
      success: true,
      message: `${totalUpdated} verifikasi disetujui otomatis karena melewati SLA 7 hari`,
      updated_count: totalUpdated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[CRON] Exception:", err);
    return NextResponse.json(
      { 
        success: false, 
        error: "Terjadi kesalahan internal saat menjalankan cron job" 
      },
      { status: 500 }
    );
  }
}
