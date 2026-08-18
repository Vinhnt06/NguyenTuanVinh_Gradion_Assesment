/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        grad: {
          orange: "#FF6B00",
          "orange-hover": "#E85F00",
          "orange-light": "#FFA861",
          "orange-pale": "#FFC391",
          "orange-deep": "#3A160A",
          ink: "#231F20",
          "ink-body": "#434343",
          "ink-2": "#595959",
          "ink-3": "#919699",
          line: "#BAB7B1",
          paper: "#F2EEE7",
          "paper-2": "#F8F8F8",
          black: "#1D1C1D",
        },
      },
      fontFamily: {
        sans: ["Noto Sans", "system-ui", "sans-serif"],
        display: ["Noto Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
