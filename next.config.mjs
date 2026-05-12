/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // Strict mode: surface type errors at build time instead of masking them.
        // Flip back to `true` only as a temporary escape hatch.
        ignoreBuildErrors: false,
    },
    images: {
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
};

export default nextConfig;
