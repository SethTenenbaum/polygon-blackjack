/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  // Turbopack config to silence workspace root warning
  turbopack: {
    root: '.', // Use current directory as root
  },
};

export default nextConfig;
