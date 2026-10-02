---
module: "purchases"
path: "features/purchases"
type: "feature"
exports: ["PURCHASE_STATUS_TEXT", "ORDER_STATUS_TEXT", "FULFILLMENT_TEXT", "formatDateTime", "storeCountText", "readPurchasesPage", "isPageOutOfRange", "PurchaseList", "PurchaseRow", "purchaseHref", "PurchaseDetail", "RecentPurchases"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "components/ui/badge.tsx", "components/ui/button.tsx", "components/ui/card.tsx"]
tests: "features/purchases/__tests__/*.test.{ts,tsx}"
verified_against: ["features/purchases/lib/labels.ts", "features/purchases/lib/pagination.ts", "features/purchases/__tests__/pagination.test.ts", "features/purchases/components/PurchaseList.tsx", "features/purchases/components/PurchaseDetail.tsx", "features/purchases/components/RecentPurchases.tsx", "features/purchases/__tests__/PurchaseList.test.tsx", "features/purchases/__tests__/PurchaseDetail.test.tsx", "features/purchases/__tests__/RecentPurchases.test.tsx", "app/cuenta/compras/page.tsx", "app/cuenta/compras/[codigo]/page.tsx", "app/cuenta/page.tsx", "app/cuenta/layout.tsx", "e2e/checkout.spec.ts", "lib/marketplace/client.ts", "lib/marketplace/schemas.ts"]
capabilities:
  - intent: "listar las compras del comprador, paginadas"
    intent_aliases: ["mis compras", "historial de compras", "pedidos", "compras anteriores"]
    entrypoint: "<PurchaseList />"
    file: "features/purchases/components/PurchaseList.tsx"
    input: "page: PurchasePage (de listPurchases en app/cuenta/compras/page.tsx, con ?pagina=N)"
    output: "filas con código, estado, fecha, tiendas y total enlazadas al detalle; 'Anteriores' y 'Siguientes'; vacío con 'Buscar productos'"
    source: "GET /me/purchases?page de posveapi vía BFF"
    rules: ["RN-PURCHASES-01"]
  - intent: "ver el detalle de una compra con el código de retiro y los reembolsos"
    intent_aliases: ["detalle de compra", "codigo de retiro", "pickup code", "reembolso", "linea faltante"]
    entrypoint: "<PurchaseDetail />"
    file: "features/purchases/components/PurchaseDetail.tsx"
    input: "purchase: Purchase (de getPurchase en app/cuenta/compras/[codigo]/page.tsx)"
    output: "estado, total y cobro; una tarjeta por pedido con entrega, estado (sólo pagada), código de retiro, dirección, líneas con 'Faltante · reembolsado', subtotal, envío, reembolsado y fechas"
    source: "GET /me/purchases/{code} de posveapi vía BFF"
    rules: ["RN-PURCHASES-02", "RN-PURCHASES-03"]
  - intent: "mostrar las últimas compras en el resumen de la cuenta"
    intent_aliases: ["ultimas compras", "resumen de compras"]
    entrypoint: "<RecentPurchases />"
    file: "features/purchases/components/RecentPurchases.tsx"
    input: "ctx: AccountContext; en app/cuenta/page.tsx dentro de <Suspense>, con el carrito encendido"
    output: "las 3 primeras de la página 1 y 'Ver todas'; null sin compras"
    source: "GET /me/purchases?page=1"
    rules: ["RN-PURCHASES-01"]
---

# Módulo `purchases`

## 1. Propósito

Compras del comprador (plan 4b de cuentas y compras): el historial paginado en `/cuenta/compras`,
el detalle en `/cuenta/compras/[codigo]` con el código de retiro y los reembolsos, y "Últimas
compras" en `/cuenta`. No calcula montos: el envío, el reembolso y los totales son cadenas de la
API. El pago y su resultado viven en `features/checkout`.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-PURCHASES-01` | Las compras llegan de 10 en 10, más recientes primero, paginadas con `?pagina=N` (la 1 sin parámetro); una página vacía tras la 1 es 404. "Últimas compras" muestra las 3 primeras de la página 1 y no se pinta si la API falla, salvo un 401. | `features/purchases/__tests__/pagination.test.ts`; `features/purchases/__tests__/PurchaseList.test.tsx`; `features/purchases/__tests__/RecentPurchases.test.tsx`; `lib/marketplace/mock/__tests__/checkout.test.ts` ("el listado va de 10 en 10...") |
| `RN-PURCHASES-02` | El detalle destaca el `pickup_code` ("Código de retiro") cuando no es nulo y marca cada línea `missing` con "Faltante · reembolsado"; el reembolsado del pedido sale sólo si no es cero. | `features/purchases/__tests__/PurchaseDetail.test.tsx`; `e2e/checkout.spec.ts` ("compra completa...") |
| `RN-PURCHASES-03` | El estado de cada pedido sólo se muestra con la compra `paid`: el contrato no tiene un estado de pedido para una compra sin pagar (hueco a acordar con posveapi). | `features/purchases/__tests__/PurchaseDetail.test.tsx` ("con la compra sin pagar no muestra el estado del pedido") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Textos de estados o entrega | `lib/labels.ts` | las pruebas de lista y detalle (`__tests__/`) y `e2e/checkout.spec.ts` |
| Un dato nuevo del pedido | `components/PurchaseDetail.tsx` | el esquema en `lib/marketplace/schemas.ts` primero (spec §4.1) |
| Tamaño de "Últimas compras" | `RECENT_COUNT` en `components/RecentPurchases.tsx` | `__tests__/RecentPurchases.test.tsx` |

## 4. API pública

- `PURCHASE_STATUS_TEXT`, `ORDER_STATUS_TEXT`, `FULFILLMENT_TEXT`, `formatDateTime(iso: string): string` ("30/09/2026 14:00" en hora de Caracas) y `storeCountText(count: number): string`, `features/purchases/lib/labels.ts`.
- `PurchaseList({ page }: { page: PurchasePage })`, `PurchaseRow({ purchase })` y `purchaseHref(code: string): string`, `features/purchases/components/PurchaseList.tsx`.
- `PurchaseDetail({ purchase }: { purchase: Purchase })`, `features/purchases/components/PurchaseDetail.tsx`.
- `readPurchasesPage(raw: string | string[] | undefined): number` (inválida es 1) e `isPageOutOfRange(page: PurchasePage): boolean`, `features/purchases/lib/pagination.ts`.
- `RecentPurchases({ ctx }: { ctx: AccountContext })`, `features/purchases/components/RecentPurchases.tsx` (Server Component async): con la API caída o un error de cuenta que no sea 401 devuelve `null`.

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Textos y fechas | `lib/labels.ts` | estados en español y fecha armada por partes de `Intl.DateTimeFormat` |
| Lista | `components/PurchaseList.tsx` | filas enlazadas y paginación desde `meta` (cuenta páginas, no montos) |
| Detalle | `components/PurchaseDetail.tsx` | una tarjeta por pedido; fechas no nulas de `timeline` |
| Paginación | `lib/pagination.ts` | lectura de `?pagina` y la decisión del 404, fuera de la ruta para probarlas |
| Resumen | `components/RecentPurchases.tsx` | reutiliza `PurchaseRow`; degrada a nada si la API falla, para no tumbar `/cuenta` (excepción de `app-router.md` 7) |
| Rutas | `app/cuenta/compras/page.tsx`, `app/cuenta/compras/[codigo]/page.tsx` | `noindex`, `requireCustomer`, 404 con el carrito apagado, código inválido o `not_found`; título fijo "Detalle de compra" (el código es de la petición) |

## 6. Dependencias

- `lib/marketplace/client.ts` (`listPurchases`), `schemas.ts`, `params.ts`; `lib/format.ts`.
- `components/ui/` (`Badge`, `buttonVariants`, `Card`).
- Las rutas usan `features/account/server/session.ts`, `features/cart/lib/flag.ts` y `PURCHASE_CODE_PATTERN` de `features/checkout/components/CheckoutResult.tsx`.

## 7. Ejemplo de uso

```tsx
import { PurchaseList } from "@/features/purchases/components/PurchaseList";
import { listPurchases } from "@/lib/marketplace/client";
import type { AccountContext } from "@/lib/marketplace/params";

async function Purchases({ ctx }: { ctx: AccountContext }) {
  return <PurchaseList page={await listPurchases(ctx, 1)} />;
}
```

## 8. Restricciones

- El módulo no calcula montos: todo monto es una cadena de la API formateada con `lib/format.ts`.
- Nada de un comprador en `'use cache'`; las rutas leen la sesión dentro de `<Suspense>`.
- "Últimas compras" no sigue §6 ("API caída: `error.tsx`"): es un bloque secundario de `/cuenta` y, si la API falla, no se pinta; el resto del resumen sigue. Un 401 sí sube.
- Con el carrito apagado no hay compras: `/cuenta/compras*` da 404 y ni "Mis compras" ni "Últimas compras" se pintan.

## 9. Pruebas

- Comando: el de la sección Verificación de `posven-ecommerce/CLAUDE.md` (`npx vitest run features/purchases`).
- `features/purchases/__tests__/PurchaseList.test.tsx`: fecha de Caracas, fila completa, vacío y paginación en la primera y la última página.
- `features/purchases/__tests__/PurchaseDetail.test.tsx`: código de retiro, faltante reembolsado y montos sin calcular; entrega con dirección y envío; estado del pedido oculto sin pagar.
- `features/purchases/__tests__/pagination.test.ts`: `?pagina` válida e inválida; fuera de rango, vacía en la 1 y en rango.
- `features/purchases/__tests__/RecentPurchases.test.tsx`: las 3 primeras y "Ver todas"; nada sin compras, con la API caída o con un 429; un 401 sube.
- `e2e/checkout.spec.ts`: el detalle con el código de retiro y el reembolso, y "Últimas compras" en `/cuenta`.
