/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');
export default {
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out',
      },
    },
    fontFamily: {
      sans: ['SF Pro Text', ...defaultTheme.fontFamily.sans],
    },
  },
  plugins: [],
};