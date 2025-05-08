/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: [
    require('@tailwindcss/typography')  // підключаємо плагін типографіки (для класу 'prose' тощо)
  ]
};
