/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        correct: 'var(--green)',
        'correct-bg': 'var(--green-bg)',
        wrong: 'var(--red)',
        'wrong-bg': 'var(--red-bg)',
        warning: 'var(--yellow)',
        bg: 'var(--bg)',
        card: 'var(--card)',
        'card-hover': 'var(--card-hover)',
        'text-primary': 'var(--text-1)',
        'text-secondary': 'var(--text-2)',
        'text-tertiary': 'var(--text-3)',
        divider: 'var(--divider)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'btn': '14px',
      },
      boxShadow: {
        'card': 'var(--shadow-sm)',
        'card-hover': 'var(--shadow-md)',
        'elevated': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}
