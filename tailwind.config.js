/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coop: {
          50: '#effaf7', 100: '#d5f2ea', 200: '#a9e3d5', 400: '#2bb5a3',
          500: '#00a091', 600: '#00897b', 700: '#006d63', 800: '#00524b', 900: '#003641',
        },
        lime: { 500: '#7db61c', 600: '#6a9a1f' },
        ink: { 900: '#1c2426', 700: '#3b4648', 500: '#5f6b6d', 400: '#7c8789', 200: '#d9dedf', 100: '#eceff0', 50: '#f6f8f8' },
        series: { a: '#00897B', b: '#5B57A6', c: '#C0782A' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
