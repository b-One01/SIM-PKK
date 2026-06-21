// =============================================================================
// KOMPONEN UI: CARD — SIM-PKK
// =============================================================================
// Komponen kartu dengan desain borderless modern.
// Varian: default (shadow), flat (background), outline (border).
// =============================================================================

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Varian tampilan kartu */
  variant?: "default" | "flat" | "outline" | "glass";
  /** Padding internal */
  padding?: "none" | "sm" | "md" | "lg";
  /** Aktifkan efek hover (shadow naik) */
  hoverable?: boolean;
  /** Header kartu (opsional) */
  header?: React.ReactNode;
  /** Footer kartu (opsional) */
  footer?: React.ReactNode;
}

/**
 * Komponen Card — Kartu konten utama SIM-PKK.
 * Desain borderless dengan whitespace tinggi.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = "",
      variant = "default",
      padding = "md",
      hoverable = false,
      header,
      footer,
      children,
      ...props
    },
    ref
  ) => {
    // Style varian
    const variantStyles: Record<string, string> = {
      default: "bg-white shadow-card",
      flat: "bg-neutral-light",
      outline: "bg-white border border-neutral-silver",
      glass: "glass",
    };

    // Style padding
    const paddingStyles: Record<string, string> = {
      none: "p-0",
      sm: "p-3",
      md: "p-5 md:p-6",
      lg: "p-6 md:p-8",
    };

    return (
      <div
        ref={ref}
        className={`
          rounded-card overflow-hidden
          transition-all duration-300 ease-out
          ${variantStyles[variant]}
          ${hoverable ? "hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer" : ""}
          ${className}
        `.trim()}
        {...props}
      >
        {/* Header */}
        {header && (
          <div className="px-5 py-4 border-b border-neutral-light/70 md:px-6">
            {header}
          </div>
        )}

        {/* Body */}
        <div className={paddingStyles[padding]}>{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-neutral-light/70 bg-neutral-snow/50 md:px-6">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = "Card";

// === Sub-komponen: CardTitle ===
export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={`text-lg font-display font-semibold text-neutral-charcoal ${className}`}
    >
      {children}
    </h3>
  );
}

// === Sub-komponen: CardDescription ===
export function CardDescription({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-sm text-neutral-slate mt-1 ${className}`}>
      {children}
    </p>
  );
}

export default Card;
