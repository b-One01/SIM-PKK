"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Select } from "@/components/ui";
import { createUserAction } from "@/app/dashboard/users/actions";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    role: string;
    kabupaten_id: string | null;
    kecamatan_id: string | null;
    desa_id: string | null;
  };
}

export default function AddUserModal({ isOpen, onClose, profile }: AddUserModalProps) {
  const isKecMode = profile.role === "super_admin" || profile.role === "admin_kabupaten";
  const [nik, setNik] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [noHp, setNoHp] = useState("");
  const [role, setRole] = useState("");
  const [kecamatanName, setKecamatanName] = useState("");
  
  // Selection states
  const [kecamatanId, setKecamatanId] = useState("");
  const [desaId, setDesaId] = useState("");
  const [dusunId, setDusunId] = useState("");
  const [rwId, setRwId] = useState("");
  const [rtId, setRtId] = useState("");
  const [dasawismaId, setDasawismaId] = useState("");

  // Options states
  const [kecamatanOptions, setKecamatanOptions] = useState<{ value: string; label: string }[]>([]);
  const [desaOptions, setDesaOptions] = useState<{ value: string; label: string }[]>([]);
  const [dusunOptions, setDusunOptions] = useState<{ value: string; label: string }[]>([]);
  const [rwOptions, setRwOptions] = useState<{ value: string; label: string }[]>([]);
  const [rtOptions, setRtOptions] = useState<{ value: string; label: string }[]>([]);
  const [dasawismaOptions, setDasawismaOptions] = useState<{ value: string; label: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const supabase = createClient();

  // Reset form
  const resetForm = () => {
    setNik("");
    setNamaLengkap("");
    setNoHp("");
    setRole("");
    setKecamatanName("");
    setKecamatanId("");
    setDesaId("");
    setDusunId("");
    setRwId("");
    setRtId("");
    setDasawismaId("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleKecamatanNameChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    setKecamatanName(uppercaseVal);
    const lowercaseUsername = uppercaseVal.toLowerCase().replace(/\s+/g, "");
    setNik(lowercaseUsername);
    setNamaLengkap(`Admin ${uppercaseVal}`);
  };

  // Determine allowed roles to create based on admin role
  const getAllowedRoles = () => {
    if (profile.role === "super_admin" || profile.role === "admin_kabupaten") {
      return [{ value: "admin_kecamatan", label: "Admin Kecamatan" }];
    }
    if (profile.role === "admin_kecamatan") {
      return [{ value: "admin_desa", label: "Admin Desa" }];
    }
    if (profile.role === "admin_desa") {
      return [
        { value: "verifikator_dusun", label: "Verifikator Dusun" },
        { value: "verifikator_rw", label: "Verifikator RW" },
        { value: "verifikator_rt", label: "Verifikator RT" },
        { value: "kader_dasawisma", label: "Kader Dasawisma" },
      ];
    }
    return [];
  };

  // Set default role selection
  useEffect(() => {
    const roles = getAllowedRoles();
    if (roles.length > 0 && !role) {
      setRole(roles[0].value);
    }
  }, [profile.role, role]);

  // Load Kecamatan if super_admin / admin_kabupaten is creating admin_kecamatan
  useEffect(() => {
    if (!isOpen) return;
    if (role === "admin_kecamatan" && profile.kabupaten_id) {
      const fetchKecamatan = async () => {
        const { data, error } = await supabase
          .from("wilayah_kecamatan")
          .select("id, nama")
          .eq("kabupaten_id", profile.kabupaten_id)
          .order("nama", { ascending: true });
        
        if (!error && data) {
          setKecamatanOptions(data.map((k: any) => ({ value: k.id, label: k.nama })));
        }
      };
      fetchKecamatan();
    }
  }, [role, profile.kabupaten_id, isOpen]);

  // Load Desa if admin_kecamatan is creating admin_desa
  useEffect(() => {
    if (!isOpen) return;
    if (role === "admin_desa" && profile.kecamatan_id) {
      const fetchDesa = async () => {
        const { data, error } = await supabase
          .from("wilayah_desa")
          .select("id, nama")
          .eq("kecamatan_id", profile.kecamatan_id)
          .order("nama", { ascending: true });
        
        if (!error && data) {
          setDesaOptions(data.map((d: any) => ({ value: d.id, label: d.nama })));
        }
      };
      fetchDesa();
    }
  }, [role, profile.kecamatan_id, isOpen]);

  // Load Dusun if admin_desa is creating RT/RW/Dasawisma
  useEffect(() => {
    if (!isOpen) return;
    if (profile.role === "admin_desa" && profile.desa_id) {
      const fetchDusun = async () => {
        const { data, error } = await supabase
          .from("wilayah_dusun")
          .select("id, nama")
          .eq("desa_id", profile.desa_id)
          .order("nama", { ascending: true });
        
        if (!error && data) {
          setDusunOptions(data.map((d: any) => ({ value: d.id, label: d.nama })));
        }
      };
      fetchDusun();
    }
  }, [role, profile.desa_id, profile.role, isOpen]);

  // Load RW when Dusun changes
  useEffect(() => {
    if (dusunId) {
      const fetchRW = async () => {
        const { data, error } = await supabase
          .from("wilayah_rw")
          .select("id, nomor")
          .eq("dusun_id", dusunId)
          .order("nomor", { ascending: true });
        
        if (!error && data) {
          setRwOptions(data.map((r: any) => ({ value: r.id, label: `RW ${r.nomor}` })));
        }
      };
      fetchRW();
    } else {
      setRwOptions([]);
      setRwId("");
    }
  }, [dusunId]);

  // Load RT when RW changes
  useEffect(() => {
    if (rwId) {
      const fetchRT = async () => {
        const { data, error } = await supabase
          .from("wilayah_rt")
          .select("id, nomor")
          .eq("rw_id", rwId)
          .order("nomor", { ascending: true });
        
        if (!error && data) {
          setRtOptions(data.map((r: any) => ({ value: r.id, label: `RT ${r.nomor}` })));
        }
      };
      fetchRT();
    } else {
      setRtOptions([]);
      setRtId("");
    }
  }, [rwId]);

  // Load Dasawisma when RT changes
  useEffect(() => {
    if (rtId) {
      const fetchDasawisma = async () => {
        const { data, error } = await supabase
          .from("kelompok_dasawisma")
          .select("id, nama")
          .eq("rt_id", rtId)
          .order("nama", { ascending: true });
        
        if (!error && data) {
          setDasawismaOptions(data.map((d: any) => ({ value: d.id, label: d.nama })));
        }
      };
      fetchDasawisma();
    } else {
      setDasawismaOptions([]);
      setDasawismaId("");
    }
  }, [rtId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const result = await createUserAction({
      nik,
      nama_lengkap: isKecMode ? `Admin ${kecamatanName}` : namaLengkap,
      no_hp: isKecMode ? undefined : (noHp || undefined),
      role: isKecMode ? "admin_kecamatan" : role,
      kecamatan_name: isKecMode ? kecamatanName : undefined,
      kecamatan_id: role === "admin_kecamatan" && !isKecMode ? kecamatanId : undefined,
      desa_id: role === "admin_desa" ? desaId : undefined,
      dusun_id: ["verifikator_dusun", "verifikator_rw", "verifikator_rt", "kader_dasawisma"].includes(role) ? dusunId : undefined,
      rw_id: ["verifikator_rw", "verifikator_rt", "kader_dasawisma"].includes(role) ? rwId : undefined,
      rt_id: ["verifikator_rt", "kader_dasawisma"].includes(role) ? rtId : undefined,
      dasawisma_id: role === "kader_dasawisma" ? dasawismaId : undefined,
    });

    setLoading(false);

    if (result.success) {
      setSuccessMessage("Pengguna baru berhasil ditambahkan! Password default: pkk12345");
      setTimeout(() => {
        resetForm();
        onClose();
      }, 3000);
    } else {
      setErrorMessage(result.error || "Gagal menambahkan pengguna.");
    }
  };

  if (!isOpen) return null;

  const allowedRoles = getAllowedRoles();

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
              Tambah Pengguna Baru
            </h3>
            <p className="text-xs text-neutral-slate mt-0.5">
              Buat akun dengan hak akses dan wilayah tugas tertentu.
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

          {isKecMode ? (
            <>
              {/* Nama Kecamatan (Huruf Kapital & ditaruh paling atas) */}
              <Input
                label="Nama Kecamatan"
                placeholder="CONTOH: DEPOK"
                value={kecamatanName}
                onChange={(e) => handleKecamatanNameChange(e.target.value)}
                isRequired
              />

              {/* Username & Password (Berdampingan di bagian bawah) */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Username Login"
                  placeholder="Otomatis terisi..."
                  value={nik}
                  disabled
                  helperText={nik ? `Login: ${nik}` : undefined}
                />
                <Input
                  label="Password Default"
                  value="pkk12345"
                  disabled
                  helperText="Password bawaan sistem"
                />
              </div>
            </>
          ) : (
            <>
              {/* NIK */}
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

              {/* No Hp */}
              <Input
                label="Nomor Handphone"
                placeholder="Contoh: 081234567890"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
              />

              {/* Role */}
              {allowedRoles.length > 0 && (
                <Select
                  label="Role Tugas"
                  options={allowedRoles}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  isRequired
                />
              )}
            </>
          )}

          {/* HIERARCHICAL REGIONS */}
          
          {/* 1. Kecamatan (Super Admin / Admin Kabupaten) */}
          {role === "admin_kecamatan" && !isKecMode && (
            <Select
              label="Kecamatan Tugas"
              placeholder="Pilih Kecamatan..."
              options={kecamatanOptions}
              value={kecamatanId}
              onChange={(e) => setKecamatanId(e.target.value)}
              isRequired
            />
          )}

          {/* 2. Desa (Admin Kecamatan) */}
          {role === "admin_desa" && (
            <Select
              label="Desa Tugas"
              placeholder="Pilih Desa..."
              options={desaOptions}
              value={desaId}
              onChange={(e) => setDesaId(e.target.value)}
              isRequired
            />
          )}

          {/* 3. Dusun (Admin Desa -> Kader/Verifikator) */}
          {["verifikator_dusun", "verifikator_rw", "verifikator_rt", "kader_dasawisma"].includes(role) && (
            <Select
              label="Dusun"
              placeholder="Pilih Dusun..."
              options={dusunOptions}
              value={dusunId}
              onChange={(e) => setDusunId(e.target.value)}
              isRequired
            />
          )}

          {/* 4. RW (Admin Desa -> Kader/Verifikator) */}
          {["verifikator_rw", "verifikator_rt", "kader_dasawisma"].includes(role) && dusunId && (
            <Select
              label="Rukun Warga (RW)"
              placeholder="Pilih RW..."
              options={rwOptions}
              value={rwId}
              onChange={(e) => setRwId(e.target.value)}
              isRequired
            />
          )}

          {/* 5. RT (Admin Desa -> Kader/Verifikator RT/Dasawisma) */}
          {["verifikator_rt", "kader_dasawisma"].includes(role) && rwId && (
            <Select
              label="Rukun Tetangga (RT)"
              placeholder="Pilih RT..."
              options={rtOptions}
              value={rtId}
              onChange={(e) => setRtId(e.target.value)}
              isRequired
            />
          )}

          {/* 6. Dasawisma (Admin Desa -> Kader Dasawisma) */}
          {role === "kader_dasawisma" && rtId && (
            <Select
              label="Kelompok Dasawisma"
              placeholder="Pilih Dasawisma..."
              options={dasawismaOptions}
              value={dasawismaId}
              onChange={(e) => setDasawismaId(e.target.value)}
              isRequired
            />
          )}

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
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
