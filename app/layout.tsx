import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Surmaly — Gestion du temps",
  description: "Surmaly : pointage, horaires et suivi des heures pour votre cabinet.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={sans.variable}>
      <body className="bg-ardoise-50 font-sans text-ardoise-900 antialiased">{children}</body>
    </html>
  );
}
