/** @type {import('tailwindcss').Config} */

import defaultTheme from "tailwindcss/defaultTheme";
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        darkGray: "#1C1C1C",
        lightOrange: "#FFA348",
        darkOrange: "#E65100",
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
