/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-black': '#05070f',
        'cyber-dark-blue': '#0b0f19',
        'cyber-gray': '#171d2c',
        'cyber-cyan': '#00f0ff',
        'cyber-purple': '#9d4ede',
        'cyber-pink': '#ff007f',
        'cyber-white': '#ffffff',
        'cyber-light-gray': '#b0b7c6',
      },
    },
  },
  plugins: [],
};
