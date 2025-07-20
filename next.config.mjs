/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*", // local path
        destination:
          "https://8000-firebase-worker-1753014594177.cluster-c3a7z3wnwzapkx3rfr5kz62dac.cloudworkstations.dev/:path*", // remote API
      },
    ];
  },
};

export default nextConfig;
