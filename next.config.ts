import type { NextConfig } from "next";
import { assertProductionEnv } from "./lib/env";

assertProductionEnv(process.env);

const isDev = process.env.NODE_ENV === "development";

export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
