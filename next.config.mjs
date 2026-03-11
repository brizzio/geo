/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["jsx", "tsx", "ts", "mdx"],
  webpack: (config) => {
    // Avoid unstable local cache issues on this machine (ENOENT/ENOSPC in .next/cache).
    config.cache = false;
    return config;
  }
};

export default nextConfig;
