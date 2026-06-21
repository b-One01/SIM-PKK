// =============================================================================
// HALAMAN LOGIN — SIM-PKK
// =============================================================================
// Login menggunakan NIK (16 digit) sebagai username.
// Password default: pkk12345 (wajib diganti saat login pertama).
// =============================================================================

"use client";

import { useState } from "react";
import Image from "next/image";
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-tosca-50 via-white to-kuning-50 px-4">
      {/* Decorative Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Blob Top-Right */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-tosca-200/40 to-tosca-300/20 blur-3xl animate-float" />
        {/* Medium Blob Bottom-Left */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-kuning-200/30 to-kuning-300/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        {/* Small Blob Center-Left */}
        <div className="absolute top-1/3 -left-16 w-48 h-48 rounded-full bg-gradient-to-r from-maroon-200/20 to-maroon-100/10 blur-2xl animate-float" style={{ animationDelay: '4s' }} />
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6TTI0IDI0aDEydjJIMjR2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
      </div>

      {/* Container Login */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Header / Branding */}
        <div className="text-center mb-8">
          {/* Logo PKK */}
          <div className="inline-flex items-center justify-center mb-5 animate-bounce-in">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-tosca-400/20 blur-xl scale-150" />
              <Image
                src="/images/logo-pkk.png"
                alt="Logo PKK"
                width={80}
                height={80}
                className="relative drop-shadow-lg"
                priority
              />
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient-primary">
            SIM-PKK
          </h1>
          <p className="text-sm text-neutral-slate mt-1.5 font-medium">
            Sistem Informasi Manajemen PKK
          </p>
          <p className="text-[11px] text-neutral-gray mt-0.5">
            Pemberdayaan Kesejahteraan Keluarga
          </p>
        </div>

        {/* Card Login — Glassmorphism */}
        <Card variant="glass" padding="lg" className="shadow-modal backdrop-blur-2xl border-white/40">
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
              <div className="flex items-center gap-2 p-3 rounded-xl bg-maroon-50 border border-maroon-200 animate-slide-down">
                <svg className="w-4 h-4 text-maroon-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-maroon-700 font-medium">{error}</span>
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
