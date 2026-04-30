// next.config.mjs
import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*", // local path
        destination:"http://127.0.0.1:8000/:path*", // remote API
      },
    ];
  },
};
export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);