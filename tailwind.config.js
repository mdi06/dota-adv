/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        radiant: '#2ecc71',
        dire: '#e74c3c'
      }
    },
  },
  plugins: [],
}
