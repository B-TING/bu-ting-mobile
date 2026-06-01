/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0077B6',
          secondary: '#00B4D8',
          background: '#F8FAFC',
          surface: '#FFFFFF',
          text: '#1E293B',
          muted: '#64748B',
          border: '#E2E8F0',
          selected: '#E8F4FC',
          skip: {
            bg: '#FFF7ED',
            border: '#F97316',
            text: '#C2410C',
          },
        },
      },
    },
  },
  plugins: [],
};
