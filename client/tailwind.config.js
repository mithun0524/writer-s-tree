/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background-primary': '#FEFDFB',
        'background-secondary': '#F8F6F3',
        'text-primary': '#2C2C2C',
        'text-secondary': '#6B6B6B',
        'text-tertiary': '#A8A8A8',
        'tree-trunk': '#5C4A3A',
        'tree-bark': '#3D2F24',
        'tree-leaves-young': '#7CB342',
        'tree-leaves-mature': '#558B2F',
        'tree-leaves-highlight': '#9CCC65',
        'accent-bloom': '#FFA5C0',
        'accent-bloomDeep': '#FF6B9D',
        'accent-focus': '#4A90E2',
        'accent-success': '#7CB342',
        'accent-warning': '#FFB74D',
        'border-light': '#E0DDD8',
        'border-subtle': '#F0EDE8',
      },
      fontFamily: {
        serif: ['Lora', 'Crimson Text', 'Georgia', 'serif'],
        sans: ['Inter', 'SF Pro Display', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      spacing: {
        'xxs': '4px',
        // 'xs' defaults to 0.75rem or similar in v4? No, spacing is usually numeric. 
        // We will keep 'xs' as extra small spacing if needed, but remove standard t-shirt sizes that conflict with max-width/screens
        'space-xs': '8px',
        'space-sm': '16px',
        'space-md': '24px',
        'space-lg': '32px',
        'space-xl': '48px',
        'space-xxl': '64px',
      },
      boxShadow: {
        'level1': '0 1px 3px rgba(0,0,0,0.04)',
        'level2': '0 2px 8px rgba(0,0,0,0.06)',
        'level3': '0 4px 16px rgba(0,0,0,0.08)',
        'level4': '0 8px 32px rgba(0,0,0,0.10)',
      },
      animation: {
        'sway': 'sway 4s ease-in-out infinite',
        'grow': 'grow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bloom': 'bloom 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'pulse-subtle': 'pulse-subtle 3s infinite',
      },
      keyframes: {
        sway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        grow: {
          '0%': { transform: 'scale(0)' },
          '100%': { transform: 'scale(1)' },
        },
        bloom: {
          '0%': { transform: 'scale(0) rotate(0deg)' },
          '100%': { transform: 'scale(1) rotate(360deg)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
