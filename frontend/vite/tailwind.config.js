/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fcf8f2',
          100: '#f7ebd7',
          200: '#eed1ac',
          300: '#e1b17a',
          400: '#d38b4d',
          500: '#ca6e2e',
          600: '#bc5625',
          700: '#9c4120',
          800: '#7d351f',
          900: '#652d1c',
          950: '#37140c',
        }
      }
    },
  },
  plugins: [],
}
