// next.config.mjs
import withPWA from 'next-pwa';

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
export default withPWA({
  dest: 'public'
})(nextConfig);