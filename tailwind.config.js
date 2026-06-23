/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#070809',
          900: '#0c0e11',
          850: '#101317',
          800: '#161a20',
          750: '#1c2128',
          700: '#232932',
          600: '#2f3642',
          500: '#3c4452',
          400: '#5a6273',
          300: '#7e8696',
          200: '#a8afc0',
          100: '#d4d8e4',
          50: '#eef0f7',
        },
        accent: {
          DEFAULT: '#7dd3c0',
          glow: '#7dd3c080',
        },
        danger: {
          DEFAULT: '#e35d6a',
          glow: '#e35d6a80',
        },
        warn: {
          DEFAULT: '#e8b96a',
        },
      },
      animation: {
        'pulse-slow': 'pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 3s linear infinite',
        'flicker': 'flicker 4s linear infinite',
        'barber': 'barber 1.4s linear infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { transform: 'translateY(100%)', opacity: '0.5' },
        },
        flicker: {
          '0%, 19%, 21%, 23%, 100%': { opacity: '1' },
          '20%, 22%': { opacity: '0.6' },
        },
        barber: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
      },
    },
  },
  plugins: [],
};
