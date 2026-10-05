# Plan: rediseño F3 · Comprar (carrito, checkout, resultado y seguimiento)

**Objetivo:** carrito agrupado por tienda con retiro o entrega y su costo antes de pagar, checkout
de una página con el estilo del lienzo, y resultado del pago con la línea de estados de cada
pedido; puerta: pago de prueba completo en modo simulado.
**Estado:** en curso · Fase actual: 2

## Contexto mínimo
- Spec: `docs/specs/2026-10-03-rediseno-posven-design.md` §5 (`W08`/`P08`, `W09`/`P09`,
  `W10`/`P10`) y §6 (F3); flujo de compra en
  `posven/.claude/docs/specs/2026-09-29-cuentas-y-compras-design.md` §5.2, §5.3 y §6. Lienzo:
  `docs/design/2026-10-03-rediseno/{movil,web}/` y la maqueta en código
  `docs/design/2026-10-03-rediseno/maqueta/_screens/{carrito,checkout,pedido}.tsx` (sin trackear,
  sólo referencia: datos de ejemplo y montos escritos a mano que la app no copia).
- Repo y rama: `posven-ecommerce` en
  `C:\Users\Windows 11\Documents\Development\posven\posven-ecommerce`, rama `feat/rediseno-f3b-comprar` (desde `main`, autorizada por el usuario).
- Requiere el plan `posven/.claude/docs/plans/rediseno-posven-f3a-contrato.md` terminado: el
  carrito trae por tienda `fulfillment`, `delivery_fee_*` y `total_*`, y `getCart` y
  `quoteGuestCart` reciben las tiendas con entrega elegida.
- Estado de partida (exploración 2026-10-04):
  - `/carrito` no exige sesión; `CartView` (servidor) ya agrupa por tienda (`StoreGroup`, `Line`,
    `CartContent` con "Ir a pagar" o "Entra para pagar") sin señal de entrega.
  - `/checkout` exige sesión (`requireCustomer`); `CheckoutForm` (cliente, 342 líneas) tiene un
    `Select` de dirección, retiro o entrega por tienda y "Factura a mi nombre"; la elección vive
    en la URL (`features/checkout/lib/params.ts`: `direccion=` y `f-<slug>=delivery`) y cada
    cambio vuelve a cotizar. El pago lo pone la pasarela (`payCheckout`, `redirect_url` o
    `instructions`).
  - `CheckoutResult` muestra 4 estados simples con `PurchasePoller`; la línea de estados sólo
    existe en `PurchaseDetail` (`/cuenta/compras/[codigo]`).
- Restricciones: el frontend no calcula montos (todo total viene de la API, `lib/format.ts`);
  lecturas de `searchParams` y cookies dentro de `<Suspense>`; reglas `ui.md` (AA, 44 px, grillas
  con `grid-cols-[minmax(0,1fr)]` en móvil, `text-muted-foreground` fuera de `bg-muted`); compra
  sólo con cuenta; el formulario de pago conserva `quote_hash`, `idempotency_key` y sus estados de
  error (`quote_changed`, `email_unverified`, `billing_incomplete`, `too_many_attempts`).
- Archivos principales: `app/carrito/page.tsx`, `features/cart/{components/CartView.tsx,
  server/cart.ts,README.md}`, `features/checkout/{components/CheckoutForm.tsx,
  components/CheckoutResult.tsx,lib/params.ts,README.md}`,
  `features/purchases/{components/PurchaseDetail.tsx,lib/labels.ts,README.md}`,
  `e2e/{cart,checkout}.spec.ts`.
- Verificación: `<repo>/node_modules/.bin/tsc --noEmit -p <repo>/tsconfig.json`, `npx eslint
  <archivos>`, `npx vitest run <área>`; al cerrar el plan, `npx next build` y Playwright completo
  con el puerto 3000 libre.

## Fases

### [x] Fase 1 — El carrito lee la entrega elegida de la URL
- **Repo:** posven-ecommerce
- **Alcance:**
  - La lectura y escritura de `f-<slug>=delivery` sale de `features/checkout/lib/params.ts` a un
    módulo del carrito (`features/cart/lib/fulfillment.ts`), que el checkout reutiliza sin cambiar
    su URL.
  - `app/carrito/page.tsx` lee `searchParams` dentro del `<Suspense>` y pasa las tiendas con
    entrega a `CartView`.
  - `getCurrentCart` recibe esa elección y la manda a `getCart` o `quoteGuestCart`. `cache`
    compara por identidad: la clave es una cadena estable, no un arreglo. El contador de la
    cabecera sigue con su llamada sin elección.
  - "Ir a pagar" lleva la elección al checkout (`checkoutHref`), y "Entra para pagar" la
    conserva en `volver`.
  - Fichas de `features/cart` y `features/checkout`.
- **Archivos:** `features/cart/lib/fulfillment.ts` (nuevo), `features/checkout/lib/params.ts`,
  `features/cart/server/cart.ts`, `app/carrito/page.tsx`, `features/cart/README.md`
- **Terminado cuando:** tsc limpio y `npx vitest run features/cart features/checkout` en verde,
  con pruebas de la lectura de la elección y de que `/carrito?f-<slug>=delivery` pide el carrito
  con esa tienda.
- **Commit:** `feat(cart): el carrito lee la entrega elegida y la lleva al checkout (F3)`

### [ ] Fase 2 — Carrito agrupado con retiro o entrega y resumen
- **Repo:** posven-ecommerce
- **Alcance:** `P08`/`W08`: por tienda, selector Retiro o Entrega con la tarifa (enlaces que
  cambian la URL, funciona sin JS; sin tarifa, "Retiro sin costo"), líneas con cantidad, desglose
  de productos, entrega y total de la tienda. Resumen fijo en escritorio y barra inferior con el
  total e "Ir a pagar" en móvil. Se parte `CartView` en piezas; tests de componentes.
- **Terminado cuando:** vitest de `features/cart` en verde y `e2e/cart.spec.ts` sin regresiones.

### [ ] Fase 3 — [riesgo] Checkout de una página con el estilo del lienzo
- **Repo:** posven-ecommerce
- **Alcance:** `P09`/`W09` sin pasos: direcciones como tarjetas de radio (cambian `direccion=`),
  "Cómo recibes cada parte" por tienda, facturación y resumen fijo en escritorio, con barra de pago
  en móvil. Se parte `CheckoutForm` sin cambiar la acción, los campos ocultos ni los estados de
  error; tests de componentes.
- **Terminado cuando:** vitest de `features/checkout` en verde y `e2e/checkout.spec.ts` sin
  regresiones.

### [ ] Fase 4 — Línea de estados del pedido
- **Repo:** posven-ecommerce
- **Alcance:** `OrderTracker` (vertical en móvil, horizontal desde `md`) a partir de `status`,
  `fulfillment` y `timeline` del pedido: retiro (Pagado, Preparado, Listo para retirar,
  Entregado) y entrega (Pagado, Preparando, En camino, Entregado), y cancelado aparte.
  `PurchaseDetail` lo usa; textos en `lib/labels.ts`.
- **Terminado cuando:** vitest de `features/purchases` en verde.

### [ ] Fase 5 — Resultado del pago con seguimiento
- **Repo:** posven-ecommerce
- **Alcance:** `P10`/`W10`: pagado con tarjeta de confirmación (código y lo cobrado), un bloque por
  tienda con `OrderTracker` y código de retiro, "Ver mis compras" y "Seguir comprando"; fallido y
  vencido con el mismo estilo.
- **Terminado cuando:** vitest de `features/checkout` en verde.

### [ ] Fase 6 — Puerta: pago de prueba completo y revisión contra el lienzo
- **Repo:** posven-ecommerce
- **Alcance:** e2e de la compra completa en modo simulado eligiendo entrega en el carrito hasta el
  seguimiento; revisión a 375 y 1280 px contra el lienzo; ajustes menores; las diferencias
  mayores van a mejoras.
- **Terminado cuando:** `npx next build` pasa y Playwright completo en verde.

## Decisiones
- 2026-10-04 — Retiro o entrega se elige en el carrito y en el checkout; viaja por la URL.
- 2026-10-04 — Checkout en una sola página por secciones, sin el stepper del lienzo: hay tres
  controles y el pago lo pone la pasarela.
- 2026-10-04 — Compra como invitado fuera de F3.
- 2026-10-05 — Fase 1: `getCurrentCart(deliveryKey = "")` y `getSessionCart(deliveryKey = "")`
  reciben una cadena ordenada sin repetidos (`deliveryKey()` de `features/cart/lib/fulfillment.ts`);
  sin elección se llama `getSessionCart()` sin argumento para compartir `cache` con el contador.
  `CartView({ searchParams })` obligatorio; `CartContent` recibe `delivery?: string[]` y arma el
  enlace con `checkoutPathFor`. `features/checkout/lib/params.ts` reexporta
  `FULFILLMENT_PARAM_PREFIX` y conserva sus exports.

## Notas para la próxima sesión
- docs-check marca RANCIO `features/purchases/README.md` por `e2e/checkout.spec.ts`: la fase 4
  toca esa ficha y lo resuelve.
- F3a terminado y subido (carrito con `fulfillment`, `delivery_fee_*`, `total_*`; `getCart(ctx, deliveryStores)` y `quoteGuestCart(ctx, items, deliveryStores)`).

## Mejoras propuestas
- [ ] M-1 — Reflujar el comentario de `features/cart/server/cart.ts:18-21` a ~100 caracteres por
  línea. Repo posven-ecommerce · complejidad baja · modelo sonnet.
