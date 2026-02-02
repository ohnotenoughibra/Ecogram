import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core black/white palette
        primary: {
          DEFAULT: '#FFFFFF',
          50: '#FFFFFF',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        dark: {
          DEFAULT: '#000000',
          50: '#1A1A1A',
          100: '#171717',
          200: '#141414',
          300: '#0F0F0F',
          400: '#0A0A0A',
          500: '#000000',
        },
        accent: {
          DEFAULT: '#CCCCCC',
          light: '#E5E5E5',
          dark: '#999999',
        },
      },
      backgroundColor: {
        page: '#000000',
        card: '#0A0A0A',
        'card-hover': '#141414',
        input: '#1A1A1A',
        modal: '#0F0F0F',
      },
      textColor: {
        primary: '#FFFFFF',
        secondary: '#CCCCCC',
        muted: '#737373',
      },
      borderColor: {
        DEFAULT: '#262626',
        light: '#404040',
        focus: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
export default config
