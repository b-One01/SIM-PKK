// =============================================================================
// KOMPONEN UI: BADGE — SIM-PKK
// =============================================================================
// Badge/Label untuk menampilkan status, kategori, atau counter.
// Digunakan di: status verifikasi, role user, kategori Pokja, dll.
// =============================================================================

import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Varian warna badge */
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  /** Ukuran badge */
  size?: "sm" | "md" | "lg";
  /** Tampilkan dot indicator di sebelah kiri */
  dot?: boolean;
  /** Ikon di sebelah kiri (sebagai pengganti dot) */
  icon?: React.ReactNode;
}

/**
 * Komponen Badge — Label status/kategori SIM-PKK.
 */
export function Badge({
  className = "",
  variant = "neutral",
  size = "md",
  dot = false,
  icon,
  children,
  ...props
}: BadgeProps) {
  // Style varian
  const variantStyles: Record<string, string> = {
    success: "bg-tosca-100 text-tosca-800 border-tosca-200",
    warning: "bg-kuning-100 text-kuning-800 border-kuning-200",
    danger:  "bg-maroon-100 text-maroon-800 border-maroon-200",
    info:    "bg-blue-100 text-blue-800 border-blue-200",
    neutral: "bg-neutral-light text-neutral-slate border-neutral-silver",
  };

  // Warna dot
  const dotStyles: Record<string, string> = {
    success: "bg-tosca-500",
    warning: "bg-kuning-500",
    danger:  "bg-maroon-500",
    info:    "bg-blue-500",
    neutral: "bg-neutral-gray",
  };

  // Style ukuran
  const sizeStyles: Record<string, string> = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-badge font-medium border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim()}
      {...props}
    >
      {/* Dot indicator */}
      {dot && !icon && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotStyles[variant]}`}
          aria-hidden="true"
        />
      )}

      {/* Ikon */}
      {icon && <span className="flex-shrink-0">{icon}</span>}

      {/* Teks */}
      {children}
    </span>
  );
}

export default Badge;
