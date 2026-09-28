import { describe, expect, it } from "vitest";
import { createDeduper, EVENT_DEDUP_WINDOW_MS, handleEvent } from "./handle";

const SESSION_ID = "3f2b8c1e-6d4a-4f7b-9a0c-2e5d8b1f6a93";
const BROWSER_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36";
const PRODUCT_VIEW = JSON.stringify({ type: "product_view", store_slug: null, product_slug: "acetaminofen-500mg" });
const T0 = 1_780_000_000_000;

function handle(body: string, userAgent: string | null, shouldForward = createDeduper(), now = T0) {
  return handleEvent({ body, userAgent, sessionId: SESSION_ID, now, shouldForward });
}

describe("handleEvent", () => {
  it("un cuerpo inválido responde 400 sin reenvío", () => {
    expect(handle("no es json", BROWSER_UA)).toEqual({ status: 400, forward: null });
    expect(handle(JSON.stringify({ type: "product_view", store_slug: "farmacia", product_slug: null }), BROWSER_UA)).toEqual({
      status: 400,
      forward: null,
    });
  });

  it("un product_view válido responde 202 y se reenvía con session_id", () => {
    expect(handle(PRODUCT_VIEW, BROWSER_UA)).toEqual({
      status: 202,
      forward: { type: "product_view", store_slug: null, product_slug: "acetaminofen-500mg", session_id: SESSION_ID },
    });
  });

  it("un bot (Googlebot) y un user-agent nulo responden 202 sin reenvío", () => {
    const googlebot = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
    expect(handle(PRODUCT_VIEW, googlebot)).toEqual({ status: 202, forward: null });
    expect(handle(PRODUCT_VIEW, null)).toEqual({ status: 202, forward: null });
  });

  it("el mismo evento dentro de 10 minutos no se reenvía y pasados 10 minutos sí", () => {
    const shouldForward = createDeduper();
    expect(handle(PRODUCT_VIEW, BROWSER_UA, shouldForward, T0).forward).not.toBeNull();
    expect(handle(PRODUCT_VIEW, BROWSER_UA, shouldForward, T0 + EVENT_DEDUP_WINDOW_MS / 2)).toEqual({
      status: 202,
      forward: null,
    });
    expect(handle(PRODUCT_VIEW, BROWSER_UA, shouldForward, T0 + EVENT_DEDUP_WINDOW_MS).forward).not.toBeNull();
  });
});
