import type { Config } from "tailwindcss";

// Palette sobre "Cabinet Faraday" : bleu-vert doux, pas de copie d'identité tierce.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        faraday: {
          50: "#f0f7f6",
          100: "#dbeae8",
          200: "#b8d5d1",
          300: "#8fbab4",
          400: "#5f9a92",
          500: "#3f7e75",
          600: "#2f655e",
          700: "#27514c",
          800: "#22413e",
          900: "#1d3634",
        },
        ardoise: {
          50: "#f6f7f8",
          100: "#eceef0",
          200: "#d4d8dc",
          300: "#aab1b9",
          400: "#7c8690",
          500: "#5b6570",
          600: "#454d56",
          700: "#363c44",
          800: "#262a30",
          900: "#1a1d21",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
