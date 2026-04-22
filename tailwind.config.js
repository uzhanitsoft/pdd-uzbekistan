/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007AFF',
        'primary-dark': '#0056CC',
        correct: '#34C759',
        'correct-light': '#34C75920',
        wrong: '#FF3B30',
        'wrong-light': '#FF3B3020',
        bg: '#F2F2F7',
        card: '#FFFFFF',
        'text-primary': '#1C1C1E',
        'text-secondary': '#8E8E93',
        'text-tertiary': '#AEAEB2',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'btn': '14px',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.12)',
        'btn': '0 2px 10px rgba(0,0,0,0.06)',
        'option': '0 2px 12px rgba(0,0,0,0.06)',
        'option-hover': '0 4px 16px rgba(0,0,0,0.1)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 50%, 90%': { transform: 'translateX(-8px)' },
          '30%, 70%': { transform: 'translateX(8px)' },
        },
        'correct-pulse': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'timer-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'score-fill': {
          '0%': { 'stroke-dashoffset': '440' },
          '100%': { 'stroke-dashoffset': 'var(--target-offset)' },
        },
        'flip-in': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
      },
      animation: {
        shake: 'shake 400ms ease-in-out',
        'correct-pulse': 'correct-pulse 200ms ease-in-out',
        'fade-in-up': 'fade-in-up 500ms ease-out',
        'slide-in-right': 'slide-in-right 300ms ease-out',
        'slide-out-left': 'slide-out-left 300ms ease-out',
        'timer-pulse': 'timer-pulse 1s ease-in-out infinite',
      },
      transitionDuration: {
        DEFAULT: '300ms',
      },
    },
  },
  plugins: [],
}
