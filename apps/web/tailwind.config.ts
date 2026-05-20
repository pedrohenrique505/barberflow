import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F7F4EF",
        border: "#DDD6CC",
        primary: "#2F2A24",
        surface: "#FFFFFF",
        "surface-muted": "#F1EDE7",
        text: {
          primary: "#1F1D1B",
          secondary: "#6F6760",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
