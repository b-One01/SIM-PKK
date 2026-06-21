// =============================================================================
// HALAMAN LOGIN — SIM-PKK
// =============================================================================
// Login menggunakan NIK (16 digit) sebagai username.
// Password default: pkk12345 (wajib diganti saat login pertama).
// =============================================================================

"use client";

import { useState } from "react";
import { Button, Input, Card, CardTitle, CardDescription } from "@/components/ui";

export default function LoginPage() {
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handler login — autentikasi via Supabase Auth.
   * Username = NIK@sim-pkk.local (disimpan sebagai email di Supabase).
   */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validasi NIK
    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      setError("NIK harus 16 digit angka");
      return;
    }

    if (!password) {
      setError("Password tidak boleh kosong");
      return;
    }

    setIsLoading(true);

    try {
      // Import Supabase client secara dinamis
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Login menggunakan NIK sebagai email (format: NIK@sim-pkk.local)
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: `${nik}@sim-pkk.local`,
        password: password,
      });

      if (authError) {
        setError("NIK atau password salah. Silakan coba lagi.");
        return;
      }

      // Redirect ke dashboard setelah login berhasil
      window.location.href = "/dashboard";
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tosca-50 via-white to-kuning-50 px-4">
      {/* Container Login */}
      <div className="w-full max-w-md animate-fade-in">
        {/* Header / Branding */}
        <div className="text-center mb-8">
          {/* Logo PKK */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-tosca-500 to-tosca-600 shadow-lg mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-neutral-charcoal">
            SIM-PKK
          </h1>
          <p className="text-sm text-neutral-slate mt-1">
            Sistem Informasi Manajemen PKK
          </p>
        </div>

        {/* Card Login */}
        <Card padding="lg" className="shadow-dropdown">
          <CardTitle>Masuk ke Akun Anda</CardTitle>
          <CardDescription>
            Gunakan NIK dan password yang diberikan oleh admin.
          </CardDescription>

          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            {/* NIK Input */}
            <Input
              label="NIK (Nomor Induk Kependudukan)"
              placeholder="Masukkan 16 digit NIK"
              value={nik}
              onChange={(e) => {
                // Hanya izinkan angka, maksimal 16 digit
                const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                setNik(val);
              }}
              isRequired
              maxLength={16}
              inputMode="numeric"
              autoComplete="username"
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              helperText={nik.length > 0 ? `${nik.length}/16 digit` : undefined}
            />

            {/* Password Input */}
            <Input
              label="Password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isRequired
              autoComplete="current-password"
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-button bg-maroon-50 border border-maroon-200 animate-slide-down">
                <svg className="w-4 h-4 text-maroon-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-maroon-700">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              Masuk
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-gray mt-6">
          Hubungi admin desa jika belum memiliki akun atau lupa password.
        </p>
      </div>
    </div>
  );
}
