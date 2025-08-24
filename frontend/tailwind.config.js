/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "custom-enter": {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "custom-leave": {
          "0%": { opacity: 1, transform: "translateY(0)" },
          "100%": { opacity: 0, transform: "translateY(20px)" },
        },
      },
      animation: {
        "custom-enter": "custom-enter 0.3s ease-out",
        "custom-leave": "custom-leave 0.2s ease-in forwards",
      },
    },
  },
  plugins: [],
};
