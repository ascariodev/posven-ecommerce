import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

describe("headers()", () => {
  it("aplica las cabeceras de seguridad a todas las rutas", async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/:path*");
    expect(Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value]))).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "geolocation=(self), camera=(), microphone=()",
    });
  });

  it("no fija CSP ni HSTS", async () => {
    const keys = (await nextConfig.headers!()).flatMap((r) => r.headers.map((h) => h.key.toLowerCase()));
    expect(keys).not.toContain("content-security-policy");
    expect(keys).not.toContain("strict-transport-security");
  });
});
