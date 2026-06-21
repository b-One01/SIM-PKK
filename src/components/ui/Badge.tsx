// =============================================================================
// COMPONENT: BADGE — SIM-PKK Design System
// =============================================================================
// Badge status dengan dot indicator dan subtle glow untuk visual premium.
// =============================================================================

import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "neutral" | "info";
  showDot?: boolean;
  size?: "sm" | "md";
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  success: "bg-tosca-50 text-tosca-700 border border-tosca-200/50",
  warning: "bg-kuning-50 text-kuning-800 border border-kuning-200/50",
  danger: "bg-maroon-50 text-maroon-700 border border-maroon-200/50",
  neutral: "bg-neutral-snow text-neutral-slate border border-neutral-light",
  info: "bg-blue-50 text-blue-700 border border-blue-200/50",
};

const dotColorClasses: Record<string, string> = {
  success: "bg-tosca-500",
  warning: "bg-kuning-500",
  danger: "bg-maroon-500",
  neutral: "bg-neutral-gray",
  info: "bg-blue-500",
};

export default function Badge({
  variant = "neutral",
  showDot = true,
  size = "sm",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        ${size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColorClasses[variant]}`}
        />
      )}
      {children}
    </span>
  );
}
