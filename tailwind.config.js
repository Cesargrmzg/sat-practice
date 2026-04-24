/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        vercel: {
          black: '#171717',
          gray: {
            50: '#fafafa',
            100: '#ebebeb',
            400: '#808080',
            500: '#666666',
            600: '#4d4d4d',
            900: '#171717',
          },
          blue: '#0072f5',
          red: '#ff5b4f',
          pink: '#de1d8d',
          develop: '#0a72ef',
        },
      },
    },
  },
  plugins: [],
}
