import type { ZodError } from "zod";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";

export type FormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fields: Record<string, string>;
  values: Record<string, string>;
};

export const INITIAL_FORM_STATE: FormState = { status: "idle", message: null, fields: {}, values: {} };

const UNAVAILABLE_MESSAGE = "No pudimos conectar con el servicio. Intenta de nuevo en unos segundos.";
const VALIDATION_MESSAGE = "Revisa los datos del formulario.";
const GENERIC_MESSAGE = "No pudimos completar la acción. Intenta de nuevo.";
const DEFAULT_RETRY_AFTER = 60;

function errorState(message: string, values: Record<string, string>, fields: Record<string, string> = {}): FormState {
  return { status: "error", message, fields, values };
}

// Las claves de los esquemas son las de la API, así que `fields` se pinta igual que un validation_failed.
export function formStateFromZod(error: ZodError, values: Record<string, string>): FormState {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fields)) fields[key] = issue.message;
  }
  return errorState(VALIDATION_MESSAGE, values, fields);
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
      // Eliminar la cuenta con pedidos en curso (spec cuentas-y-compras §5.8): el mensaje de la API.
      case "open_orders":
        return errorState(error.message, values);
      case "too_many_attempts":
        return errorState(
          `Demasiados intentos, prueba en ${error.retryAfter ?? DEFAULT_RETRY_AFTER} segundos`,
          values,
        );
      case "unauthenticated":
        throw error;
      default:
        return errorState(GENERIC_MESSAGE, values);
    }
  }
  throw error;
}
