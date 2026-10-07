module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        avionics: {
          900: '#070b14',
          850: '#0b1120',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
          border: 'rgba(255, 255, 255, 0.08)',
          glow: 'rgba(56, 189, 248, 0.15)',
        },
        cyan: {
          accent: '#06b6d4',
          glow: '#22d3ee',
        },
        emerald: {
          health: '#10b981',
          glow: 'rgba(16, 185, 129, 0.25)',
        },
        amber: {
          warn: '#f59e0b',
        },
        rose: {
          alert: '#f43f5e',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

