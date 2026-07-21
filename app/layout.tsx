import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FaradayBoard — Cabinet Faraday",
  description: "Gestion interne des horaires et des équipes du Cabinet Faraday.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
