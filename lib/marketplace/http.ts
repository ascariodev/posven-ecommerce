import "server-only";
import type { z } from "zod";
import { MarketplaceUnavailableError } from "./errors";

const TIMEOUT_MS = 5000;

export async function requestJson<T>(
  path: string,
  query: URLSearchParams,
  schema: z.ZodType<T>,
): Promise<T> {
  const baseUrl = process.env.MARKETPLACE_API_URL;
  const apiKey = process.env.MARKETPLACE_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "MARKETPLACE_API_URL y MARKETPLACE_API_KEY son obligatorias con MARKETPLACE_MODE=api",
    );
  }

  const search = query.toString();
  const url = `${baseUrl.replace(/\/+$/, "")}${path}${search === "" ? "" : `?${search}`}`;

  let body: unknown;
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new MarketplaceUnavailableError(path, { cause: new Error(`HTTP ${response.status}`) });
    }
    body = await response.json();
  } catch (error) {
    if (error instanceof MarketplaceUnavailableError) throw error;
    throw new MarketplaceUnavailableError(path, { cause: error });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("[marketplace]", path, parsed.error.issues);
    throw new MarketplaceUnavailableError(path, { cause: parsed.error });
  }
  return parsed.data;
}
