import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // background: "var(--background)",
                // foreground: "var(--foreground)",
                primaryPurple: '#501357',
                primaryGreen: '#135745',
                secondaryGreen: '#9ad6c7',
                secondaryPurple: '#a45fac',
            },
            fontFamily: {
                raleway: ['var(--font-raleway)'],
                playfair: ['var(--font-playfair)'],
                cinzel: ["Cinzel Decorative", "serif"],
            },
            fontWeight: {
                extralight: '200',
                light: '300',
                regular: '400',
                medium: '500',
                bold: '700',
                black: '900',
            },
        },
    },
    // plugins: [require("@tailwindcss/typography"), require("daisyui")],
    plugins: [require("daisyui")],
    daisyui: {
        themes: ["garden",],
    },
};
export default config;
