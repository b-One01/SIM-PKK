"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: {
  nik: string;
  nama_lengkap: string;
  no_hp?: string;
  role: string;
  kabupaten_id?: string;
  kecamatan_id?: string;
  desa_id?: string;
  dusun_id?: string;
  rw_id?: string;
  rt_id?: string;
  dasawisma_id?: string;
}) {
  try {
    // 1. Authenticate caller and get profile
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return { success: false, error: "Sesi Anda telah kedaluwarsa. Silakan login kembali." };
    }

    const { data: currentProfile, error: profileErr } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (profileErr || !currentProfile) {
      return { success: false, error: "Gagal memuat profil admin pembuat." };
    }

    const callerRole = currentProfile.role;

    // 2. Validate input
    if (!formData.nik || formData.nik.length !== 16 || !/^\d+$/.test(formData.nik)) {
      return { success: false, error: "NIK harus berupa 16 digit angka." };
    }

    if (!formData.nama_lengkap.trim()) {
      return { success: false, error: "Nama lengkap wajib diisi." };
    }

    const role = formData.role;
    let targetKabupatenId = currentProfile.kabupaten_id;
    let targetKecamatanId = currentProfile.kecamatan_id;
    let targetDesaId = currentProfile.desa_id;
    let targetDusunId = formData.dusun_id || null;
    let targetRwId = formData.rw_id || null;
    let targetRtId = formData.rt_id || null;
    let targetDasawismaId = formData.dasawisma_id || null;

    // 3. Enforce Hierarchical Logic
    if (callerRole === "super_admin" || callerRole === "admin_kabupaten") {
      // Admin Kabupaten / Super Admin membuat Admin Kecamatan
      if (role !== "admin_kecamatan") {
        return { success: false, error: "Role target harus Admin Kecamatan." };
      }
      if (!formData.kecamatan_id) {
        return { success: false, error: "Kecamatan wajib dipilih." };
      }
      targetKecamatanId = formData.kecamatan_id;
      targetDesaId = null;
    } else if (callerRole === "admin_kecamatan") {
      // Admin Kecamatan membuat Admin Desa
      if (role !== "admin_desa") {
        return { success: false, error: "Admin Kecamatan hanya dapat membuat Admin Desa." };
      }
      if (!formData.desa_id) {
        return { success: false, error: "Desa wajib dipilih." };
      }
      targetDesaId = formData.desa_id;
    } else if (callerRole === "admin_desa") {
      // Admin Desa membuat Dusun, RW, RT, Dasawisma (semuanya level PWA)
      const allowedRoles = ["verifikator_dusun", "verifikator_rw", "verifikator_rt", "kader_dasawisma"];
      if (!allowedRoles.includes(role)) {
        return { success: false, error: "Admin Desa hanya dapat membuat Verifikator Dusun, RW, RT, atau Kader Dasawisma." };
      }

      if (role === "verifikator_dusun") {
        if (!formData.dusun_id) {
          return { success: false, error: "Dusun wajib dipilih." };
        }
      } else if (role === "verifikator_rw") {
        if (!formData.dusun_id || !formData.rw_id) {
          return { success: false, error: "Dusun dan RW wajib dipilih." };
        }
      } else if (role === "verifikator_rt") {
        if (!formData.dusun_id || !formData.rw_id || !formData.rt_id) {
          return { success: false, error: "Dusun, RW, dan RT wajib dipilih." };
        }
      } else if (role === "kader_dasawisma") {
        if (!formData.dusun_id || !formData.rw_id || !formData.rt_id || !formData.dasawisma_id) {
          return { success: false, error: "Dusun, RW, RT, dan Dasawisma wajib dipilih." };
        }
      }
    } else {
      return { success: false, error: "Anda tidak memiliki hak untuk menambahkan user." };
    }

    const email = `${formData.nik}@sim-pkk.local`;
    const defaultPassword = "pkk12345"; // Default password sesuai spesifikasi

    const adminClient = createAdminClient();

    // 4. Create auth user (trigger will automatically insert to user_profiles with all metadata)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        nama_lengkap: formData.nama_lengkap,
        role: role,
        nik: formData.nik,
        kabupaten_id: targetKabupatenId,
        kecamatan_id: targetKecamatanId,
        desa_id: targetDesaId,
        dusun_id: targetDusunId,
        rw_id: targetRwId,
        rt_id: targetRtId,
        dasawisma_id: targetDasawismaId,
      }
    });

    if (authError) {
      console.error("Auth creation failed:", authError.message);
      return { success: false, error: "Gagal membuat user auth: " + authError.message };
    }

    const newUserId = authData.user?.id;

    // 5. Update non-metadata fields or ensure all fields are set correctly
    const updatePayload: any = {};
    if (formData.no_hp) updatePayload.no_hp = formData.no_hp;
    if (targetDusunId) updatePayload.dusun_id = targetDusunId;
    if (targetRwId) updatePayload.rw_id = targetRwId;
    if (targetRtId) updatePayload.rt_id = targetRtId;
    if (targetDasawismaId) updatePayload.dasawisma_id = targetDasawismaId;
    updatePayload.is_active = true;

    if (Object.keys(updatePayload).length > 0) {
      const { error: profileUpdateErr } = await adminClient
        .from("user_profiles")
        .update(updatePayload)
        .eq("id", newUserId);

      if (profileUpdateErr) {
        console.error("Profile update failed:", profileUpdateErr.message);
        // Rollback: delete the created auth user
        await adminClient.auth.admin.deleteUser(newUserId);
        return { success: false, error: "Gagal melengkapi profil: " + profileUpdateErr.message };
      }
    }

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    console.error("Error in createUserAction:", error);
    return { success: false, error: error.message || "Terjadi kesalahan sistem." };
  }
}
