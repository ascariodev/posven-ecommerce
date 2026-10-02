import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIpFrom, readSession, sessionCookieOptions } from "@/features/account/server/session";

const cookieStore = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
  headers: async () => new Headers(),
}));

vi.mock("@/lib/marketplace/client", () => ({ getMe: vi.fn() }));

afterEach(() => {
  cookieStore.get.mockReset();
  vi.unstubAllEnvs();
});

describe("clientIpFrom (RN-ACCOUNT-04)", () => {
  it("toma el último valor de x-forwarded-for", () => {
    expect(clientIpFrom("1.1.1.1, 10.0.0.2")).toBe("10.0.0.2");
  });

  it("acepta una IPv6", () => {
    expect(clientIpFrom("::1")).toBe("::1");
  });

  it("devuelve null ante un valor que no es IP o sin encabezado", () => {
    expect(clientIpFrom("basura")).toBeNull();
    expect(clientIpFrom(null)).toBeNull();
  });
});

describe("readSession (RN-ACCOUNT-01)", () => {
  it("devuelve un token con la forma de Sanctum", async () => {
    cookieStore.get.mockReturnValue({ name: "mp_session", value: "12|abc" });
    await expect(readSession()).resolves.toBe("12|abc");
  });

  it("trata un valor sin la forma del token como sin sesión", async () => {
    cookieStore.get.mockReturnValue({ name: "mp_session", value: "abc" });
    await expect(readSession()).resolves.toBeNull();
  });

  it("trata un valor de 513 caracteres como sin sesión", async () => {
    cookieStore.get.mockReturnValue({ name: "mp_session", value: `1|${"a".repeat(511)}` });
    await expect(readSession()).resolves.toBeNull();
  });
});

describe("sessionCookieOptions (RN-ACCOUNT-01)", () => {
  it("en producción trae secure y las demás opciones exactas", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(sessionCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 2592000,
    });
  });
});
