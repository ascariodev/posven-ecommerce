import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/comercios", destination: "/vende", permanent: true }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.posven.io" },
      ...(isDev ? [{ protocol: "http" as const, hostname: "localhost", port: "8000" }] : []),
    ],
    dangerouslyAllowLocalIP: isDev,
  },
};

export default nextConfig;
