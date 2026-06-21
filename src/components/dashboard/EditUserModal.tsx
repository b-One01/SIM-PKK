"use client";

import React, { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import { updateUserAction } from "@/app/dashboard/users/actions";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    nama_lengkap: string;
    role: string;
    nik: string;
    no_hp: string;
    wilayah: string;
  } | null;
}

export default function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const [nik, setNik] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [noHp, setNoHp] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Initialize form when user changes
  useEffect(() => {
    if (user) {
      setNik(user.nik || "");
      setNamaLengkap(user.nama_lengkap || "");
      setNoHp(user.no_hp === "-" ? "" : (user.no_hp || ""));
      setPassword("");
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isKecAdmin = user.role === "admin_kecamatan";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const result = await updateUserAction(user.id, {
      nik,
      nama_lengkap: namaLengkap,
      no_hp: noHp || undefined,
      password: password || undefined,
    });

    setLoading(false);

    if (result.success) {
      setSuccessMessage("Data pengguna berhasil diperbarui!");
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setErrorMessage(result.error || "Gagal memperbarui data pengguna.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-night/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Card Wrapper */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-modal animate-bounce-in border border-neutral-light max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-light flex items-center justify-between bg-gradient-to-r from-tosca-50/50 to-white">
          <div>
            <h3 className="text-xl font-display font-bold text-neutral-charcoal">
              Edit Pengguna
            </h3>
            <p className="text-xs text-neutral-slate mt-0.5">
              Ubah data akun, username login, atau perbarui password.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-slate hover:bg-neutral-light hover:text-neutral-charcoal transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-maroon-50 border border-maroon-200/50 text-xs text-maroon-700 font-semibold">
              ⚠️ {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="p-3 rounded-xl bg-tosca-50 border border-tosca-200/50 text-xs text-tosca-700 font-semibold">
              ✅ {successMessage}
            </div>
          )}

          {isKecAdmin ? (
            <>
              {/* Info Wilayah (Kecamatan Tugas) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-slate mb-1">Wilayah Kerja</label>
                <div className="p-3 bg-neutral-snow border border-neutral-light rounded-xl font-semibold text-sm text-neutral-charcoal">
                  {user.wilayah}
                </div>
              </div>

              {/* Username Login (Bisa diedit/dilihat jika lupa) */}
              <Input
                label="Username Login"
                placeholder="Masukkan username login"
                value={nik}
                onChange={(e) => setNik(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                isRequired
                helperText="Digunakan untuk login di halaman utama."
              />
            </>
          ) : (
            <>
              {/* NIK / Username */}
              <Input
                label="NIK (Username Login)"
                placeholder="Masukkan 16 digit NIK"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                maxLength={16}
                isRequired
              />

              {/* Nama Lengkap */}
              <Input
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                isRequired
              />

              {/* Nomor Handphone */}
              <Input
                label="Nomor Handphone"
                placeholder="Contoh: 081234567890"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
              />
            </>
          )}

          {/* Reset Password ke Default */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-neutral-slate mb-1">Aksi Autentikasi</label>
            <div className="flex items-center justify-between p-3.5 bg-neutral-snow border border-neutral-light rounded-xl">
              <div>
                <p className="text-xs font-semibold text-neutral-charcoal">Reset Password ke Default</p>
                <p className="text-[10px] text-neutral-slate mt-0.5">
                  Password akan diset menjadi: <code className="font-mono bg-neutral-light px-1 py-0.5 rounded text-tosca-700 font-bold">pkk12345</code>
                </p>
              </div>
              {password === "pkk12345" ? (
                <span className="text-xs font-semibold text-tosca-600 bg-tosca-50 px-2.5 py-1 rounded-lg border border-tosca-200/50">
                  Siap di-reset
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPassword("pkk12345")}
                >
                  Reset Password
                </Button>
              )}
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-light">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
