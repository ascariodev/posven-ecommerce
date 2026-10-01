import { afterEach, describe, expect, it, vi } from "vitest";
import { cartEnabled } from "@/features/cart/lib/flag";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cartEnabled (RN-CART-04)", () => {
  it("sin MARKETPLACE_MODE (simulado) está encendido", () => {
    vi.stubEnv("MARKETPLACE_MODE", undefined);
    vi.stubEnv("MARKETPLACE_CART_ENABLED", undefined);
    expect(cartEnabled()).toBe(true);
  });

  it("en modo mock está encendido", () => {
    vi.stubEnv("MARKETPLACE_MODE", "mock");
    expect(cartEnabled()).toBe(true);
  });

  it("en modo api está apagado sin MARKETPLACE_CART_ENABLED", () => {
    vi.stubEnv("MARKETPLACE_MODE", "api");
    vi.stubEnv("MARKETPLACE_CART_ENABLED", undefined);
    expect(cartEnabled()).toBe(false);
  });

  it("en modo api se enciende con MARKETPLACE_CART_ENABLED=1", () => {
    vi.stubEnv("MARKETPLACE_MODE", "api");
    vi.stubEnv("MARKETPLACE_CART_ENABLED", "1");
    expect(cartEnabled()).toBe(true);
  });
});
