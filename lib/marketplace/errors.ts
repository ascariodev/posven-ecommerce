import type { AccountErrorCode, Quote } from "./schemas";

export class MarketplaceUnavailableError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string, options?: { cause?: unknown }) {
    super(`La API del marketplace no respondió bien en ${endpoint}`, options);
    this.name = "MarketplaceUnavailableError";
    this.endpoint = endpoint;
  }
}

export class MarketplaceAccountError extends Error {
  readonly status: number;
  readonly code: AccountErrorCode;
  readonly fields: Record<string, string> | null;
  readonly retryAfter: number | null;
  readonly quote: Quote | null;

  constructor(p: {
    status: number;
    code: AccountErrorCode;
    message: string;
    fields?: Record<string, string> | null;
    retryAfter?: number | null;
    quote?: Quote | null;
  }) {
    super(p.message);
    this.name = "MarketplaceAccountError";
    this.status = p.status;
    this.code = p.code;
    this.fields = p.fields ?? null;
    this.retryAfter = p.retryAfter ?? null;
    this.quote = p.quote ?? null;
  }
}
