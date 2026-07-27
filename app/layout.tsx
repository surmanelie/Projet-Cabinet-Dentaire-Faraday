import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Surmaly — Gestion du temps",
  description: "Surmaly : pointage, horaires et suivi des heures pour votre cabinet.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
