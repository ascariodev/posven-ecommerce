import { beforeEach, describe, expect, it, vi } from "vitest";

const SESSION_ID = "3f2b8c1e-6d4a-4f7b-9a0c-2e5d8b1f6a93";
const BROWSER_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36";

const { sendEvent } = vi.hoisted(() => ({ sendEvent: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: SESSION_ID }), set: vi.fn() }),
  headers: vi.fn(),
}));
vi.mock("next/server", () => ({ after: (task: () => unknown) => task() }));
vi.mock("@/lib/marketplace/client", () => ({ sendEvent }));

import { POST } from "@/app/api/events/route";

let counter = 0;

async function post(forwardedFor: string | null): Promise<Response> {
  counter += 1;
  const headers = new Headers({ "user-agent": BROWSER_UA });
  if (forwardedFor !== null) headers.set("x-forwarded-for", forwardedFor);
  const body = JSON.stringify({ type: "product_view", store_slug: null, product_slug: `producto-${counter}` });
  return POST(new Request("http://localhost/api/events", { method: "POST", headers, body }));
}

describe("POST /api/events", () => {
  beforeEach(() => {
    sendEvent.mockReset();
    sendEvent.mockResolvedValue(undefined);
  });

  it("pasa a sendEvent el último valor de x-forwarded-for como clientIp", async () => {
    expect((await post("203.0.113.9, 10.0.0.1, 198.51.100.7")).status).toBe(202);
    expect(sendEvent).toHaveBeenCalledTimes(1);
    expect(sendEvent.mock.calls[0]?.[1]).toBe("198.51.100.7");
  });

  it("pasa null sin cabecera x-forwarded-for", async () => {
    await post(null);
    expect(sendEvent.mock.calls[0]?.[1]).toBeNull();
  });

  it("pasa null si el último valor no es una IP válida", async () => {
    await post("203.0.113.9, no-es-una-ip");
    expect(sendEvent.mock.calls[0]?.[1]).toBeNull();
  });
});
