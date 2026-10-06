/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#040711',
          primary: '#070C18',
          secondary: '#0B1220',
          panel: '#0E1729',
          'panel-glass': 'rgba(14, 23, 41, 0.75)',
        },
        border: {
          DEFAULT: '#1E293B',
          glow: '#38BDF8',
          light: '#24334C',
          subtle: '#152033',
        },
        hud: {
          cyan: '#00F0FF',
          blue: '#38BDF8',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          purple: '#A855F7',
        },
        status: {
          ok: '#10B981',
          warn: '#F59E0B',
          error: '#EF4444',
          info: '#00F0FF',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          dim: '#64748B',
          mono: '#7DD3FC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'hud-cyan': '0 0 15px -3px rgba(0, 240, 255, 0.25)',
        'hud-red': '0 0 15px -3px rgba(239, 68, 68, 0.3)',
        'hud-amber': '0 0 15px -3px rgba(245, 158, 11, 0.25)',
        'hud-green': '0 0 15px -3px rgba(16, 185, 129, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar 4s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}

