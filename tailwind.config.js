/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#1d4ed8',
          600: '#1e40af',
          700: '#1e3a8a',
          800: '#1e3070',
          900: '#172554',
        },
        accent: '#f59e0b',
      },
      fontFamily: {
        sans: ['Sarabun', 'sans-serif'],
        display: ['Prompt', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
