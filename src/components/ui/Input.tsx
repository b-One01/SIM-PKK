// =============================================================================
// KOMPONEN UI: INPUT — SIM-PKK
// =============================================================================
// Input field dengan dukungan label, helper text, error state, dan ikon.
// Dirancang untuk form pendataan Dasawisma yang intensif.
// =============================================================================

"use client";

import React, { useId } from "react";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label di atas input */
  label?: string;
  /** Teks bantuan di bawah input */
  helperText?: string;
  /** Pesan error (otomatis mengaktifkan style error) */
  error?: string;
  /** Ukuran input */
  size?: "sm" | "md" | "lg";
  /** Ikon di sebelah kiri */
  leftIcon?: React.ReactNode;
  /** Ikon di sebelah kanan */
  rightIcon?: React.ReactNode;
  /** Wajib diisi (menampilkan tanda bintang) */
  isRequired?: boolean;
}

/**
 * Komponen Input — Field input utama SIM-PKK.
 * Mendukung label, validasi visual, dan ikon.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      helperText,
      error,
      size = "md",
      leftIcon,
      rightIcon,
      isRequired = false,
      id: propId,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = propId || autoId;

    // Style ukuran
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
            htmlFor={inputId}
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

        {/* Input Container */}
        <div className="relative">
          {/* Ikon Kiri */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-gray pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-input
              bg-white border
              font-sans text-neutral-charcoal
              placeholder:text-neutral-gray
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-neutral-light disabled:cursor-not-allowed disabled:opacity-60
              ${hasError
                ? "border-maroon-400 focus:ring-maroon-200 focus:border-maroon-500"
                : "border-neutral-silver hover:border-tosca-300 focus:ring-tosca-200 focus:border-tosca-500"
              }
              ${sizeStyles[size]}
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${className}
            `.trim()}
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {/* Ikon Kanan */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-gray">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {hasError && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-xs text-maroon-600 flex items-center gap-1"
            role="alert"
          >
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!hasError && helperText && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-xs text-neutral-slate"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
