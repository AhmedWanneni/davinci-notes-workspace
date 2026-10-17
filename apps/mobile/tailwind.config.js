/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./reader/**/*.{js,jsx,ts,tsx}",
    "./canvas/**/*.{js,jsx,ts,tsx}",
    "./capture/**/*.{js,jsx,ts,tsx}",
    "./graph/**/*.{js,jsx,ts,tsx}",
    "./sync/**/*.{js,jsx,ts,tsx}",
    "./vault/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset"), require("@app/design-tokens/tailwind")],
  theme: {
    extend: {},
  },
  plugins: [],
};
