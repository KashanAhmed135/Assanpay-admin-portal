/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0b1220',
        'text-primary': '#eaf1ff',
        'text-secondary': 'rgba(169,183,212,0.85)',
        'border-color': 'rgba(255,255,255,0.12)',
        'primary-blue': 'rgba(90,167,255,0.20)',
        'primary-blue-border': 'rgba(90,167,255,0.35)',
        'primary-blue-hover': 'rgba(90,167,255,0.28)',
        'success-green': 'rgba(47,208,122,0.35)',
        'success-bg': 'rgba(47,208,122,0.08)',
        'success-text': 'rgba(47,208,122,0.95)',
        'error-red': 'rgba(255,90,122,0.35)',
        'error-bg': 'rgba(255,90,122,0.08)',
        'error-text': 'rgba(255,90,122,0.95)',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 12px 30px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
}
