/** @type {import('tailwindcss').Config} */
module.exports = {
  -  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  -  theme: { extend: {} },
  +  darkMode: "class",                                   // 👈 add this line
  +  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  +  theme: { extend: {} },
     plugins: [],
  };
