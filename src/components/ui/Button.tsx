// =============================================================================
// COMPONENT: BUTTON — SIM-PKK Design System
// =============================================================================
// Tombol reusable dengan variant gradient premium, hover scale, dan glow.
// =============================================================================

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-gradient-to-r from-tosca-500 to-tosca-600 text-white shadow-md shadow-tosca-500/25 hover:from-tosca-600 hover:to-tosca-700 hover:shadow-lg hover:shadow-tosca-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
  secondary:
    "bg-gradient-to-r from-kuning-400 to-kuning-500 text-kuning-900 shadow-md shadow-kuning-400/20 hover:from-kuning-500 hover:to-kuning-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
  outline:
    "bg-white text-neutral-charcoal border border-neutral-silver hover:bg-neutral-snow hover:border-tosca-300 hover:text-tosca-700 hover:-translate-y-0.5 active:translate-y-0",
  danger:
    "bg-gradient-to-r from-maroon-500 to-maroon-600 text-white shadow-md shadow-maroon-500/20 hover:from-maroon-600 hover:to-maroon-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
  ghost:
    "bg-transparent text-neutral-slate hover:bg-neutral-snow hover:text-neutral-charcoal",
};

const sizeClasses: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-button",
  md: "px-4 py-2.5 text-sm gap-2 rounded-button",
  lg: "px-6 py-3 text-base gap-2.5 rounded-[10px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
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
          <span>Memproses...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
