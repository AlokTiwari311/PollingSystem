/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strict Palette from Screenshot
        primary: {
          light: '#7765DA',   // Top Purple
          DEFAULT: '#5767D0', // Middle Purple (Main)
          dark: '#4F0DCE',    // Bottom Purple
        },
        gray: {
          light: '#F2F2F2',   // Off-white background
          medium: '#6E6E6E',  // Subtext/Borders
          DEFAULT: '#373737', // Main Text/Headers
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
