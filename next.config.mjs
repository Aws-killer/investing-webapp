// next.config.mjs
import withPWA from 'next-pwa';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mbonea-investingtest.hf.space';

const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*", // local path
        destination: `${apiBaseUrl}/:path*`, // backend API
      },
    ];
  },
};
export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/app-build-manifest\.json$/, /dynamic-css-manifest\.json$/],
})(nextConfig);
