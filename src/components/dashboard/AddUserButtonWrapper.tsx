"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import AddUserModal from "./AddUserModal";

interface AddUserButtonWrapperProps {
  profile: {
    role: string;
    kabupaten_id: string | null;
    kecamatan_id: string | null;
    desa_id: string | null;
  };
}

export default function AddUserButtonWrapper({ profile }: AddUserButtonWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only render the button if the current user has permission to create other users.
  const allowedRoles = ["super_admin", "admin_kabupaten", "admin_kecamatan", "admin_desa"];
  if (!allowedRoles.includes(profile.role)) {
    return null;
  }

  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Tambah User Baru
      </Button>

      <AddUserModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        profile={profile}
      />
    </>
  );
}
