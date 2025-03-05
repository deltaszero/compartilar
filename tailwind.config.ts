import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
			  main: 'var(--main)',
			  overlay: 'var(--overlay)',
			  bg: 'var(--bg)',
			  bw: 'var(--bw)',
			  blank: 'var(--blank)',
			  text: 'var(--text)',
			  mtext: 'var(--mtext)',
			  border: 'var(--border)',
			  ring: 'var(--ring)',
			  ringOffset: 'var(--ring-offset)',
			  
			  secondaryBlack: '#212121', 
			  secondaryMain: "#A3E636",
			  
			  mainStrongBlue: "#88aaee",
			  mainWeakBlue: "#dfe5f2",
			  mainStrongOrange : "#FD9745",
			  mainWeakOrange : "#fff4e0",
			  mainStrongYellow : "#FFDC58",
			  mainWeakYellow : "#FEF2E8",
			  mainStrongRed : "#ff6b6b",
			  mainWeakRed : "#fcd7d7",
			  mainStrongGreen : "#A3E636",
			  mainWeakGreen : "#E0E7F1",
			},
			borderRadius: {
			  base: '5px'
			},
			boxShadow: {
			  shadow: 'var(--shadow)',
			  'brutalist': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
			  'brutalist-sm': '2px 2px 0px 0px rgba(0, 0, 0, 1)'
			},
			translate: {
			  boxShadowX: '4px',
			  boxShadowY: '4px',
			  reverseBoxShadowX: '-4px',
			  reverseBoxShadowY: '-4px',
			},
			fontWeight: {
			  base: '500',
			  heading: '700',
			},
		  },
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
