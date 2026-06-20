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
        display: ['Cinzel', 'Playfair Display', 'serif'],
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        headline: ['Playfair Display', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        label: ['Inter', 'system-ui', 'sans-serif'],
      },

      /* ── Radius System ───────────────────────── */
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
        full: '9999px',
      },

      /* ── Color System (Saga Gold Dark Theme) ─────────── */
      colors: {
        background: '#0e0e0e',
        foreground: '#e5e2e1',

        surface: '#131313',
        'surface-1': '#1f1f1f',
        'surface-2': '#2a2a2a',
        'surface-3': '#393939',

        'admin-shell': '#050505',
        'admin-card': '#0b0b0b',

        primary: {
          DEFAULT: '#f2ca50',
          hover: '#d4af37',
          foreground: '#0e0e0e',
          container: '#d4af37',
        },

        accent: {
          DEFAULT: '#d4af37',
          foreground: '#0e0e0e',
        },

        secondary: {
          DEFAULT: '#1f1f1f',
          foreground: '#e5e2e1',
        },

        muted: {
          DEFAULT: '#d0c5af',
          foreground: '#131313',
        },

        border: '#4d4635',
        input: '#4d4635',
        ring: '#f2ca50',

        card: {
          DEFAULT: '#131313',
          foreground: '#e5e2e1',
        },

        popover: {
          DEFAULT: '#131313',
          foreground: '#e5e2e1',
        },

        destructive: {
          DEFAULT: '#ffb4ab',
          foreground: '#0e0e0e',
        },

        /* ── Status Colors ───────────────── */
        sale: '#ffb4ab',
        new: '#1D9E75',
        deal: '#f2ca50',
      },
    },
  },

  plugins: [require("tailwindcss-animate")],
}; 