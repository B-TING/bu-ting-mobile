/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard-Regular'],
      },
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
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.font-sans': { fontFamily: 'Pretendard-Regular' },
        '.font-medium': { fontFamily: 'Pretendard-Medium', fontWeight: 'normal' },
        '.font-semibold': { fontFamily: 'Pretendard-SemiBold', fontWeight: 'normal' },
        '.font-bold': { fontFamily: 'Pretendard-Bold', fontWeight: 'normal' },
        '.font-extrabold': { fontFamily: 'Pretendard-ExtraBold', fontWeight: 'normal' },
        '.font-black': { fontFamily: 'Pretendard-Black', fontWeight: 'normal' },
      });
    }),
  ],
};
