import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0', opacity: '0' },
  				to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
  				to: { height: '0', opacity: '0' }
  			},
  			'fade-in':  { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
  			'fade-out': { '0%': { opacity: '1', transform: 'translateY(0)' }, '100%': { opacity: '0', transform: 'translateY(10px)' } },
  			'fade-up':  { '0%': { opacity: '0', transform: 'translateY(28px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
  			'scale-in': { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
  			'slide-in-right': { '0%': { transform: 'translateX(40px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
  			'shimmer':  { '100%': { transform: 'translateX(100%)' } },
  			'spin-slow':{ to: { transform: 'rotate(360deg)' } }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up':   'accordion-up 0.2s ease-out',
  			'fade-in':        'fade-in 0.4s cubic-bezier(0.22,1,0.36,1)',
  			'fade-out':       'fade-out 0.3s ease-out',
  			'fade-up':        'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
  			'scale-in':       'scale-in 0.4s cubic-bezier(0.22,1,0.36,1) both',
  			'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.22,1,0.36,1) both',
  			'shimmer':        'shimmer 2s linear infinite',
  			'spin-slow':      'spin-slow 12s linear infinite',
  			'enter':          'fade-in 0.3s ease-out, scale-in 0.2s ease-out'
  		},
  		fontFamily: {
  			sans: ['Inter','ui-sans-serif','system-ui','-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','Helvetica Neue','Arial','Noto Sans','sans-serif'],
  			display: ['Fraunces','ui-serif','Georgia','Times New Roman','serif'],
  			serif: ['Fraunces','ui-serif','Georgia','Cambria','Times New Roman','Times','serif'],
  			mono:  ['JetBrains Mono','ui-monospace','SFMono-Regular','Menlo','Monaco','Consolas','Liberation Mono','Courier New','monospace']
  		},
  		backgroundImage: {
  			'gradient-hero':  'var(--gradient-hero)',
  			'gradient-amber': 'var(--gradient-amber)',
  			'gradient-steel': 'var(--gradient-steel)',
  			'gradient-glass': 'var(--gradient-glass)'
  		},
  		boxShadow: {
  			'2xs':     'var(--shadow-2xs)',
  			xs:        'var(--shadow-xs)',
  			sm:        'var(--shadow-sm)',
  			md:        'var(--shadow-md)',
  			lg:        'var(--shadow-lg)',
  			xl:        'var(--shadow-xl)',
  			'2xl':     'var(--shadow-2xl)',
  			elegant:   'var(--shadow-elegant)',
  			glow:      'var(--shadow-glow)',
  			card:      'var(--shadow-card)'
  		},
  		transitionTimingFunction: {
  			'premium': 'cubic-bezier(0.22, 1, 0.36, 1)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
