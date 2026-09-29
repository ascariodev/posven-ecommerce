import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";

export type FormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fields: Record<string, string>;
  values: Record<string, string>;
};

export const INITIAL_FORM_STATE: FormState = { status: "idle", message: null, fields: {}, values: {} };

const UNAVAILABLE_MESSAGE = "No pudimos conectar con el servicio. Intenta de nuevo en unos segundos.";
const DEFAULT_RETRY_AFTER = 60;

function errorState(message: string, values: Record<string, string>, fields: Record<string, string> = {}): FormState {
  return { status: "error", message, fields, values };
}

export function formStateFromError(error: unknown, values: Record<string, string>): FormState {
  if (error instanceof MarketplaceUnavailableError) return errorState(UNAVAILABLE_MESSAGE, values);
  if (error instanceof MarketplaceAccountError) {
    switch (error.code) {
      case "validation_failed":
        return errorState(error.message, values, error.fields ?? {});
      case "invalid_credentials":
      case "token_invalid":
      case "token_expired":
      case "not_found":
        return errorState(error.message, values);
      case "too_many_attempts":
        return errorState(
          `Demasiados intentos, prueba en ${error.retryAfter ?? DEFAULT_RETRY_AFTER} segundos`,
          values,
        );
    }
  }
  throw error;
}
