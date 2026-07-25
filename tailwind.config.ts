import type { Config } from "tailwindcss";

// Matches the ASLM marketing site's palette (near-black + gold, Playfair
// Display + Inter) so the rider/driver apps feel like the same brand.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: "hsl(0 0% 3%)",
          card: "hsl(0 0% 6%)",
          muted: "hsl(0 0% 12%)",
          border: "hsl(0 0% 15%)",
          fg: "hsl(0 0% 95%)",
          "fg-muted": "hsl(0 0% 60%)",
        },
        gold: {
          DEFAULT: "hsl(44 97% 61%)",
          deep: "hsl(30 65% 46%)",
        },
        danger: "hsl(0 84% 60%)",
        success: "hsl(142 71% 45%)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, hsl(44 97% 61%), hsl(30 65% 46%))",
      },
      boxShadow: {
        gold: "0 0 30px hsl(44 97% 61% / 0.15)",
        sheet: "0 -8px 30px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        sheet: "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
