import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lit ses fichiers de police (.afm) via fs relatif à son propre
  // __dirname au moment de l'exécution — le bundler (Turbopack/webpack) le
  // réécrit sinon et casse ce chemin (ENOENT sur les .afm). On l'exclut du
  // bundling pour qu'il reste requis normalement depuis node_modules.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
