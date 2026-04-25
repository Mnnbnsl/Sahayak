/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sahayakDark: '#050816',
        sahayakCard: '#11162B',
        sahayakOrange: '#F97316',
      }
    },
  },
  plugins: [],
}