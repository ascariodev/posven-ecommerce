import "server-only";
import type { z } from "zod";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "./errors";
import type { AccountContext } from "./params";
import { accountErrorBodySchema } from "./schemas";

const TIMEOUT_MS = 5000;
const ACCOUNT_ERROR_STATUSES = new Set([401, 403, 404, 409, 422, 429]);
const DEFAULT_RETRY_AFTER_S = 60;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function exchange<R>(
  path: string,
  query: URLSearchParams,
  init: { method: HttpMethod; headers?: Record<string, string>; body?: string },
  onResponse: (response: Response) => Promise<R>,
): Promise<R> {
  const baseUrl = process.env.MARKETPLACE_API_URL;
  const apiKey = process.env.MARKETPLACE_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "MARKETPLACE_API_URL y MARKETPLACE_API_KEY son obligatorias con MARKETPLACE_MODE=api",
    );
  }

  const search = query.toString();
  const url = `${baseUrl.replace(/\/+$/, "")}${path}${search === "" ? "" : `?${search}`}`;

  try {
    const response = await fetch(url, {
      method: init.method,
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json", ...init.headers },
      body: init.body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return await onResponse(response);
  } catch (error) {
    if (error instanceof MarketplaceUnavailableError) throw error;
    if (error instanceof MarketplaceAccountError) throw error;
    throw new MarketplaceUnavailableError(path, { cause: error });
  }
}

async function discardBody(response: Response): Promise<void> {
  await response.body?.cancel();
}

async function readOkBody(path: string, response: Response): Promise<unknown> {
  if (!response.ok) {
    await discardBody(response);
    throw new MarketplaceUnavailableError(path, { cause: new Error(`HTTP ${response.status}`) });
  }
  return response.json();
}

function parseBody<T>(path: string, body: unknown, schema: z.ZodType<T>): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("[marketplace]", path, parsed.error.issues);
    throw new MarketplaceUnavailableError(path, { cause: parsed.error });
  }
  return parsed.data;
}

export async function requestJson<T>(
  path: string,
  query: URLSearchParams,
  schema: z.ZodType<T>,
): Promise<T> {
  const body = await exchange(path, query, { method: "GET" }, (response) =>
    readOkBody(path, response),
  );
  return parseBody(path, body, schema);
}

export async function requestJsonOrNull<T>(
  path: string,
  query: URLSearchParams,
  schema: z.ZodType<T>,
): Promise<T | null> {
  const found = await exchange(path, query, { method: "GET" }, async (response) => {
    if (response.status === 404) {
      await discardBody(response);
      return null;
    }
    return { body: await readOkBody(path, response) };
  });
  return found === null ? null : parseBody(path, found.body, schema);
}

export async function postJson(path: string, body: unknown): Promise<void> {
  await exchange(
    path,
    new URLSearchParams(),
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    async (response) => {
      await discardBody(response);
      if (!response.ok) {
        throw new MarketplaceUnavailableError(path, { cause: new Error(`HTTP ${response.status}`) });
      }
    },
  );
}

export type AccountRequest = {
  method: HttpMethod;
  path: string;
  ctx: AccountContext;
  body?: unknown;
  query?: URLSearchParams;
};

function retryAfterHeader(response: Response): number {
  const value = response.headers.get("Retry-After")?.trim() ?? "";
  return /^\d+$/.test(value) ? Number(value) : DEFAULT_RETRY_AFTER_S;
}

async function readAccountError(path: string, response: Response): Promise<Error> {
  const unavailable = new MarketplaceUnavailableError(path, {
    cause: new Error(`HTTP ${response.status}`),
  });
  if (!ACCOUNT_ERROR_STATUSES.has(response.status)) {
    await discardBody(response);
    return unavailable;
  }

  const body: unknown = await response.json().catch(() => null);
  const parsed = accountErrorBodySchema.safeParse(body);
  const isRateLimit = response.status === 429;

  if (parsed.success) {
    const { code, message, fields, retry_after, quote } = parsed.data.error;
    return new MarketplaceAccountError({
      status: response.status,
      code,
      message,
      fields: fields ?? null,
      retryAfter: retry_after ?? (isRateLimit ? retryAfterHeader(response) : null),
      quote: quote ?? null,
    });
  }

  if (isRateLimit) {
    const retryAfter = retryAfterHeader(response);
    return new MarketplaceAccountError({
      status: 429,
      code: "too_many_attempts",
      message: `Demasiados intentos. Prueba de nuevo en ${retryAfter} segundos.`,
      retryAfter,
    });
  }

  return unavailable;
}

function sendAccount<R>(req: AccountRequest, onOk: (response: Response) => Promise<R>): Promise<R> {
  const headers: Record<string, string> = {};
  if (req.body !== undefined) headers["Content-Type"] = "application/json";
  if (req.ctx.session !== null) headers["X-Marketplace-Customer"] = req.ctx.session;
  if (req.ctx.clientIp !== null) headers["X-Client-IP"] = req.ctx.clientIp;

  return exchange(
    req.path,
    req.query ?? new URLSearchParams(),
    {
      method: req.method,
      headers,
      body: req.body === undefined ? undefined : JSON.stringify(req.body),
    },
    async (response) => {
      if (!response.ok) throw await readAccountError(req.path, response);
      return onOk(response);
    },
  );
}

export async function accountRequest<T>(req: AccountRequest, schema: z.ZodType<T>): Promise<T> {
  const body = await sendAccount(req, (response): Promise<unknown> => response.json());
  return parseBody(req.path, body, schema);
}

export async function accountCommand(req: AccountRequest): Promise<void> {
  await sendAccount(req, discardBody);
}
