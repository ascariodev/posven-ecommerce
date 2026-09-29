import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "media.posven.io" }],
  },
};

export default nextConfig;
