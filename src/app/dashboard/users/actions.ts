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
  kecamatan_name?: string; // Menampung input teks Kecamatan baru
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
    const role = formData.role;
    let targetKabupatenId = currentProfile.kabupaten_id;
    let targetKecamatanId = formData.kecamatan_id || null;
    let targetDesaId = formData.desa_id || null;
    let targetDusunId = formData.dusun_id || null;
    let targetRwId = formData.rw_id || null;
    let targetRtId = formData.rt_id || null;
    let targetDasawismaId = formData.dasawisma_id || null;
    let finalNik = formData.nik.trim().toLowerCase();
    let finalNamaLengkap = formData.nama_lengkap;

    const adminClient = createAdminClient();

    // 2. Enforce Hierarchical Logic & Custom Admin Kecamatan Registration
    if (callerRole === "super_admin" || callerRole === "admin_kabupaten") {
      if (role !== "admin_kecamatan") {
        return { success: false, error: "Role target harus Admin Kecamatan." };
      }
      
      if (!formData.kecamatan_name || !formData.kecamatan_name.trim()) {
        return { success: false, error: "Nama Kecamatan wajib diisi." };
      }

      const rawKecName = formData.kecamatan_name.trim().toUpperCase(); // Wajib huruf kapital
      
      // Auto-set username (lowercase, no spaces)
      finalNik = rawKecName.toLowerCase().replace(/\s+/g, "");
      finalNamaLengkap = `Admin ${rawKecName}`;

      // Cari Kecamatan di database, jika belum ada, buat baru
      const { data: existingKec } = await adminClient
        .from("wilayah_kecamatan")
        .select("id")
        .eq("nama", rawKecName)
        .eq("kabupaten_id", targetKabupatenId || "")
        .maybeSingle();

      if (existingKec) {
        targetKecamatanId = existingKec.id;
      } else {
        // Buat Kecamatan Baru
        const { data: newKec, error: newKecErr } = await adminClient
          .from("wilayah_kecamatan")
          .insert({
            nama: rawKecName,
            kabupaten_id: targetKabupatenId
          })
          .select("id")
          .single();

        if (newKecErr || !newKec) {
          console.error("Gagal menambahkan Kecamatan baru:", newKecErr?.message);
          return { success: false, error: "Gagal mendaftarkan Kecamatan baru di database." };
        }
        targetKecamatanId = newKec.id;
      }

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
      // Admin Desa membuat Dusun, RW, RT, Dasawisma
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

    // Validate generated username length
    if (!finalNik || finalNik.length < 3 || finalNik.length > 50) {
      return { success: false, error: "Username/NIK minimal 3 karakter dan maksimal 50 karakter." };
    }

    const email = `${finalNik}@sim-pkk.local`;
    const defaultPassword = "pkk12345"; // Default password sesuai spesifikasi

    // 4. Create auth user (trigger will automatically insert to user_profiles with all metadata)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        nama_lengkap: finalNamaLengkap,
        role: role,
        nik: finalNik,
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

export async function updateUserAction(
  userId: string,
  formData: {
    nik: string;
    nama_lengkap: string;
    no_hp?: string;
    password?: string;
  }
) {
  try {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return { success: false, error: "Sesi Anda telah kedaluwarsa. Silakan login kembali." };
    }

    const { data: currentProfile, error: profileErr } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (profileErr || !currentProfile) {
      return { success: false, error: "Gagal memuat profil admin pengubah." };
    }

    const allowedRoles = ["super_admin", "admin_kabupaten", "admin_kecamatan", "admin_desa"];
    if (!allowedRoles.includes(currentProfile.role)) {
      return { success: false, error: "Anda tidak memiliki hak untuk mengubah data pengguna." };
    }

    const adminClient = createAdminClient();
    const finalNik = formData.nik.trim().toLowerCase();

    // Pastikan username baru tidak duplikat
    const { data: existingUser } = await adminClient
      .from("user_profiles")
      .select("id")
      .eq("nik", finalNik)
      .neq("id", userId)
      .maybeSingle();

    if (existingUser) {
      return { success: false, error: "Username/NIK sudah terdaftar oleh pengguna lain." };
    }

    // Bangun payload update auth
    const updateAuthPayload: any = {
      email: `${finalNik}@sim-pkk.local`,
      user_metadata: {
        nik: finalNik,
        nama_lengkap: formData.nama_lengkap,
      }
    };

    if (formData.password && formData.password.trim()) {
      if (formData.password.length < 6) {
        return { success: false, error: "Password baru minimal 6 karakter." };
      }
      updateAuthPayload.password = formData.password;
    }

    // Update Auth User via admin Client
    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, updateAuthPayload);
    if (authUpdateError) {
      console.error("Auth update failed:", authUpdateError.message);
      return { success: false, error: "Gagal memperbarui autentikasi: " + authUpdateError.message };
    }

    // Update user_profiles table
    const { error: profileUpdateError } = await adminClient
      .from("user_profiles")
      .update({
        nik: finalNik,
        nama_lengkap: formData.nama_lengkap,
        no_hp: formData.no_hp || null,
      })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error("Profile table update failed:", profileUpdateError.message);
      return { success: false, error: "Gagal melengkapi profil terupdate: " + profileUpdateError.message };
    }

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateUserAction:", error);
    return { success: false, error: error.message || "Terjadi kesalahan sistem." };
  }
}
