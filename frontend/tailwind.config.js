/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        bubbly: ['Bubblegum Sans', 'cursive'],
        comic: ['Comic Neue', 'cursive'],
        rounded: ['Sniglet', 'cursive'],
      },
      colors: {
        'cyworld-pink': '#ffcce0',
        'cyworld-blue': '#99ccff',
        'cyworld-yellow': '#ffcc66',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        }
      }
    },
  },
  plugins: [],
};
