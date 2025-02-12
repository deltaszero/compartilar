import type { Config } from "tailwindcss";
import daisyui from 'daisyui';
import bgPatterns from 'tailwindcss-bg-patterns';

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
                nunito: ['var(--font-nunito)'],
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
        patterns: {
            opacities: {
                100: "1",
                80: ".80",
                60: ".60",
                40: ".40",
                20: ".20",
                10: ".10",
                5: ".05",
            },
            sizes: {
                1: "0.25rem",
                2: "0.5rem",
                4: "1rem",
                6: "1.5rem",
                8: "2rem",
                16: "4rem",
                20: "5rem",
                24: "6rem",
                32: "8rem",
            }
        }
    },
    // plugins: [require("@tailwindcss/typography"), require("daisyui")],
    plugins: [daisyui, bgPatterns],
    daisyui: {
        themes: ["lemonade",],
    },
};
export default config;
