# Revisión del plan 4a de cuentas y compras (carrito)

- Plan: `docs/plans/terminados/2026-09-30-cuentas-plan-4a-carrito.md` (modo completo)
- Fuentes: spec cruzada `cuentas-y-compras` (copia de quien coordina) y la enmienda del 2026-09-30
  (`docs/delivery/2026-09-30-enmienda-cuentas-y-compras-s4.md`)
- Revisor: independiente, sin modificar archivos. Veredicto del primer borrador:
  **CHANGES_REQUIRED** (0 Critical, 9 Important, 11 Minor). Todos se incorporaron al plan.

## Important

| # | Hallazgo | Resolución en el plan |
|---|---|---|
| I-1 | `accepts_orders` con `default(false)` deja el campo obligatorio en el tipo de salida: seis pruebas que arman `StoreSummary` a mano y `ERROR_MESSAGES` de `mock/accounts.ts` dejan de compilar; `authenticate` no se exporta | Task 1 nueva (mecánica) sólo con `accepts_orders` y las seis pruebas; `mock/accounts.ts` entra en la Task 2 con `customerIdFor(ctx)` y los mensajes nuevos |
| I-2 | `cartEnabled()` pedía `MARKETPLACE_MODE === "mock"`, pero `usesMock()` trata la variable ausente como simulado | Decisión 3 y Task 3: misma regla que `usesMock()`, con `flag.test.ts` |
| I-3 | `mergeGuestCart(ctx)` en un archivo `"use server"` sería un endpoint público con `AccountContext` falseable (`X-Client-IP`) | Restricción 5 nueva; `mergeGuestCart` en `features/cart/server.ts` (`server-only`); `actions.ts` sólo exporta las tres acciones de formulario |
| I-4 | `CartLink` sólo atrapaba `MarketplaceUnavailableError`: un 429 del límite global tumbaría el layout | Restricción 6: atrapa también `MarketplaceAccountError`, con prueba del 429; el invitado cuenta `mp_cart` sin API |
| I-5 | `mp_cart` puede pasar de 4 KB con slugs largos (Next la codifica con `encodeURIComponent`) | Restricción 9: slugs de hasta 120 caracteres y techo de 3800 bytes codificados; `serializeCart` devuelve `null` y `addToCart` responde carrito lleno; prueba con 20 líneas largas |
| I-6 | Quitar una línea `unavailable` podía chocar con `not_orderable` de la enmienda G | Enmienda J (`quantity: 0` borra siempre), en el simulado y sus pruebas; `setQuantity`/`removeLine` refrescan ante `not_orderable`; API caída a `error.tsx`, declarado |
| I-7 | Fusión que pasa de 20 líneas sin especificar; un 422 permanente se reintentaría en cada login | Enmienda K (techo de 20, descarta el resto); `mergeGuestCart` conserva la cookie sólo ante API caída y la borra ante `MarketplaceAccountError` |
| I-8 | El e2e de fusión con la cuenta sembrada no era repetible (estado en `globalThis`, `reuseExistingServer`) | `e2e/cart.spec.ts` registra un comprador nuevo por corrida (prueba la fusión al registrarse y al entrar) con slugs fijados; se corre dos veces seguidas |
| I-9 | Faltaban pruebas de §7: opciones de `mp_cart`, `robots.txt` y sitemap, 401 en `addToCart` | Sumadas a `cookie.test.ts`, `actions.test.ts` y `e2e/cart.spec.ts` |

## Minor

| # | Hallazgo | Resolución |
|---|---|---|
| 1 | Cuerpos de `quote`/`merge` y `quantity` 0 del `PUT` | `{ items }` en `quote` y `merge`; `CartItemPut` con 0 a 99 |
| 2 | "Claves de más" no falla con `z.object`; repetidos sin decidir | `z.strictObject`; repetidos rechazados en `cartItemsSchema` |
| 3 | `offers_delivery` no es de `StoreSummary`; `is_open` por hora real; sin producto `controlled` | `offers_delivery` en `MockStore`; `is_open` fijo en el fixture; un `controlled` en el simulado |
| 4 | Casos faltantes en `mock/cart.test.ts` | `offer_gone`, `restricted` en la cotización, `line_count: 0` |
| 5 | `addToCart` en 99, otros errores de cuenta, "Agregado" | tope en 99 con mensaje; cada `MarketplaceAccountError` con su mensaje; el botón sigue sumando ("Agregar otro") |
| 6 | Detalles de `CartView` y `CartLink` | sin precio con montos nulos; "Quitar uno" en 1 y "Agregar uno" en 99 deshabilitados; `null` y `stores: []` iguales; `h-11 md:h-9`; e2e de desborde con contador |
| 7 | `mp_cart` inválida no se borra al leer | desviación declarada; `mergeGuestCart` borra también una cookie inválida |
| 8 | El interruptor se fija al construir | Task 4 y pasos de deploy de la Task 6; el estado apagado lo cubren las pruebas unitarias |
| 9 | Reglas a actualizar | `seo.md` 3 y 8, `tests.md` 7, `app-router.md` 7 en la Task 6 |
| 10 | L-05 no aplica a la Task 4 | cambiada por L-04 |
| 11 | Decisión 5 (sin JavaScript) sin prueba | e2e con `javaScriptEnabled: false` en la Task 5 |
