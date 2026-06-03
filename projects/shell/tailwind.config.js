/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./projects/shell/src/**/*.{html,ts}",
    "../libs/**/*.{html,ts}",
    "./projects/libs/**/*.{html,ts}",
    "../../node_modules/flowbite/**/*.js",
    "./node_modules/flowbite/**/*.js",
  ],
  theme: {
    screens: {
        'sm':'640px',
      'md':'768px',
      'lg':'1024px',
      'xl':'1280px',
      '2xl':'1536px',
    },
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("flowbite/plugin"),

    require('flowbite-typography'),

    
  ],
};
