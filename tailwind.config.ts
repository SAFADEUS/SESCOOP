import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coop: {
          50: "#effaf3",
          100: "#d8f3e1",
          200: "#b3e6c6",
          300: "#80d2a3",
          400: "#4bb77d",
          500: "#279b60",
          600: "#197d4d",
          700: "#156340",
          800: "#134f35",
          900: "#10412d",
        },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
