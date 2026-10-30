import { describe, expect, it } from "vitest";
import { createRateLimiter, rateLimitedResponse, RATE_LIMIT_WINDOW_MS } from "@/lib/rate-limit";

const T0 = 1_780_000_000_000;

describe("createRateLimiter", () => {
  it("deja pasar hasta el límite y rechaza el siguiente con los segundos que faltan", () => {
    const check = createRateLimiter(2);
    expect(check("a", T0)).toEqual({ allowed: true });
    expect(check("a", T0 + 1_000)).toEqual({ allowed: true });
    expect(check("a", T0 + 10_500)).toEqual({ allowed: false, retryAfterSeconds: 50 });
  });

  it("cuenta cada clave por separado y abre una ventana nueva al vencer", () => {
    const check = createRateLimiter(1);
    expect(check("a", T0).allowed).toBe(true);
    expect(check("b", T0).allowed).toBe(true);
    expect(check("a", T0 + 1).allowed).toBe(false);
    expect(check("a", T0 + RATE_LIMIT_WINDOW_MS).allowed).toBe(true);
  });

  it("con más de 10 000 claves descarta las más viejas", () => {
    const check = createRateLimiter(1);
    check("vieja", T0);
    for (let i = 0; i < 10_000; i += 1) check(`k${i}`, T0 + 1);
    expect(check("vieja", T0 + 2).allowed).toBe(true);
  });
});

describe("rateLimitedResponse", () => {
  it("responde 429 con Retry-After", () => {
    const response = rateLimitedResponse(42);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
  });
});
