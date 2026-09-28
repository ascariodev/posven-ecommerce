import "server-only";
import type { z } from "zod";
import { MarketplaceUnavailableError } from "./errors";

const TIMEOUT_MS = 5000;

async function exchange<R>(
  path: string,
  query: URLSearchParams,
  init: { method: "GET" | "POST"; headers?: Record<string, string>; body?: string },
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
