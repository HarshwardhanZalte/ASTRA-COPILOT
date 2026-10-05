/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#080B12',
          secondary: '#0D111A',
          panel: '#111722',
        },
        border: {
          DEFAULT: '#263142',
          light: '#1E2D40',
        },
        accent: {
          cyan: '#38BDF8',
          'cyan-dim': '#0EA5E9',
        },
        status: {
          ok: '#22C55E',
          warn: '#F59E0B',
          error: '#EF4444',
          info: '#38BDF8',
        },
        text: {
          primary: '#E5E7EB',
          secondary: '#94A3B8',
          dim: '#64748B',
          mono: '#7DD3FC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
