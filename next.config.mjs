/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.2.42"],
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
