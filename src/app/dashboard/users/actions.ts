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
      // Admin Desa membuat RT, RW, Dasawisma
      if (role !== "verifikator_rw" && role !== "verifikator_rt" && role !== "kader_dasawisma") {
        return { success: false, error: "Admin Desa hanya dapat membuat Verifikator RW, Verifikator RT, atau Kader Dasawisma." };
      }

      if (role === "verifikator_rw") {
        if (!formData.rw_id) {
          return { success: false, error: "RW wajib dipilih." };
        }
      } else if (role === "verifikator_rt") {
        if (!formData.rw_id || !formData.rt_id) {
          return { success: false, error: "RW dan RT wajib dipilih." };
        }
      } else if (role === "kader_dasawisma") {
        if (!formData.rw_id || !formData.rt_id || !formData.dasawisma_id) {
          return { success: false, error: "RW, RT, dan Dasawisma wajib dipilih." };
        }
      }
    } else {
      return { success: false, error: "Anda tidak memiliki hak untuk menambahkan user." };
    }

    const email = `${formData.nik}@sim-pkk.local`;
    const defaultPassword = "pkk12345"; // Default password sesuai spesifikasi

    const adminClient = createAdminClient();

    // 4. Create auth user
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
      }
    });

    if (authError) {
      console.error("Auth creation failed:", authError.message);
      return { success: false, error: "Gagal membuat user auth: " + authError.message };
    }

    const newUserId = authData.user?.id;

    // 5. Update user profiles (since the trigger runs after insert on auth.users,
    // the profile record is already created but without rw_id, rt_id, dasawisma_id, no_hp)
    const updatePayload: any = {};
    if (formData.no_hp) updatePayload.no_hp = formData.no_hp;
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
