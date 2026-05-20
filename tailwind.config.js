/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
        display: ['Instrument Serif', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0A0A0A',
          soft: '#171717',
          muted: '#525252',
        },
        canvas: {
          DEFAULT: '#FAFAF7',
          raised: '#FFFFFF',
          sunken: '#F5F5F3',
        },
        accent: {
          DEFAULT: '#0095F6',
          hover: '#0B7FD6',
        },
      },
      boxShadow: {
        studio: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.04)',
        'studio-lg': '0 4px 16px rgba(16,24,40,0.06), 0 2px 4px rgba(16,24,40,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.98)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
