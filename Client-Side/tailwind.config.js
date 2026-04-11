/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
fontFamily: {
		serif: ['Playfair Display', 'serif'],
		sans: ['Inter', 'sans-serif'],
	},
borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
			"on-surface-variant": "#d0c5af",
			"on-secondary-container": "#352800",
			"surface-container-high": "#2a2a2a",
			"on-tertiary-fixed": "#00174b",
			"surface": "#131313",
			"on-tertiary-fixed-variant": "#27438a",
			"on-background": "#e2e2e2",
			"primary-fixed": "#ffe088",
			"on-surface": "#e2e2e2",
			"error-container": "#93000a",
			"on-secondary-fixed": "#241a00",
			"inverse-surface": "#e2e2e2",
			"tertiary": "#bfcdff",
			"surface-container-lowest": "#0e0e0e",
			"tertiary-container": "#97b0ff",
			"surface-variant": "#353535",
			"on-primary-fixed-variant": "#574500",
			"outline-variant": "#4d4635",
			"tertiary-fixed": "#dbe1ff",
			"surface-dim": "#131313",
			"surface-container-low": "#1b1b1b",
			"secondary-fixed-dim": "#eac249",
			"on-primary-container": "#554300",
			"inverse-on-surface": "#303030",
			"secondary-fixed": "#ffe08b",
			"on-secondary-fixed-variant": "#584400",
			"surface-container": "#1f1f1f",
			"saga-primary": "#f2ca50",
			"on-tertiary-container": "#254188",
			"surface-tint": "#e9c349",
			"on-tertiary": "#082b72",
			"secondary-container": "#b08c10",
			"on-secondary": "#3d2f00",
			"on-primary-fixed": "#241a00",
			"surface-container-highest": "#353535",
			"surface-bright": "#393939",
			"primary-container": "#d4af37",
			"on-error-container": "#ffdad6",
			"on-error": "#690005",
			"tertiary-fixed-dim": "#b4c5ff",
			"saga-error": "#ffb4ab"
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}


