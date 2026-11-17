/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agro: {
          dark: '#174C32',
          primary: '#1E6240',
          secondary: '#2E8B57',
          accent: '#48B273',
          light: '#EAF5EC',
          bg: '#F6F8F5',
          text: '#1F2937',
          muted: '#6B7280',
          amber: '#D97706',
          earth: '#8B5A2B',
          card: '#FFFFFF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
