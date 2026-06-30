/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      /* ── Typography System ───────────────────────── */
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Inter', 'system-ui', 'sans-serif'], // fallback to inter for mono to enforce 2 fonts rule
        headline: ['Playfair Display', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        label: ['Inter', 'system-ui', 'sans-serif'],
      },

      /* ── Radius System ───────────────────────── */
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        xxl: '24px',
        full: '9999px',
        hero: '24px',
      },

      /* ── Color System (Saga Gold Dark Theme) ─────────── */
      colors: {
        background: '#121212',
        foreground: '#FFFFFF',
        
        surface: '#1A1A1A',
        card: '#202020',
        divider: 'rgba(255,255,255,0.08)',

        primary: {
          DEFAULT: '#0E0E0E',
          foreground: '#FFFFFF',
        },

        secondary: {
          DEFAULT: '#1A1A1A',
          foreground: '#B5B5B5',
        },

        accent: {
          DEFAULT: '#F2CA50',
          hover: '#FFD86A',
        },

        success: '#34C759',
        error: '#FF453A',
        warning: '#FFCC00',

        border: 'rgba(255,255,255,0.08)',
        input: '#202020',
        ring: '#F2CA50',

        gold: {
          DEFAULT: '#F2CA50',
          hover: '#FFD86A',
        }
      },

      boxShadow: {
        small: '0 4px 12px rgba(0,0,0,0.08)',
        medium: '0 8px 24px rgba(0,0,0,0.12)',
        large: '0 16px 40px rgba(0,0,0,0.16)',
        elegant: '0 16px 40px rgba(0,0,0,0.16)',
        gold: '0 0 40px rgba(242,202,80,0.15)',
        focus: '0 0 0 4px #f2ca50',
      },
    },
  },

  plugins: [require("tailwindcss-animate")],
}; 