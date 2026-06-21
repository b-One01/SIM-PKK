// =============================================================================
// KOMPONEN UI: SELECT — SIM-PKK
// =============================================================================
// Dropdown select untuk form Dasawisma.
// Banyak digunakan di: jenis_kb, sumber_air, kriteria_rumah, dll.
// =============================================================================

"use client";

import React, { useId } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Label di atas select */
  label?: string;
  /** Teks bantuan */
  helperText?: string;
  /** Pesan error */
  error?: string;
  /** Opsi dropdown */
  options: SelectOption[];
  /** Teks placeholder (opsi pertama yang tidak bisa dipilih) */
  placeholder?: string;
  /** Ukuran select */
  size?: "sm" | "md" | "lg";
  /** Wajib diisi */
  isRequired?: boolean;
}

/**
 * Komponen Select — Dropdown pilihan untuk form Dasawisma.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = "",
      label,
      helperText,
      error,
      options,
      placeholder = "Pilih...",
      size = "md",
      isRequired = false,
      id: propId,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const selectId = propId || autoId;

    const sizeStyles: Record<string, string> = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-3.5 py-2.5 text-sm",
      lg: "px-4 py-3 text-base",
    };

    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-neutral-charcoal mb-1.5"
          >
            {label}
            {isRequired && (
              <span className="text-maroon-500 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Select Field */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full rounded-input appearance-none
              bg-white border cursor-pointer
              font-sans text-neutral-charcoal
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-neutral-light disabled:cursor-not-allowed disabled:opacity-60
              ${hasError
                ? "border-maroon-400 focus:ring-maroon-200 focus:border-maroon-500"
                : "border-neutral-silver hover:border-tosca-300 focus:ring-tosca-200 focus:border-tosca-500"
              }
              ${sizeStyles[size]}
              pr-10
              ${className}
            `.trim()}
            aria-invalid={hasError ? "true" : undefined}
            {...props}
          >
            {/* Placeholder */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {/* Options */}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Chevron Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-gray">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        {hasError && (
          <p className="mt-1.5 text-xs text-maroon-600" role="alert">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!hasError && helperText && (
          <p className="mt-1.5 text-xs text-neutral-slate">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
