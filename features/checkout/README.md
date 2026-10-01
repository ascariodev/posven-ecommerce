---
module: "checkout"
path: "features/checkout"
type: "feature"
exports: ["readCheckoutParams", "checkoutHref", "FULFILLMENT_PARAM_PREFIX", "CheckoutParams", "loadCheckout", "CheckoutData", "payCheckout", "CheckoutState", "INITIAL_CHECKOUT_STATE", "PAY_FAILED", "CheckoutView", "CheckoutViewSkeleton", "EMAIL_UNVERIFIED_MESSAGE", "CheckoutForm", "DELIVERY_UNAVAILABLE_TEXT", "CheckoutEmpty", "CART_EMPTY_MESSAGE", "CheckoutResult", "CheckoutResultSkeleton", "PURCHASE_CODE_PATTERN", "resultHref", "PurchasePoller", "POLL_INTERVAL_MS"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/utils.ts", "features/account/session.ts", "features/account/VerifyEmailForm.tsx", "features/account/actions.ts", "features/cart/lib/flag.ts", "components/ui/badge.tsx", "components/ui/button.tsx", "components/ui/card.tsx", "components/ui/radio-group.tsx", "components/ui/select.tsx", "components/ui/skeleton.tsx"]
tests: "features/checkout/*.test.{ts,tsx}"
verified_against: ["features/checkout/params.ts", "features/checkout/server.ts", "features/checkout/actions.ts", "features/checkout/checkoutState.ts", "features/checkout/CheckoutView.tsx", "features/checkout/CheckoutForm.tsx", "features/checkout/CheckoutEmpty.tsx", "features/checkout/CheckoutResult.tsx", "features/checkout/PurchasePoller.tsx", "features/checkout/params.test.ts", "features/checkout/server.test.ts", "features/checkout/actions.test.ts", "features/checkout/CheckoutForm.test.tsx", "features/checkout/CheckoutResult.test.tsx", "features/checkout/PurchasePoller.test.tsx", "app/checkout/page.tsx", "app/checkout/resultado/page.tsx", "app/robots.ts", "e2e/checkout.spec.ts", "lib/marketplace/client.ts", "lib/marketplace/schemas.ts"]
capabilities:
  - intent: "pagar el carrito: elegir dirección y retiro o entrega por tienda, ver la cotización e iniciar el pago"
    intent_aliases: ["checkout", "pagar", "finalizar compra", "cotizar envio", "retiro o entrega"]
    entrypoint: "<CheckoutView />"
    file: "features/checkout/CheckoutView.tsx"
    input: "searchParams de /checkout (direccion=<id>, f-<tienda>=delivery); dentro de <Suspense> en app/checkout/page.tsx"
    output: "tiendas con sus líneas, retiro o entrega (con el motivo si no hay entrega), totales de la Quote y 'Pagar Bs X'; sin correo verificado, el aviso con 'Reenviar verificación' y sin botón; sin líneas disponibles, 'Volver al carrito'"
    source: "GET /me/cart, GET /me/addresses y POST /checkout/quote vía BFF; la Server Action payCheckout llama a POST /checkout"
    rules: ["RN-CHECKOUT-01", "RN-CHECKOUT-02", "RN-CHECKOUT-03"]
  - intent: "mostrar el resultado del pago y consultarlo hasta un estado final"
    intent_aliases: ["resultado del pago", "pago confirmado", "pago fallido", "estado de la compra"]
    entrypoint: "<CheckoutResult />"
    file: "features/checkout/CheckoutResult.tsx"
    input: "code (el ?compra= validado con PURCHASE_CODE_PATTERN en app/checkout/resultado/page.tsx)"
    output: "pendiente con PurchasePoller (refresca cada 3 s); pagada con 'Ver tu compra'; fallida o vencida con 'Volver al carrito'; 404 si no es del comprador"
    source: "GET /me/purchases/{code} vía BFF"
    rules: ["RN-CHECKOUT-04"]
---

# Módulo `checkout`

## 1. Propósito

Checkout del comprador (plan 4b de cuentas y compras): la página `/checkout`, con dirección y
retiro o entrega por tienda, la cotización de la API, el inicio del pago y la página
`/checkout/resultado`, que consulta la compra hasta un estado final. No calcula montos: muestra los
de la Quote y de la compra. Las compras (`/cuenta/compras`) viven en `features/purchases`.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-CHECKOUT-01` | Pagar exige sesión (`requireCustomer`; un 401 al pagar borra la sesión y lleva a `/entrar?volver=%2Fcheckout`) y correo verificado: sin verificar, o ante un 403 `email_unverified`, se muestra el aviso de abajo y no se ofrece pagar. | `features/checkout/actions.test.ts` ("un 401 borra la sesión...", "mapea %s a su estado"); `features/checkout/CheckoutForm.test.tsx` ("sin el correo verificado no ofrece pagar", "un email_unverified de la acción..."); `e2e/checkout.spec.ts` ("sin el correo verificado no se puede pagar") |
| `RN-CHECKOUT-02` | La elección vive en la URL (`direccion`, `f-<tienda>=delivery`) y cada cambio vuelve a cotizar en el servidor; sin dirección todo es retiro. Un 409 `quote_changed` reemplaza la Quote, marca "Cambió" y pide confirmar otra vez. | `features/checkout/params.test.ts`; `features/checkout/server.test.ts`; `features/checkout/CheckoutForm.test.tsx` ("elegir entrega vuelve a cotizar...", "tras quote_changed...", "tras dos quote_changed seguidos...") |
| `RN-CHECKOUT-03` | Cada página pintada de `/checkout` genera una `idempotency_key` (UUID v4) y la reenvía igual en cada intento de pago de esa página; el formulario de pago manda la dirección, las entregas y el `quote_hash` de la Quote que se muestra. | `features/checkout/CheckoutForm.test.tsx` ("los campos ocultos llevan lo de la Quote vigente"); `features/checkout/actions.test.ts` ("manda lo cotizado y redirige a la pasarela", "con %s no llama a la API") |
| `RN-CHECKOUT-04` | `/checkout/resultado` consulta la compra cada 3 s mientras está `pending_payment` y para en un estado final (`paid`, `failed`, `expired`); sin JavaScript queda "Consultar de nuevo". | `features/checkout/PurchasePoller.test.tsx`; `features/checkout/CheckoutResult.test.tsx`; `e2e/checkout.spec.ts` |

Aviso sin correo verificado (`RN-CHECKOUT-01`): "Verifica tu correo para comprar." con "Reenviar
verificación" y sin "Pagar".

Marca "Cambió" (`RN-CHECKOUT-02`): va en las tiendas cuyo total o entrega difieren de la Quote
mostrada justo antes, también tras dos `quote_changed` seguidos.

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Un parámetro nuevo de la elección | `params.ts` (`readCheckoutParams` y `checkoutHref`) | su lectura en `server.ts` (`loadCheckout`) y su caso en `params.test.ts` |
| Un error nuevo del pago | `stateFrom` en `actions.ts` y el tipo `CheckoutState` | cómo lo muestra `CheckoutForm.tsx` y su caso en `actions.test.ts` |
| Textos de "sin entrega" | `DELIVERY_UNAVAILABLE_TEXT` en `CheckoutForm.tsx` | `CheckoutForm.test.tsx` y `e2e/checkout.spec.ts` |
| Un estado nuevo de la compra | `CheckoutResult.tsx` y `features/purchases/labels.ts` | el esquema en `lib/marketplace/schemas.ts` primero (spec §4.1) |

## 4. API pública

- `readCheckoutParams(searchParams): CheckoutParams`, `checkoutHref(addressId: number | null, delivery: string[]): string`, `FULFILLMENT_PARAM_PREFIX` y `type CheckoutParams = { addressId: number | null; delivery: string[] }`, `features/checkout/params.ts` (sin `server-only`: lo usa el formulario del cliente).
- `loadCheckout(ctx: AccountContext, params: CheckoutParams): Promise<CheckoutData>` y `type CheckoutData`, `features/checkout/server.ts` (`server-only`): carrito, direcciones y Quote; vacío si no hay líneas `ok` o la API responde `cart_empty`; si la dirección deja de valer al cotizar, cotiza sin ella.
- `payCheckout(prev: CheckoutState, formData: FormData): Promise<CheckoutState>`, `features/checkout/actions.ts` (`"use server"`, sólo esta acción): campos `address_id`, `store_slug` repetido, `f-<tienda>`, `quote_hash` e `idempotency_key`; redirige a `redirect_url` o devuelve las instrucciones.
- `CheckoutState`, `INITIAL_CHECKOUT_STATE` y `PAY_FAILED`, `features/checkout/checkoutState.ts`.
- `CheckoutView({ searchParams })`, `CheckoutViewSkeleton()` y `EMAIL_UNVERIFIED_MESSAGE`; `CheckoutForm(props)` (`"use client"`) y `DELIVERY_UNAVAILABLE_TEXT`; `CheckoutEmpty({ message? })` y `CART_EMPTY_MESSAGE`.
- `CheckoutResult({ code })`, `CheckoutResultSkeleton()`, `PURCHASE_CODE_PATTERN` (`^[A-Za-z0-9-]{1,40}$`) y `resultHref(code)`; `PurchasePoller({ href })` (`"use client"`) y `POLL_INTERVAL_MS` (3000).

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Elección en la URL | `params.ts` | lectura estricta de `searchParams` y la URL de vuelta |
| Lectura | `server.ts` | dirección pedida, predeterminada, primera o ninguna; retiro sin dirección; `cart_empty` y dirección inválida |
| Página | `CheckoutView.tsx` | `requireCustomer("/checkout")`, `connection()` antes de `crypto.randomUUID()` (guía `08-caching.md`), aviso de correo sin verificar; monta `CheckoutForm` con `key` = `quote_hash` para que una Quote nueva lo reinicie |
| Formulario | `CheckoutForm.tsx` | `Select` de direcciones y `RadioGroup` por tienda que navegan con `router.replace(..., { scroll: false })` en una transición ("Actualizando…" y "Pagar" deshabilitado entretanto); formulario de pago con `useActionState` |
| Acción | `actions.ts` | valida con `checkoutInputSchema`, llama a `startCheckout` dentro de `withSession`, mapea los errores de la API a estados |
| Resultado | `CheckoutResult.tsx`, `PurchasePoller.tsx` | un estado por compra; el poller sólo se monta con la compra pendiente |

## 6. Dependencias

- `lib/marketplace/client.ts` (`getCart`, `listAddresses`, `quoteCheckout`, `startCheckout`, `getPurchase`), `errors.ts`, `schemas.ts`, `params.ts`.
- `features/account/session.ts` (`requireCustomer`, `withSession`), `features/account/VerifyEmailForm.tsx` (`ResendVerificationForm`), `features/cart/lib/flag.ts` (`cartEnabled`).
- `lib/format.ts`; `components/ui/` (`Badge`, `Button`, `Card`, `RadioGroup`, `Select`, `Skeleton`).

## 7. Ejemplo de uso

```tsx
import { Suspense } from "react";
import { CheckoutView, CheckoutViewSkeleton } from "@/features/checkout/CheckoutView";

export default function Page({ searchParams }: PageProps<"/checkout">) {
  return (
    <Suspense fallback={<CheckoutViewSkeleton />}>
      <CheckoutView searchParams={searchParams} />
    </Suspense>
  );
}
```

## 8. Restricciones

- El módulo no calcula montos: los de la Quote y de la compra se muestran con `lib/format.ts`. "Cambió" compara cadenas de la Quote vieja y la nueva.
- El navegador nunca llama a posveapi: la cotización es un Server Component y la consulta cada 3 s es `router.refresh()`.
- Nada de un comprador en `'use cache'`; las páginas leen cookies y `searchParams` dentro de `<Suspense>`.
- Con el carrito apagado (`cartEnabled()`), `/checkout` y `/checkout/resultado` dan 404 y `payCheckout` no hace nada.
- Sin JavaScript el checkout no se ve (hallazgo del plan 4a: con PPR el contenido del `<Suspense>` lo revela un script), así que no hay botón "Actualizar".
- `/cuenta/direcciones?volver=/checkout` muestra "Volver al checkout"; cualquier otro `volver` se ignora.

## 9. Pruebas

- Comando: el de la sección Verificación de `posven-ecommerce/CLAUDE.md` (`npx vitest run features/checkout`).
- `features/checkout/params.test.ts`: lectura de la dirección y las entregas, valores ignorados y la URL de vuelta.
- `features/checkout/server.test.ts`: dirección pedida, ajena y ausente; retiro sin dirección; vacío sin líneas y con `cart_empty`; nueva cotización sin dirección.
- `features/checkout/actions.test.ts`: redirección a la pasarela, instrucciones, `quote_changed`, 403, `cart_empty`, 429 con segundos, API caída, 401, entradas inválidas e interruptor apagado.
- `features/checkout/CheckoutForm.test.tsx`: montos sin calcular, entrega deshabilitada con cada motivo, "Agregar dirección", navegación al elegir entrega, campos ocultos, "Cambió" tras uno y tras dos `quote_changed` seguidos, "Reenviar verificación" ante un `email_unverified` de la acción y sin pagar con el correo sin verificar.
- `features/checkout/CheckoutResult.test.tsx` y `PurchasePoller.test.tsx`: los cuatro estados, 404 y el intervalo de 3 s.
- `e2e/checkout.spec.ts` (en serie): compra completa con código de retiro y reembolso, sin verificar, entrega con envío, pago fallido y `noindex`.
