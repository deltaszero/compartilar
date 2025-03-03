import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['firebasestorage.googleapis.com'],
    },
    reactStrictMode: true,      // Enable React strict mode for improved error handling
    swcMinify: true,            // Enable SWC minification for improved performance
    compiler: {
        removeConsole: process.env.NODE_ENV !== "development"     // Remove console.log in production
    },
    // rules to handle svg imports
    webpack(config) {
        // get the existing rule that handles svg imports
        const fileLoaderRule = config.module.rules.find((rule) =>
            rule.test?.test?.('.svg'),
        )
        config.module.rules.push(
            // reapply the existing rule, but only for svg imports ending in ?url
            {
                ...fileLoaderRule,
                test: /\.svg$/i,
                resourceQuery: /url/, // *.svg?url
            },
            // convert all other *.svg imports to react components
            {
                test: /\.svg$/i,
                issuer: /\.[jt]sx?$/,
                resourceQuery: { not: /url/ }, // exclude if *.svg?url
                use: ['@svgr/webpack'],
            },
        )
        // modify the file loader rule to ignore *.svg, since we have it handled now.
        fileLoaderRule.exclude = /\.svg$/i
        return config
    },
};

// export default nextConfig;

export default withPWA({
    dest: "public",         // destination directory for the PWA files
    disable: process.env.NODE_ENV === "development",        // disable PWA in the development environment
    register: true,         // register the PWA service worker
    skipWaiting: true,      // skip waiting for service worker activation
})(nextConfig);