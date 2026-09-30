import { z } from "zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "./errors";
import { accountCommand, accountRequest, postJson, requestJson, requestJsonOrNull } from "./http";

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

const anonymous = { session: null, clientIp: null };

describe("accountRequest", () => {
  it("con sesión e IP manda los encabezados de cuenta y el cuerpo JSON (RN-MARKETPLACE-07)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: ["a"] }));
    const body = { name: "Ana" };

    const result = await accountRequest(
      { method: "PATCH", path: "/me", ctx: { session: "7|abc", clientIp: "190.2.3.4" }, body },
      schema,
    );

    expect(result).toEqual({ data: ["a"] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/marketplace/v1/me");
    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBe(JSON.stringify(body));
    expect(init?.headers).toEqual({
      Authorization: "Bearer clave-de-prueba",
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Marketplace-Customer": "7|abc",
      "X-Client-IP": "190.2.3.4",
    });
  });

  it("sin sesión ni IP no manda los encabezados de cuenta (RN-MARKETPLACE-07)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }));

    await accountRequest({ method: "GET", path: "/me", ctx: anonymous }, schema);

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.headers).toEqual({
      Authorization: "Bearer clave-de-prueba",
      Accept: "application/json",
    });
    expect(init?.body).toBeUndefined();
  });

  it("un 422 con fields lanza MarketplaceAccountError con code, message y fields (RN-MARKETPLACE-05)", async () => {
    const fields = { email: "El correo ya está registrado." };
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: "validation_failed", message: "Revisa los datos del formulario.", fields } },
        422,
      ),
    );

    const error = await captureError(
      accountRequest({ method: "POST", path: "/customers", ctx: anonymous, body: {} }, schema),
    );

    expect(error).toBeInstanceOf(MarketplaceAccountError);
    const accountError = error as MarketplaceAccountError;
    expect(accountError.status).toBe(422);
    expect(accountError.code).toBe("validation_failed");
    expect(accountError.message).toBe("Revisa los datos del formulario.");
    expect(accountError.fields).toEqual(fields);
    expect(accountError.retryAfter).toBeNull();
  });

  it("un 401 unauthenticated lanza MarketplaceAccountError (RN-MARKETPLACE-05)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: "unauthenticated", message: "Inicia sesión para continuar." } }, 401),
    );

    const error = await captureError(accountRequest({ method: "GET", path: "/me", ctx: anonymous }, schema));

    expect(error).toBeInstanceOf(MarketplaceAccountError);
    expect((error as MarketplaceAccountError).code).toBe("unauthenticated");
    expect((error as MarketplaceAccountError).status).toBe(401);
  });

  it("un 401 sin el cuerpo de error de cuenta es API caída (RN-MARKETPLACE-05)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Unauthenticated." }, 401));

    const error = await captureError(accountRequest({ method: "GET", path: "/me", ctx: anonymous }, schema));

    expect(error).toBeInstanceOf(MarketplaceUnavailableError);
    expect((error as MarketplaceUnavailableError).endpoint).toBe("/me");
  });

  it("un 429 con retry_after da esos segundos (RN-MARKETPLACE-06)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: "too_many_attempts",
            message: "Demasiados intentos. Prueba de nuevo en 17 segundos.",
            retry_after: 17,
          },
        },
        429,
      ),
    );

    const error = await captureError(
      accountRequest({ method: "POST", path: "/auth/login", ctx: anonymous, body: {} }, schema),
    );

    expect(error).toBeInstanceOf(MarketplaceAccountError);
    expect((error as MarketplaceAccountError).code).toBe("too_many_attempts");
    expect((error as MarketplaceAccountError).retryAfter).toBe(17);
  });

  it("un 429 sin cuerpo de error toma Retry-After (RN-MARKETPLACE-06)", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: "Too Many Attempts.", status: 429 }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "30" },
      }),
    );

    const error = await captureError(
      accountRequest({ method: "POST", path: "/auth/login", ctx: anonymous, body: {} }, schema),
    );

    expect(error).toBeInstanceOf(MarketplaceAccountError);
    expect((error as MarketplaceAccountError).code).toBe("too_many_attempts");
    expect((error as MarketplaceAccountError).retryAfter).toBe(30);
  });

  it("un 429 sin cuerpo de error ni Retry-After da 60 (RN-MARKETPLACE-06)", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 429 }));

    const error = await captureError(
      accountRequest({ method: "POST", path: "/auth/login", ctx: anonymous, body: {} }, schema),
    );

    expect(error).toBeInstanceOf(MarketplaceAccountError);
    expect((error as MarketplaceAccountError).retryAfter).toBe(60);
  });

  it("un 409 quote_changed lanza MarketplaceAccountError con la Quote nueva (RN-MARKETPLACE-05)", async () => {
    const quote = {
      quote_hash: "hash-nuevo",
      stores: [
        {
          store_slug: "farmacia-central-valencia",
          fulfillment: "pickup",
          delivery_available: false,
          delivery_unavailable_reason: "no_address",
          subtotal_usd: "2.60",
          subtotal_ves: "94.90",
          delivery_fee_usd: "0.00",
          delivery_fee_ves: "0.00",
          total_usd: "2.60",
          total_ves: "94.90",
        },
      ],
      total_usd: "2.60",
      total_ves: "94.90",
      charge: { currency: "VES", amount: "94.90" },
      rate: { usd_ves: "36.50", valid_on: "2026-09-26" },
    };
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: "quote_changed", message: "Tu compra cambió. Revisa los precios y la entrega.", quote } }, 409),
    );

    const error = await captureError(
      accountRequest({ method: "POST", path: "/checkout", ctx: anonymous, body: {} }, schema),
    );

    expect(error).toBeInstanceOf(MarketplaceAccountError);
    expect((error as MarketplaceAccountError).status).toBe(409);
    expect((error as MarketplaceAccountError).quote?.quote_hash).toBe("hash-nuevo");
  });

  it("un 403 email_unverified lanza MarketplaceAccountError sin Quote (RN-MARKETPLACE-05)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: "email_unverified", message: "Verifica tu correo para comprar." } }, 403),
    );

    const error = await captureError(
      accountRequest({ method: "POST", path: "/checkout", ctx: anonymous, body: {} }, schema),
    );

    expect((error as MarketplaceAccountError).code).toBe("email_unverified");
    expect((error as MarketplaceAccountError).quote).toBeNull();
  });

  it("la consulta de accountRequest va en la URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }));

    await accountRequest(
      { method: "GET", path: "/me/purchases", ctx: anonymous, query: new URLSearchParams({ page: "2" }) },
      schema,
    );

    expect(String(fetchMock.mock.calls[0][0])).toBe("https://api.test/api/marketplace/v1/me/purchases?page=2");
  });

  it.each([500, 503])("un estado %i lanza MarketplaceUnavailableError (RN-MARKETPLACE-05)", async (status) => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: "not_found", message: "No encontrado." } }, status),
    );

    const error = await captureError(accountRequest({ method: "GET", path: "/me", ctx: anonymous }, schema));

    expect(error).toBeInstanceOf(MarketplaceUnavailableError);
    expect((error as MarketplaceUnavailableError).endpoint).toBe("/me");
  });
});

describe("accountCommand", () => {
  it("un 204 resuelve", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      accountCommand({ method: "DELETE", path: "/me/addresses/3", ctx: { session: "7|abc", clientIp: null } }),
    ).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/api/marketplace/v1/me/addresses/3");
    expect(init?.method).toBe("DELETE");
  });
});
