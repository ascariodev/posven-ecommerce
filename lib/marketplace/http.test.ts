import { z } from "zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarketplaceUnavailableError } from "./errors";
import { postJson, requestJson, requestJsonOrNull } from "./http";

const schema = z.object({ data: z.array(z.string()) });
const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("se esperaba un rechazo");
}

beforeEach(() => {
  vi.stubEnv("MARKETPLACE_API_URL", "https://api.test/api/marketplace/v1");
  vi.stubEnv("MARKETPLACE_API_KEY", "clave-de-prueba");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

describe("requestJson", () => {
  it("envía Bearer y la consulta, y corta a los 5 s (RN-MARKETPLACE-02)", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    fetchMock.mockResolvedValue(jsonResponse({ data: ["a"] }));

    const result = await requestJson(
      "/search",
      new URLSearchParams({ q: "arroz", page: "1" }),
      schema,
    );

    expect(result).toEqual({ data: ["a"] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/marketplace/v1/search?q=arroz&page=1");
    expect(init?.headers).toEqual({
      Authorization: "Bearer clave-de-prueba",
      Accept: "application/json",
    });
    expect(timeoutSpy).toHaveBeenCalledWith(5000);
    expect(init?.signal).toBe(timeoutSpy.mock.results[0].value);
  });

  it("un estado 500 lanza MarketplaceUnavailableError con su endpoint", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "error" }, 500));

    const error = await captureError(requestJson("/stores", new URLSearchParams(), schema));

    expect(error).toBeInstanceOf(MarketplaceUnavailableError);
    expect((error as MarketplaceUnavailableError).endpoint).toBe("/stores");
  });

  it("el tiempo agotado lanza MarketplaceUnavailableError con su endpoint (RN-MARKETPLACE-02)", async () => {
    fetchMock.mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"));

    const error = await captureError(requestJson("/categories", new URLSearchParams(), schema));

    expect(error).toBeInstanceOf(MarketplaceUnavailableError);
    expect((error as MarketplaceUnavailableError).endpoint).toBe("/categories");
  });

  it("un cuerpo que no pasa el esquema se registra y se trata como API caída (RN-MARKETPLACE-01)", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(jsonResponse({ data: [1, 2] }));

    const error = await captureError(requestJson("/locations", new URLSearchParams(), schema));

    expect(error).toBeInstanceOf(MarketplaceUnavailableError);
    expect((error as MarketplaceUnavailableError).endpoint).toBe("/locations");
    expect(consoleError).toHaveBeenCalledWith("[marketplace]", "/locations", expect.any(Array));
  });

  it("sin variables de entorno lanza el error de configuración", async () => {
    vi.stubEnv("MARKETPLACE_API_URL", undefined);
    vi.stubEnv("MARKETPLACE_API_KEY", undefined);

    await expect(requestJson("/search", new URLSearchParams(), schema)).rejects.toThrow(
      "MARKETPLACE_API_URL y MARKETPLACE_API_KEY son obligatorias con MARKETPLACE_MODE=api",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("requestJsonOrNull", () => {
  it("un 404 devuelve null (RN-MARKETPLACE-04)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "no existe" }, 404));

    await expect(requestJsonOrNull("/products/x", new URLSearchParams(), schema)).resolves.toBeNull();
  });

  it("un estado 500 lanza MarketplaceUnavailableError (RN-MARKETPLACE-04)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "error" }, 500));

    const error = await captureError(requestJsonOrNull("/products/x", new URLSearchParams(), schema));

    expect(error).toBeInstanceOf(MarketplaceUnavailableError);
    expect((error as MarketplaceUnavailableError).endpoint).toBe("/products/x");
  });
});

describe("postJson", () => {
  it("manda POST con el cuerpo JSON y Bearer", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }));
    const event = { type: "store_view", store_slug: "abasto-la-esquina", product_slug: null };

    await postJson("/events", event);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/marketplace/v1/events");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify(event));
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer clave-de-prueba",
      "Content-Type": "application/json",
    });
  });

  it("un estado 500 lanza MarketplaceUnavailableError", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "error" }, 500));

    const error = await captureError(postJson("/events", {}));

    expect(error).toBeInstanceOf(MarketplaceUnavailableError);
    expect((error as MarketplaceUnavailableError).endpoint).toBe("/events");
  });
});
