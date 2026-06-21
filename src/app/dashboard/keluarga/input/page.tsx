// =============================================================================
// INPUT DATA KELUARGA — SIM-PKK
// =============================================================================
// Form multi-step (KK → Anggota → Sektoral) untuk kader Dasawisma.
// Menjamin konsistensi penginputan data satu KK dengan satu transaksi teratur.
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, Select, Badge } from "@/components/ui";

interface MemberFormState {
  nik: string;
  nama: string;
  hubungan_keluarga: string;
  jenis_kelamin: "L" | "P";
  tanggal_lahir: string;
  tempat_lahir: string;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  status_perkawinan: string;
  is_pus: boolean;
  is_wus: boolean;
  is_disabilitas: boolean;
  is_buta_huruf: boolean;
  
  // Sektoral Kesehatan (Pokja 4)
  is_hamil: boolean;
  is_menyusui: boolean;
  is_balita: boolean;
  status_stunting: string;
  is_kms: boolean;
  is_lansia: boolean;
  jenis_kb: string;

  // Sektoral Karakter (Pokja 1)
  is_pengajian: boolean;
  is_gotong_royong: boolean;
  is_arisan: boolean;
}

export default function InputKeluargaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState<any>(null);
  
  // State Step 1: Informasi Keluarga (KK)
  const [noKk, setNoKk] = useState("");
  const [kepalaKeluarga, setKepalaKeluarga] = useState("");
  const [alamat, setAlamat] = useState("");
  const [dasawismaId, setDasawismaId] = useState("");
  const [dasawismaOptions, setDasawismaOptions] = useState<any[]>([]);

  // State Step 2 & 3: Anggota Keluarga & Sektoral per Anggota
  const [members, setMembers] = useState<MemberFormState[]>([
    {
      nik: "",
      nama: "",
      hubungan_keluarga: "kepala_keluarga",
      jenis_kelamin: "L",
      tanggal_lahir: "",
      tempat_lahir: "",
      agama: "islam",
      pendidikan: "sma",
      pekerjaan: "",
      status_perkawinan: "kawin",
      is_pus: false,
      is_wus: false,
      is_disabilitas: false,
      is_buta_huruf: false,
      is_hamil: false,
      is_menyusui: false,
      is_balita: false,
      status_stunting: "normal",
      is_kms: false,
      is_lansia: false,
      jenis_kb: "tidak",
      is_pengajian: false,
      is_gotong_royong: false,
      is_arisan: false,
    },
  ]);

  // State Step 3 (KK-wide sectoral): Perumahan & Ekonomi
  const [kriteriaRumah, setKriteriaRumah] = useState("sehat");
  const [sumberAir, setSumberAir] = useState("pdam");
  const [isJamban, setIsJamban] = useState(false);
  const [isSampah, setIsSampah] = useState(false);
  const [isSpal, setIsSpal] = useState(false);
  const [stikerP4k, setStikerP4k] = useState(false);

  const [isUp2k, setIsUp2k] = useState(false);
  const [jenisUp2k, setJenisUp2k] = useState("");
  const [isHatinyaPkk, setIsHatinyaPkk] = useState(false);
  const [jenisPemanfaatan, setJenisPemanfaatan] = useState("toga");
  const [isKoperasi, setIsKoperasi] = useState(false);
  const [isPaudBkb, setIsPaudBkb] = useState(false);

  // Ambil profile & data dasawisma awal
  useEffect(() => {
    async function loadInitialData() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(prof);

      // Ambil opsi Dasawisma di desa user
      if (prof?.desa_id) {
        const { data: dasawismas } = await supabase
          .from("kelompok_dasawisma")
          .select("id, nama")
          .eq("desa_id", prof.desa_id);
        
        if (dasawismas) {
          setDasawismaOptions(dasawismas);
          if (dasawismas.length > 0) setDasawismaId(dasawismas[0].id);
        }
      }
    }
    loadInitialData();
  }, []);

  // Update data kepala keluarga jika nama anggota ke-0 berubah
  useEffect(() => {
    if (members[0] && members[0].hubungan_keluarga === "kepala_keluarga") {
      setKepalaKeluarga(members[0].nama);
    }
  }, [members]);

  // Tambah baris anggota keluarga
  function addMember() {
    setMembers([
      ...members,
      {
        nik: "",
        nama: "",
        hubungan_keluarga: "anak",
        jenis_kelamin: "L",
        tanggal_lahir: "",
        tempat_lahir: "",
        agama: "islam",
        pendidikan: "belum_sekolah",
        pekerjaan: "",
        status_perkawinan: "belum_kawin",
        is_pus: false,
        is_wus: false,
        is_disabilitas: false,
        is_buta_huruf: false,
        is_hamil: false,
        is_menyusui: false,
        is_balita: false,
        status_stunting: "normal",
        is_kms: false,
        is_lansia: false,
        jenis_kb: "tidak",
        is_pengajian: false,
        is_gotong_royong: false,
        is_arisan: false,
      },
    ]);
  }

  // Update data anggota tertentu
  function updateMember(index: number, key: keyof MemberFormState, value: any) {
    const updated = [...members];
    updated[index] = { ...updated[index], [key]: value };
    setMembers(updated);
  }

  // Hapus anggota tertentu
  function removeMember(index: number) {
    if (index === 0) return; // Kepala keluarga tidak boleh dihapus
    setMembers(members.filter((_, i) => i !== index));
  }

  // Submit data ke Supabase
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();

      if (!profile) {
        throw new Error("Profil kader tidak ditemukan. Pastikan Anda sudah login.");
      }

      // 1. Simpan data keluarga
      const { data: family, error: famErr } = await supabase
        .from("keluarga")
        .insert({
          no_kk: noKk,
          nama_kepala_keluarga: kepalaKeluarga,
          alamat: alamat,
          dasawisma_id: dasawismaId || profile.dasawisma_id,
          rt_id: profile.rt_id,
          rw_id: profile.rw_id,
          dusun_id: profile.dusun_id,
          desa_id: profile.desa_id,
          kecamatan_id: profile.kecamatan_id,
          kabupaten_id: profile.kabupaten_id,
          input_by: user?.id,
          periode: new Date().toISOString().substring(0, 7), // Format YYYY-MM
        })
        .select()
        .single();

      if (famErr) throw famErr;

      // 2. Simpan setiap Anggota Keluarga & Data Sektoral Anggota
      for (const m of members) {
        const { data: member, error: memErr } = await supabase
          .from("anggota_keluarga")
          .insert({
            keluarga_id: family.id,
            nik: m.nik || null,
            nama: m.nama,
            hubungan_keluarga: m.hubungan_keluarga,
            jenis_kelamin: m.jenis_kelamin,
            tanggal_lahir: m.tanggal_lahir,
            tempat_lahir: m.tempat_lahir || null,
            agama: m.agama,
            pendidikan: m.pendidikan || null,
            pekerjaan: m.pekerjaan || null,
            status_perkawinan: m.status_perkawinan,
            is_pus: m.is_pus,
            is_wus: m.is_wus,
            is_disabilitas: m.is_disabilitas,
            is_buta_huruf: m.is_buta_huruf,
            desa_id: profile.desa_id,
          })
          .select()
          .single();

        if (memErr) throw memErr;

        // 2a. Simpan Data Kesehatan Anggota (Pokja 4)
        const { error: kesErr } = await supabase
          .from("data_kesehatan")
          .insert({
            anggota_id: member.id,
            is_hamil: m.is_hamil,
            is_menyusui: m.is_menyusui,
            is_balita: m.is_balita,
            status_stunting: m.is_balita ? m.status_stunting : null,
            is_kms: m.is_kms,
            is_lansia: m.is_lansia,
            jenis_kb: m.jenis_kb || null,
            desa_id: profile.desa_id,
          });

        if (kesErr) throw kesErr;

        // 2b. Simpan Data Karakter Anggota (Pokja 1)
        const { error: karErr } = await supabase
          .from("data_karakter")
          .insert({
            anggota_id: member.id,
            is_pengajian: m.is_pengajian,
            is_gotong_royong: m.is_gotong_royong,
            is_arisan: m.is_arisan,
            desa_id: profile.desa_id,
          });

        if (karErr) throw karErr;
      }

      // 3. Simpan Data Rumah KK (Pokja 3)
      const { error: rumErr } = await supabase
        .from("data_rumah")
        .insert({
          keluarga_id: family.id,
          kriteria_rumah: kriteriaRumah,
          sumber_air: sumberAir || null,
          is_jamban: isJamban,
          is_sampah: isSampah,
          is_spal: isSpal,
          stiker_p4k: stikerP4k,
          desa_id: profile.desa_id,
        });

      if (rumErr) throw rumErr;

      // 4. Simpan Data Ekonomi KK (Pokja 2 & 3)
      const { error: ekoErr } = await supabase
        .from("data_ekonomi")
        .insert({
          keluarga_id: family.id,
          is_up2k: isUp2k,
          jenis_up2k: isUp2k ? jenisUp2k : null,
          is_hatinya_pkk: isHatinyaPkk,
          jenis_pemanfaatan: isHatinyaPkk ? jenisPemanfaatan : null,
          is_koperasi: isKoperasi,
          is_paud_bkb: isPaudBkb,
          desa_id: profile.desa_id,
        });

      if (ekoErr) throw ekoErr;

      setSuccess("Seluruh data keluarga berhasil disimpan ke server!");
      setTimeout(() => {
        router.push("/dashboard/keluarga");
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(`Gagal menyimpan data: ${err.message || "Terjadi kesalahan internal"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Form */}
      <div>
        <h2 className="text-2xl font-display font-bold text-neutral-charcoal">Entry Data Baru</h2>
        <p className="text-sm text-neutral-slate">Catat data KK, individu, dan variabel Pokja secara detail.</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-neutral-light shadow-sm">
        <div className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            step === 1 ? "bg-tosca-500 text-white" : "bg-tosca-100 text-tosca-700"
          }`}>1</span>
          <span className="text-xs font-semibold text-neutral-charcoal">Info Kartu Keluarga</span>
        </div>
        <div className="w-12 h-0.5 bg-neutral-light" />
        <div className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            step === 2 ? "bg-tosca-500 text-white" : "bg-neutral-light text-neutral-slate"
          }`}>2</span>
          <span className="text-xs font-semibold text-neutral-slate">Anggota Keluarga</span>
        </div>
        <div className="w-12 h-0.5 bg-neutral-light" />
        <div className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            step === 3 ? "bg-tosca-500 text-white" : "bg-neutral-light text-neutral-slate"
          }`}>3</span>
          <span className="text-xs font-semibold text-neutral-slate">Variabel Pokja / Rumah</span>
        </div>
      </div>

      {/* Form Card */}
      <Card padding="lg" className="shadow-dropdown">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: KELUARGA */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-base text-neutral-charcoal border-b pb-2">Informasi KK Utama</h3>
              
              <Input
                label="Nomor Kartu Keluarga (KK)"
                placeholder="Masukkan 16 digit no KK"
                value={noKk}
                onChange={(e) => setNoKk(e.target.value.replace(/\D/g, "").slice(0, 16))}
                isRequired
                maxLength={16}
                inputMode="numeric"
              />

              <Input
                label="Alamat Lengkap KK"
                placeholder="Jl. Raya Desa No. ..."
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                isRequired
              />

              {dasawismaOptions.length > 0 ? (
                <Select
                  label="Pilih Kelompok Dasawisma"
                  options={dasawismaOptions.map(d => ({ value: d.id, label: d.nama }))}
                  value={dasawismaId}
                  onChange={(e) => setDasawismaId(e.target.value)}
                />
              ) : (
                <div className="p-3 bg-neutral-snow rounded text-xs text-neutral-slate">
                  Dasawisma akan ditentukan otomatis berdasarkan profil kader Anda.
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button type="button" variant="primary" onClick={() => setStep(2)} disabled={noKk.length !== 16}>
                  Lanjutkan Ke Anggota
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: ANGGOTA KELUARGA */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-display font-bold text-base text-neutral-charcoal">Data Anggota Keluarga</h3>
                <Button type="button" variant="secondary" size="sm" onClick={addMember}>
                  + Tambah Anggota
                </Button>
              </div>

              {members.map((member, index) => (
                <div key={index} className="p-4 rounded-xl border border-neutral-light bg-neutral-snow/30 space-y-4 relative">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="absolute top-4 right-4 text-xs font-semibold text-maroon-600 hover:text-maroon-700"
                    >
                      Hapus
                    </button>
                  )}

                  <h4 className="text-xs font-bold text-tosca-700 uppercase tracking-wider">
                    Anggota #{index + 1}: {index === 0 ? "Kepala Keluarga" : member.hubungan_keluarga}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nama Lengkap"
                      placeholder="Masukkan nama lengkap"
                      value={member.nama}
                      onChange={(e) => updateMember(index, "nama", e.target.value)}
                      isRequired
                    />

                    <Input
                      label="NIK (Opsional)"
                      placeholder="Masukkan 16 digit NIK"
                      value={member.nik}
                      onChange={(e) => updateMember(index, "nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
                      maxLength={16}
                    />

                    <Select
                      label="Hubungan Keluarga"
                      value={member.hubungan_keluarga}
                      onChange={(e) => updateMember(index, "hubungan_keluarga", e.target.value)}
                      options={[
                        { value: "kepala_keluarga", label: "Kepala Keluarga" },
                        { value: "istri", label: "Istri" },
                        { value: "anak", label: "Anak" },
                        { value: "orang_tua", label: "Orang Tua" },
                        { value: "lainnya", label: "Lainnya" },
                      ]}
                      disabled={index === 0}
                    />

                    <Select
                      label="Jenis Kelamin"
                      value={member.jenis_kelamin}
                      onChange={(e) => updateMember(index, "jenis_kelamin", e.target.value)}
                      options={[
                        { value: "L", label: "Laki-laki" },
                        { value: "P", label: "Perempuan" },
                      ]}
                    />

                    <Input
                      label="Tanggal Lahir"
                      type="date"
                      value={member.tanggal_lahir}
                      onChange={(e) => updateMember(index, "tanggal_lahir", e.target.value)}
                      isRequired
                    />

                    <Input
                      label="Tempat Lahir"
                      placeholder="Kabupaten Sleman, dll."
                      value={member.tempat_lahir}
                      onChange={(e) => updateMember(index, "tempat_lahir", e.target.value)}
                    />
                  </div>

                  {/* Toggle Variabel PKK */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-neutral-slate cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.is_pus}
                        onChange={(e) => updateMember(index, "is_pus", e.target.checked)}
                        className="rounded border-neutral-light text-tosca-600 focus:ring-tosca-500"
                      />
                      Pasangan Usia Subur (PUS)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-neutral-slate cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.is_wus}
                        onChange={(e) => updateMember(index, "is_wus", e.target.checked)}
                        className="rounded border-neutral-light text-tosca-600 focus:ring-tosca-500"
                      />
                      Wanita Usia Subur (WUS)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-neutral-slate cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.is_disabilitas}
                        onChange={(e) => updateMember(index, "is_disabilitas", e.target.checked)}
                        className="rounded border-neutral-light text-tosca-600 focus:ring-tosca-500"
                      />
                      Penyandang Disabilitas
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-neutral-slate cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.is_buta_huruf}
                        onChange={(e) => updateMember(index, "is_buta_huruf", e.target.checked)}
                        className="rounded border-neutral-light text-tosca-600 focus:ring-tosca-500"
                      />
                      Buta Huruf / Buta Baca
                    </label>
                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Kembali
                </Button>
                <Button type="button" variant="primary" onClick={() => setStep(3)}>
                  Lanjutkan Ke Pokja
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: DATA SEKTORAL */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-base text-neutral-charcoal border-b pb-2">Variabel Pokja Terpadu</h3>
              
              {/* Pokja 3: Perumahan */}
              <div className="p-4 rounded-xl border border-neutral-light space-y-4">
                <h4 className="text-xs font-bold text-tosca-700 uppercase tracking-wider">Pokja 3 — Kondisi Perumahan</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Kriteria Rumah"
                    value={kriteriaRumah}
                    onChange={(e) => setKriteriaRumah(e.target.value)}
                    options={[
                      { value: "sehat", label: "Rumah Sehat" },
                      { value: "kurang_sehat", label: "Rumah Kurang Sehat" },
                    ]}
                  />

                  <Select
                    label="Sumber Air Bersih"
                    value={sumberAir}
                    onChange={(e) => setSumberAir(e.target.value)}
                    options={[
                      { value: "pdam", label: "PDAM" },
                      { value: "sumur_gali", label: "Sumur Gali" },
                      { value: "sumur_pompa", label: "Sumur Pompa" },
                      { value: "mata_air", label: "Mata Air" },
                      { value: "sungai", label: "Sungai" },
                      { value: "lainnya", label: "Lainnya" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-slate cursor-pointer">
                    <input type="checkbox" checked={isJamban} onChange={(e) => setIsJamban(e.target.checked)} className="rounded text-tosca-600" />
                    Punya Jamban
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-slate cursor-pointer">
                    <input type="checkbox" checked={isSampah} onChange={(e) => setIsSampah(e.target.checked)} className="rounded text-tosca-600" />
                    Mengelola Sampah
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-slate cursor-pointer">
                    <input type="checkbox" checked={isSpal} onChange={(e) => setIsSpal(e.target.checked)} className="rounded text-tosca-600" />
                    Punya SPAL
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-slate cursor-pointer">
                    <input type="checkbox" checked={stikerP4k} onChange={(e) => setStikerP4k(e.target.checked)} className="rounded text-tosca-600" />
                    Stiker P4K
                  </label>
                </div>
              </div>

              {/* Pokja 2 & 3: Ekonomi & Pemanfaatan Pekarangan */}
              <div className="p-4 rounded-xl border border-neutral-light space-y-4">
                <h4 className="text-xs font-bold text-tosca-700 uppercase tracking-wider">Pokja 2 & 3 — Ekonomi Mandiri</h4>
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-slate cursor-pointer">
                        <input type="checkbox" checked={isUp2k} onChange={(e) => setIsUp2k(e.target.checked)} className="rounded text-tosca-600" />
                        Aktif UP2K (Usaha Pendapatan Keluarga)
                      </label>
                      {isUp2k && (
                        <Input
                          placeholder="Jenis Usaha (misal: Kerajinan, Makanan)"
                          value={jenisUp2k}
                          onChange={(e) => setJenisUp2k(e.target.value)}
                        />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-slate cursor-pointer">
                        <input type="checkbox" checked={isHatinyaPkk} onChange={(e) => setIsHatinyaPkk(e.target.checked)} className="rounded text-tosca-600" />
                        Pemanfaatan Pekarangan (Hatinya PKK)
                      </label>
                      {isHatinyaPkk && (
                        <Select
                          value={jenisPemanfaatan}
                          onChange={(e) => setJenisPemanfaatan(e.target.value)}
                          options={[
                            { value: "toga", label: "Taman Obat (TOGA)" },
                            { value: "warung_hidup", label: "Warung Hidup" },
                            { value: "tanaman_keras", label: "Tanaman Keras" },
                            { value: "peternakan", label: "Peternakan" },
                            { value: "perikanan", label: "Perikanan" },
                          ]}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-neutral-slate cursor-pointer">
                      <input type="checkbox" checked={isKoperasi} onChange={(e) => setIsKoperasi(e.target.checked)} className="rounded text-tosca-600" />
                      Aktif Anggota Koperasi
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-neutral-slate cursor-pointer">
                      <input type="checkbox" checked={isPaudBkb} onChange={(e) => setIsPaudBkb(e.target.checked)} className="rounded text-tosca-600" />
                      Anak Mengikuti PAUD / BKB
                    </label>
                  </div>
                </div>
              </div>

              {/* Pokja 1 & 4: Detail per Individu */}
              <div className="p-4 rounded-xl border border-neutral-light space-y-4">
                <h4 className="text-xs font-bold text-tosca-700 uppercase tracking-wider">Pokja 1 & 4 — Karakter & Kesehatan Individu</h4>
                
                {members.map((member, index) => (
                  <div key={index} className="p-3 bg-neutral-snow/50 rounded-lg space-y-3">
                    <div className="flex justify-between items-center border-b border-neutral-light/50 pb-1.5">
                      <span className="text-xs font-bold text-neutral-charcoal">{member.nama}</span>
                      <Badge variant="neutral">{member.hubungan_keluarga}</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Variabel Kesehatan */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-neutral-slate uppercase">Variabel Kesehatan (Pokja 4)</span>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-neutral-slate">
                            <input type="checkbox" checked={member.is_balita} onChange={(e) => updateMember(index, "is_balita", e.target.checked)} className="rounded text-tosca-600" />
                            Balita (&lt; 5 Tahun)
                          </label>
                          {member.is_balita && (
                            <Select
                              label="Status Stunting"
                              value={member.status_stunting}
                              onChange={(e) => updateMember(index, "status_stunting", e.target.value)}
                              options={[
                                { value: "normal", label: "Normal" },
                                { value: "pendek", label: "Pendek (Stunting)" },
                                { value: "sangat_pendek", label: "Sangat Pendek" },
                              ]}
                            />
                          )}

                          <label className="flex items-center gap-2 text-xs text-neutral-slate">
                            <input type="checkbox" checked={member.is_hamil} onChange={(e) => updateMember(index, "is_hamil", e.target.checked)} className="rounded text-tosca-600" />
                            Ibu Hamil
                          </label>

                          <label className="flex items-center gap-2 text-xs text-neutral-slate">
                            <input type="checkbox" checked={member.is_menyusui} onChange={(e) => updateMember(index, "is_menyusui", e.target.checked)} className="rounded text-tosca-600" />
                            Ibu Menyusui
                          </label>
                        </div>
                      </div>

                      {/* Variabel Karakter */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-neutral-slate uppercase">Variabel Karakter (Pokja 1)</span>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-neutral-slate">
                            <input type="checkbox" checked={member.is_pengajian} onChange={(e) => updateMember(index, "is_pengajian", e.target.checked)} className="rounded text-tosca-600" />
                            Aktif Kegiatan Keagamaan
                          </label>
                          <label className="flex items-center gap-2 text-xs text-neutral-slate">
                            <input type="checkbox" checked={member.is_gotong_royong} onChange={(e) => updateMember(index, "is_gotong_royong", e.target.checked)} className="rounded text-tosca-600" />
                            Aktif Gotong Royong
                          </label>
                          <label className="flex items-center gap-2 text-xs text-neutral-slate">
                            <input type="checkbox" checked={member.is_arisan} onChange={(e) => updateMember(index, "is_arisan", e.target.checked)} className="rounded text-tosca-600" />
                            Ikut Kelompok Arisan
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error / Success Alerts */}
              {error && (
                <div className="p-3 bg-maroon-50 border border-maroon-200 text-maroon-700 text-xs rounded-button">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-tosca-50 border border-tosca-200 text-tosca-700 text-xs rounded-button">
                  {success}
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={loading}>
                  Kembali
                </Button>
                <Button type="submit" variant="primary" isLoading={loading}>
                  Simpan Seluruh Data KK
                </Button>
              </div>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
