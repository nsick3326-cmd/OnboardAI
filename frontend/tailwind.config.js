/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces and brand design tokens
        background: '#F5F6FC',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        'surface-subtle': '#F8F9FD',
        'surface-hover': '#F1F3FA',
        border: '#E7E9F2',
        'border-subtle': '#EEF0F8',

        // Typography colors
        'text-primary': '#17182B',
        'text-secondary': '#727A91',
        'text-muted': '#9BA3B8',

        // Deep Indigo (#211B45) for selected nav and important elements
        indigo: {
          50: '#F4F3F8',
          100: '#E7E5EF',
          200: '#C7C2DD',
          300: '#9E97C4',
          400: '#685FA2',
          500: '#42387B',
          600: '#322A63',
          700: '#282151',
          800: '#211B45', // Primary Deep Indigo
          900: '#171233',
          950: '#0E0B20',
        },

        // Violet (#7655F7) for primary actions and branding
        violet: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A18BFF', // Secondary Violet
          500: '#8B5CF6',
          600: '#7655F7', // Primary Violet
          700: '#6039EB',
          800: '#4C24D4',
          900: '#3C1CB0',
        },

        // Teal (#18B89A) for positive status, success and completion indicators
        teal: {
          50: '#F0FDF9',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#18B89A', // Teal Accent
          600: '#139C82',
          700: '#0F7C68',
          800: '#0C6051',
          900: '#094B3F',
        },

        // Navy mappings for compatibility with primary text (#17182B) and deep indigo (#211B45)
        navy: {
          900: '#17182B', // Primary Text
          800: '#211B45', // Deep Indigo
          700: '#2D3250',
          600: '#484F68',
          500: '#727A91', // Secondary Text
          400: '#9BA3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#E7E9F2', // Borders
          50: '#F5F6FC',  // Page Background
        },

        lavender: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A18BFF',
          500: '#7655F7',
          600: '#6039EB',
          700: '#4C24D4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(23, 24, 43, 0.04), 0 1px 2px -1px rgba(23, 24, 43, 0.02)',
        'card-hover': '0 8px 20px -4px rgba(33, 27, 69, 0.08), 0 2px 6px -1px rgba(33, 27, 69, 0.04)',
        'dropdown': '0 12px 28px -4px rgba(33, 27, 69, 0.12), 0 4px 10px -2px rgba(33, 27, 69, 0.05)',
        'modal': '0 24px 48px -12px rgba(33, 27, 69, 0.18), 0 8px 16px -4px rgba(33, 27, 69, 0.08)',
        'glow-violet': '0 0 20px -3px rgba(118, 85, 247, 0.25)',
      },
    },
  },
  plugins: [],
}
