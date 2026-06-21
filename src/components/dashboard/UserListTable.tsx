"use client";

import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import EditUserModal from "./EditUserModal";

interface ProfileRow {
  id: string;
  nama_lengkap: string;
  role: string;
  nik: string;
  no_hp: string;
  is_active: boolean;
  wilayah: string;
}

interface UserListTableProps {
  userList: ProfileRow[];
}

export default function UserListTable({ userList }: UserListTableProps) {
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  function getRoleLabel(r: string) {
    switch (r) {
      case "super_admin": return "Super Admin";
      case "admin_kabupaten": return "Admin Kabupaten";
      case "admin_kecamatan": return "Admin Kecamatan";
      case "admin_desa": return "Admin Desa";
      case "verifikator_dusun": return "Verifikator Dusun";
      case "verifikator_rw": return "Verifikator RW";
      case "verifikator_rt": return "Verifikator RT";
      case "kader_dasawisma": return "Kader Dasawisma";
      default: return "Anggota";
    }
  }

  const handleEditClick = (user: ProfileRow) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  return (
    <>
      <Card padding="none" className="overflow-hidden shadow-dropdown">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-neutral-snow border-b border-neutral-light text-neutral-slate font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">NIK (Username)</th>
                <th className="px-6 py-4">No. Handphone</th>
                <th className="px-6 py-4">Role Tugas</th>
                <th className="px-6 py-4">Wilayah Kerja</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light">
              {userList.map((row) => (
                <tr key={row.id} className="hover:bg-tosca-50/30 transition-all duration-200 group">
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tosca-400 to-tosca-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {row.nama_lengkap.charAt(0)}
                      </div>
                      <span className="font-semibold text-neutral-charcoal">{row.nama_lengkap}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 font-mono text-xs text-neutral-charcoal">{row.nik}</td>
                  <td className="px-6 py-4.5 text-neutral-slate">{row.no_hp}</td>
                  <td className="px-6 py-4.5">
                    <Badge variant={row.role === "kader_dasawisma" ? "neutral" : row.role.includes("admin") ? "success" : "warning"} showDot>
                      {getRoleLabel(row.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4.5 text-neutral-slate font-medium">{row.wilayah}</td>
                  <td className="px-6 py-4.5 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      row.is_active ? "bg-tosca-50 text-tosca-700" : "bg-neutral-light text-neutral-slate"
                    }`}>
                      {row.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(row)}>Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <EditUserModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={selectedUser}
      />
    </>
  );
}
