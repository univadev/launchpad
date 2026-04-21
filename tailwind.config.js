/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8f6",
          100: "#fbeae3",
          200: "#f7d5c7",
          300: "#f0b6a0",
          400: "#e88d70",
          500: "#e06b4a",
          600: "#d95d39", // YOUR BASE (White text safe)
          700: "#b54a2b",
          800: "#913b22",
          900: "#75301c",
          950: "#451a0e",
        },
        accent: {
          400: "#c7f9cc",
          500: "#80ed99",
          600: "#57cc99",
        },
      },
      fontFamily: {
        sans: ["Google Sans", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease-out",
        "slide-up": "slideUp 0.15s ease-out",
        "spin-fast": "spin 0.588s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "scale(1)", opacity: "0" },
          "100%": { transform: "scale(1.05)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
