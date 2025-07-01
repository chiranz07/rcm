/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#4A90E2', // A nice blue for main elements
        'secondary': '#50E3C2', // A greenish accent
        'background': '#F7F8FC', // Light gray background
        'card': '#FFFFFF', // Card background
        'text-primary': '#333333',
        'text-secondary': '#8A8A8A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}