import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
// import daisyui from 'daisyui';
// import bgPatterns from 'tailwindcss-bg-patterns';

const config: Config = {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
    	extend: {
    		colors: {
    			primaryPurple: '#501357',
    			primaryGreen: '#135745',
    			secondaryGreen: '#9ad6c7',
    			secondaryPurple: '#a45fac',
    			purpleShade01: '#501357',
    			purpleShade02: '#793b7f',
    			purpleShade03: '#a563aa',
    			purpleShade04: '#d28dd6',
    			purpleShade05: '#ffb9ff',
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
    			}
    		},
    		fontFamily: {
    			raleway: [
    				'var(--font-raleway)'
    			],
    			playfair: [
    				'var(--font-playfair)'
    			],
    			nunito: [
    				'var(--font-nunito)'
    			],
    			cinzel: [
    				'var(--font-cinzel)'
    			]
    		},
    		fontWeight: {
    			extralight: '200',
    			light: '300',
    			regular: '400',
    			medium: '500',
    			bold: '700',
    			black: '900'
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		}
    	},
    	patterns: {
    		opacities: {
    			'5': '.05',
    			'10': '.10',
    			'20': '.20',
    			'40': '.40',
    			'60': '.60',
    			'80': '.80',
    			'100': '1'
    		},
    		sizes: {
    			'1': '0.25rem',
    			'2': '0.5rem',
    			'4': '1rem',
    			'6': '1.5rem',
    			'8': '2rem',
    			'16': '4rem',
    			'20': '5rem',
    			'24': '6rem',
    			'32': '8rem'
    		}
    	}
    },
    plugins: [animate],
};
export default config;
