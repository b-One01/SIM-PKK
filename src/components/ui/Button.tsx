// =============================================================================
// KOMPONEN UI: BUTTON — SIM-PKK
// =============================================================================
// Tombol utama dengan varian sesuai palet warna PKK:
// - primary  : Tosca (aksi utama)
// - secondary: Kuning (aksi sekunder)
// - accent   : Maroon (CTA / peringatan)
// - outline  : Border saja (aksi tersier)
// - ghost    : Tanpa background (aksi minimal)
// =============================================================================

import React from "react";

// Tipe properti Button
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Varian tampilan tombol */
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "danger";
  /** Ukuran tombol */
  size?: "sm" | "md" | "lg" | "xl";
  /** Tampilkan loading spinner */
  isLoading?: boolean;
  /** Ikon di sebelah kiri teks */
  leftIcon?: React.ReactNode;
  /** Ikon di sebelah kanan teks */
  rightIcon?: React.ReactNode;
  /** Tombol mengisi lebar penuh */
  fullWidth?: boolean;
}

/**
 * Komponen Button — Tombol utama SIM-PKK.
 * Menggunakan palet warna PKK dengan micro-animations.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Style varian
    const variantStyles: Record<string, string> = {
      primary:
        "bg-tosca-600 text-white hover:bg-tosca-700 active:bg-tosca-800 shadow-button hover:shadow-md",
      secondary:
        "bg-kuning-400 text-neutral-charcoal hover:bg-kuning-500 active:bg-kuning-600 shadow-button hover:shadow-md",
      accent:
        "bg-maroon-600 text-white hover:bg-maroon-700 active:bg-maroon-800 shadow-button hover:shadow-md",
      outline:
        "border-2 border-tosca-500 text-tosca-700 hover:bg-tosca-50 active:bg-tosca-100",
      ghost:
        "text-tosca-700 hover:bg-tosca-50 active:bg-tosca-100",
      danger:
        "bg-maroon-500 text-white hover:bg-maroon-600 active:bg-maroon-700 shadow-button hover:shadow-md",
    };

    // Style ukuran
    const sizeStyles: Record<string, string> = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2.5 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2.5",
      xl: "px-8 py-4 text-lg gap-3",
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center
          font-medium rounded-button
          transition-all duration-200 ease-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tosca-400 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
          active:scale-[0.98]
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `.trim()}
        disabled={isDisabled}
        {...props}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <svg
            className="animate-spin -ml-1 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Ikon Kiri */}
        {!isLoading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}

        {/* Teks */}
        <span>{children}</span>

        {/* Ikon Kanan */}
        {rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
