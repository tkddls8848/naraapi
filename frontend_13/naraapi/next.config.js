/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        FRONT_URL: process.env.NEXT_PUBLIC_FRONT_URL,
        BACK_URL: process.env.NEXT_PUBLIC_BACK_URL,
    },
}

module.exports = nextConfig