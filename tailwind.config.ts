// =============================================================================
// TAILWIND CONFIG — SIM-PKK (Sistem Informasi Manajemen PKK)
// =============================================================================
// Palet warna resmi PKK dengan aturan komposisi 60-30-10:
// 60% Dominan : Tosca (identitas) + Putih (background)
// 30% Sekunder: Kuning Lembut (kehangatan) + Abu-abu (border/kartu)
// 10% Aksen   : Maroon/Coral (CTA, alert, notifikasi)
// =============================================================================

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // === PRIMARY / IDENTITY (60% - Dominan) ===
        // Tosca / Hijau Telur Asin Muda — Melambangkan kesehatan & lingkungan
        tosca: {
          50:  "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",   // ★ Warna utama brand
          600: "#0D9488",   // Primary button default
          700: "#0F766E",   // Primary button active
          800: "#115E59",
          900: "#134E4A",
          950: "#042F2E",
        },

        // === SECONDARY / WARMTH (30% - Sekunder) ===
        // Kuning Lembut / Oranye Muda — Melambangkan energi & kehangatan
        kuning: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",   // ★ Warna sekunder brand
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },

        // === ACCENT / CTA (10% - Aksen) ===
        // Maroon / Coral — Untuk tombol penting, alert, call-to-action
        maroon: {
          50:  "#FFF1F2",
          100: "#FFE4E6",
          200: "#FECDD3",
          300: "#FDA4AF",
          400: "#FB7185",
          500: "#F43F5E",   // ★ Warna aksen utama
          600: "#E11D48",   // CTA button default
          700: "#BE123C",
          800: "#9F1239",
          900: "#881337",
        },

        // === NEUTRALS — Hindari hitam murni untuk mengurangi kelelahan mata ===
        neutral: {
          white:    "#FFFFFF",
          snow:     "#FAFAFA",
          light:    "#F5F5F5",   // Background kartu & border
          silver:   "#E5E5E5",   // Border input
          gray:     "#A3A3A3",   // Placeholder text
          slate:    "#737373",   // Teks sekunder
          dark:     "#525252",   // Teks body
          charcoal: "#333333",   // ★ Teks utama (bukan hitam murni)
          night:    "#1A1A1A",   // Dark mode background
        },
      },

      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-outfit)", "Outfit", "Inter", "sans-serif"],
      },

      borderRadius: {
        card: "12px",
        button: "8px",
        input: "8px",
        badge: "20px",
      },

      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)",
        button: "0 1px 2px rgba(0,0,0,0.05)",
        dropdown: "0 10px 40px rgba(0,0,0,0.1)",
        modal: "0 25px 60px rgba(0,0,0,0.15)",
      },

      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },

      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.2s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
