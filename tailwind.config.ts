import type { Config } from "tailwindcss";

// Direction artistique "Maison Surmaly" : ivoire chaud, vert sauge profond,
// anthracite. Palette volontairement restreinte, proche d'une identité
// d'hôtellerie boutique / cabinet d'architecture plutôt que d'un site médical.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vert sauge → vert profond — couleur principale (boutons, accents)
        faraday: {
          50: "#EEF1EE",
          100: "#DEE4DC",
          200: "#C3CEC0",
          300: "#A2B29C",
          400: "#7B8B7C", // sauge désaturé — accent secondaire
          500: "#5C6F5E",
          600: "#45543F",
          700: "#34423A", // vert profond — accent principal
          800: "#283329",
          900: "#1C241D",
        },
        // Neutres chauds — ivoire (fonds), beige minéral (bordures), anthracite (texte)
        ardoise: {
          50: "#F7F5F0", // ivoire chaud — fond de page
          100: "#EFEBE2",
          200: "#E8E2D8", // beige minéral — bordures
          300: "#D2CBBC",
          400: "#A79E8C",
          500: "#8B8172",
          600: "#6B6357",
          700: "#4E4941",
          800: "#322E29",
          900: "#232624", // anthracite — texte principal
        },
        // Alias du fond ivoire
        creme: {
          DEFAULT: "#F7F5F0",
          50: "#FBFAF7",
          100: "#F7F5F0",
          200: "#EFEBE2",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "8px",
        "2xl": "10px",
      },
      maxWidth: {
        content: "1600px",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      letterSpacing: {
        wider2: "0.14em",
      },
    },
  },
  plugins: [],
};

export default config;
