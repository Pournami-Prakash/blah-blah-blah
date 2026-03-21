/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
        caveat: ['Caveat', 'cursive'],
      },
      colors: {
        cream: {
          50: '#FDFCFA',
          100: '#F7F3EE',
          200: '#EDE8DF',
          300: '#E8E0D4',
          400: '#D8D0C4',
          500: '#C8C0B4',
        },
        ink: {
          DEFAULT: '#2A2420',
          light: '#8A7A6A',
          muted: '#B0A090',
          faint: '#C8C0B4',
        },
        pin: '#7A9A70',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '22px',
        '4xl': '28px',
      },
    },
  },
  plugins: [],
}
