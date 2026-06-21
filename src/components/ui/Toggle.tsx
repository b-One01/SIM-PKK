// =============================================================================
// KOMPONEN UI: TOGGLE — SIM-PKK
// =============================================================================
// Toggle switch untuk data Ya/Tidak di form Dasawisma.
// Banyak digunakan di: is_hamil, is_balita, is_disabilitas, dll.
// =============================================================================

"use client";

import React, { useId } from "react";

export interface ToggleProps {
  /** Label di samping toggle */
  label?: string;
  /** Deskripsi tambahan */
  description?: string;
  /** Status aktif/tidak */
  checked?: boolean;
  /** Handler perubahan */
  onChange?: (checked: boolean) => void;
  /** Nonaktifkan toggle */
  disabled?: boolean;
  /** Ukuran toggle */
  size?: "sm" | "md" | "lg";
  /** ID kustom */
  id?: string;
  /** Nama untuk form */
  name?: string;
}

/**
 * Komponen Toggle — Switch Ya/Tidak untuk form Dasawisma.
 * Dioptimalkan untuk penggunaan mobile (target area besar).
 */
export function Toggle({
  label,
  description,
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  id: propId,
  name,
}: ToggleProps) {
  const autoId = useId();
  const toggleId = propId || autoId;

  // Ukuran switch track
  const trackSizes: Record<string, string> = {
    sm: "w-8 h-[18px]",
    md: "w-11 h-6",
    lg: "w-14 h-7",
  };

  // Ukuran switch thumb
  const thumbSizes: Record<string, string> = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  // Posisi thumb saat aktif
  const thumbTranslate: Record<string, string> = {
    sm: "translate-x-[14px]",
    md: "translate-x-5",
    lg: "translate-x-7",
  };

  return (
    <div className="flex items-start gap-3">
      {/* Switch */}
      <button
        id={toggleId}
        role="switch"
        type="button"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`
          relative inline-flex flex-shrink-0
          rounded-full cursor-pointer
          transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tosca-400 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${trackSizes[size]}
          ${checked ? "bg-tosca-500" : "bg-neutral-silver"}
        `}
      >
        <span
          className={`
            inline-block rounded-full bg-white shadow-md
            transition-transform duration-200 ease-in-out
            ${thumbSizes[size]}
            ${checked ? thumbTranslate[size] : "translate-x-0.5"}
            mt-[1px] ml-[1px]
          `}
        />
      </button>

      {/* Hidden input untuk form submission */}
      {name && (
        <input type="hidden" name={name} value={checked ? "true" : "false"} />
      )}

      {/* Label & Description */}
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={toggleId}
              className={`
                text-sm font-medium cursor-pointer select-none
                ${disabled ? "text-neutral-gray" : "text-neutral-charcoal"}
              `}
            >
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-neutral-slate mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default Toggle;
