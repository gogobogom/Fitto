/** @type {import('next').NextConfig} */
const isMobileBuild = process.env.MOBILE_BUILD === 'true';

const nextConfig = {
    // For Capacitor (iOS/Android) we ship a static export that Capacitor
    // bundles from the `out/` directory. Set MOBILE_BUILD=true to enable.
    ...(isMobileBuild && {
        output: 'export',
        // Disable Image Optimization for static export.
        // Compatible with `<Image fill>` and remote images.
        trailingSlash: true,
    }),
    images: {
        // Required for static export; safe for web/server builds too.
        unoptimized: isMobileBuild,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'ohara-assets.s3.us-east-2.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: 'usdozf7pplhxfvrl.public.blob.vercel-storage.com',
            },
        ],
    },
    typescript: {
        // Strict mode: surface type errors at build time instead of masking them.
        // Flip back to `true` only as a temporary escape hatch.
        ignoreBuildErrors: false,
    },
};

export default nextConfig;
