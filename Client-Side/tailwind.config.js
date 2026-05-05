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
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
        headline: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        label: ['DM Sans', 'system-ui', 'sans-serif'],
      },

      /* ── Radius System ───────────────────────── */
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
        full: '9999px',
      },

      /* ── Color System (Luxury Theme) ─────────── */
      colors: {
        background: '#FAF7F2',
        foreground: '#2C2C2A',

        surface: '#F0EBE3',

        primary: {
          DEFAULT: '#6B1A2A',
          hover: '#8C2D40',
          foreground: '#FAF7F2',
        },

        accent: {
          DEFAULT: '#C9A96E',
          foreground: '#2C2C2A',
        },

        secondary: {
          DEFAULT: '#E8D5C4',
          foreground: '#2C2C2A',
        },

        muted: {
          DEFAULT: '#888780',
          foreground: '#FAF7F2',
        },

        border: '#E8D5C4',
        input: '#E8D5C4',
        ring: '#C9A96E',

        card: {
          DEFAULT: '#F0EBE3',
          foreground: '#2C2C2A',
        },

        popover: {
          DEFAULT: '#F0EBE3',
          foreground: '#2C2C2A',
        },

        destructive: {
          DEFAULT: '#D4736A',
          foreground: '#FAF7F2',
        },

        /* ── Status Colors ───────────────── */
        sale: '#D4736A',
        new: '#1D9E75',
        deal: '#BA7517',
      },
    },
  },

  plugins: [require("tailwindcss-animate")],
}; 