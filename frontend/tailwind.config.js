// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        // Add Fira Code for the logo
        mono: ['"Fira Code"', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [],
}