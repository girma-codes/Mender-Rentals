/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neutral: {
          950: '#0B0F0E',
        },
      },
      boxShadow: {
        'glow-emerald-sm': '0 0 12px rgba(16,185,129,0.25)',
        'glow-emerald': '0 0 24px rgba(16,185,129,0.35)',
        'glow-emerald-lg': '0 0 40px rgba(16,185,129,0.45)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
