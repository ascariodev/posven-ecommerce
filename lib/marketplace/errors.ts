export class MarketplaceUnavailableError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string, options?: { cause?: unknown }) {
    super(`La API del marketplace no respondió bien en ${endpoint}`, options);
    this.name = "MarketplaceUnavailableError";
    this.endpoint = endpoint;
  }
}
