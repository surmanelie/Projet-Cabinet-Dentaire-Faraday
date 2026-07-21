import type { Config } from "tailwindcss";

// Palette "Sauge et crème" du Cabinet Faraday : vert sauge doux + neutres chauds.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vert sauge — couleur principale (boutons, accents, QR codes)
        faraday: {
          50: "#eef3f0",
          100: "#dce7e0",
          200: "#bdd0c6",
          300: "#97b4a5",
          400: "#729784",
          500: "#5e7f6e",
          600: "#4c6b5b",
          700: "#3d5649",
          800: "#2f4237",
          900: "#22312a",
        },
        // Neutres chauds (greige) — textes, bordures, fonds discrets
        ardoise: {
          50: "#f5f4ef",
          100: "#e9e7df",
          200: "#d7d3c8",
          300: "#b4afa2",
          400: "#8a877c",
          500: "#6e7b72",
          600: "#565f57",
          700: "#434b45",
          800: "#2f3b33",
          900: "#212a24",
        },
        // Crème — fond de page
        creme: {
          DEFAULT: "#f6f4ef",
          50: "#faf9f5",
          100: "#f6f4ef",
          200: "#efece3",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
