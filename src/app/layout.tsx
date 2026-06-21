// =============================================================================
// ROOT LAYOUT — SIM-PKK
// =============================================================================
// Layout utama aplikasi. Mengatur font (Inter + Outfit),
// metadata SEO, dan wrapper HTML dasar.
// =============================================================================

import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

// Font utama: Inter untuk body text
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Font display: Outfit untuk heading
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

// Metadata SEO
export const metadata: Metadata = {
  title: {
    default: "SIM-PKK — Sistem Informasi Manajemen PKK",
    template: "%s | SIM-PKK",
  },
  description:
    "Sistem Informasi Manajemen Pemberdayaan Kesejahteraan Keluarga (PKK) — Platform pendataan keluarga terintegrasi dari tingkat Dasawisma hingga Kabupaten.",
  keywords: [
    "SIM-PKK",
    "PKK",
    "Pemberdayaan Kesejahteraan Keluarga",
    "Dasawisma",
    "Pendataan Keluarga",
  ],
  authors: [{ name: "SIM-PKK Team" }],
};

// Viewport untuk PWA & mobile
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#14B8A6", // Tosca-500
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${outfit.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-neutral-charcoal">
        {children}
      </body>
    </html>
  );
}
