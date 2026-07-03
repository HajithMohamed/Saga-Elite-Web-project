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

      /* ── Color System (theme-aware tokens) ───────────
         Every value is driven by the CSS variables declared in index.css.
         Dark (default) reproduces the original Saga Gold palette exactly;
         `html.light` swaps the variables for the light theme. */
      colors: {
        background: 'rgb(var(--th-page) / <alpha-value>)',
        foreground: 'rgb(var(--th-ink) / <alpha-value>)',

        /* Surfaces (dark → light): page #0a0a0a→ivory, panel #131313→#fcfaf5,
           card #1a1a1a→white, elevated #2a2a2a→#ede7d9 */
        page: 'rgb(var(--th-page) / <alpha-value>)',
        panel: 'rgb(var(--th-panel) / <alpha-value>)',
        surface: 'rgb(var(--th-card) / <alpha-value>)',
        card: 'rgb(var(--th-card) / <alpha-value>)',
        elevated: 'rgb(var(--th-elevated) / <alpha-value>)',
        divider: 'var(--th-divider)',

        /* Foregrounds */
        ink: {
          DEFAULT: 'rgb(var(--th-ink) / <alpha-value>)',
          2: 'rgb(var(--th-ink2) / <alpha-value>)',
        },
        cream: 'rgb(var(--th-cream) / <alpha-value>)',
        muted: 'rgb(var(--th-muted) / <alpha-value>)',
        line: 'rgb(var(--th-line) / <alpha-value>)',

        primary: {
          DEFAULT: 'rgb(var(--th-page) / <alpha-value>)',
          foreground: 'rgb(var(--th-ink) / <alpha-value>)',
        },

        secondary: {
          DEFAULT: 'rgb(var(--th-card) / <alpha-value>)',
          foreground: 'rgb(var(--th-muted) / <alpha-value>)',
        },

        accent: {
          DEFAULT: '#F2CA50',
          hover: '#FFD86A',
        },

        /* Gold: fills stay brand-gold in both themes; `ink` variants are
           gold used AS TEXT/borders — darkened in light mode for contrast */
        gold: {
          DEFAULT: '#F2CA50',
          deep: '#D4AF37',
          hover: '#FFD86A',
          ink: 'rgb(var(--th-gold-ink) / <alpha-value>)',
          ink2: 'rgb(var(--th-gold-ink2) / <alpha-value>)',
        },
        /* Constant darks used on top of gold fills */
        ongold: '#171204',
        goldshadow: '#574500',
        ivory: '#FAF7F2',

        /* Status */
        danger: {
          DEFAULT: 'rgb(var(--th-danger) / <alpha-value>)',
          ink: 'rgb(var(--th-danger-ink) / <alpha-value>)',
          deep: '#93000A',
        },
        success: {
          DEFAULT: 'rgb(var(--th-success) / <alpha-value>)',
          ink: 'rgb(var(--th-success-ink) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--th-info) / <alpha-value>)',
          ink: 'rgb(var(--th-info-ink) / <alpha-value>)',
        },
        warning: 'rgb(var(--th-warning) / <alpha-value>)',
        urgent: 'rgb(var(--th-urgent) / <alpha-value>)',
        vip: 'rgb(var(--th-vip) / <alpha-value>)',
        error: 'rgb(var(--th-danger) / <alpha-value>)',

        border: 'var(--th-divider)',
        input: 'rgb(var(--th-card) / <alpha-value>)',
        ring: '#F2CA50',
      },

      boxShadow: {
        small: 'var(--se-shadow-small)',
        medium: 'var(--se-shadow-medium)',
        large: 'var(--se-shadow-large)',
        elegant: 'var(--se-shadow-elegant)',
        gold: 'var(--se-shadow-gold)',
        focus: '0 0 0 4px #f2ca50',
      },
    },
  },

  plugins: [require("tailwindcss-animate")],
};
