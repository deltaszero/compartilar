import withPWA from 'next-pwa'

const pwaConfig = withPWA({
    dest: 'public',
    // register: true,
    // skipWaiting: true,
})

export default {
    ...pwaConfig,
    experimental: {
        typedRoutes: true,
    }
};