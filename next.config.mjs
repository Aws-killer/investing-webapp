/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*", // local path
        destination:"https://yakova-xyhlf.hf.space/:path*", // remote API
      },
    ];
  },
};

export default nextConfig;
