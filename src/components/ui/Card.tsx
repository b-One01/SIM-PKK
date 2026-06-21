// =============================================================================
// COMPONENT: CARD — SIM-PKK Design System
// =============================================================================
// Kartu premium dengan variant glass, hover lift, dan gradient border.
// =============================================================================

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "glass" | "gradient";
  hover?: boolean;
  children: React.ReactNode;
}

const paddingClasses: Record<string, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4 md:p-5",
  lg: "p-5 md:p-6",
};

export default function Card({
  padding = "md",
  variant = "default",
  hover = true,
  className = "",
  children,
  ...props
}: CardProps) {
  const variantClass =
    variant === "glass"
      ? "bg-white/60 backdrop-blur-xl border border-white/30 shadow-lg"
      : variant === "gradient"
      ? "bg-white border border-neutral-light/50 shadow-card gradient-border"
      : "bg-white border border-neutral-light/40 shadow-card";

  return (
    <div
      className={`
        rounded-2xl transition-all duration-300 ease-out
        ${variantClass}
        ${hover ? "hover:shadow-card-hover" : ""}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// Sub-components
export function CardTitle({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      className={`font-display font-bold text-lg text-neutral-charcoal ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={`text-sm text-neutral-slate mt-1 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}
