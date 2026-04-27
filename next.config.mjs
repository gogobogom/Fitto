/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
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
