/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1b4f72',
        secondary: '#f8c471',
        surface: '#f4f6f8',
      },
    },
  },
  plugins: [],
};
