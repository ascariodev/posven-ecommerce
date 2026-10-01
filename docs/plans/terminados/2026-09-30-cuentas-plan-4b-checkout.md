# Plan 4b de cuentas y compras: checkout, pago simulado y compras en el ecommerce

modo: completo

## Contexto

Segunda mitad de la fila 4 de la §8 de la spec cruzada
`posven/.claude/docs/specs/2026-09-29-cuentas-y-compras-design.md`, partida en 4a (carrito, hecho
en `feat/cuentas-carrito`) y 4b (este plan). Va contra el simulado: posveapi aún no tiene su plan
3 (ninguna ruta de checkout ni de compras).

El contrato sale de la §4 de la spec cruzada con la **enmienda aprobada el 2026-09-30**
(`docs/delivery/2026-09-30-enmienda-cuentas-y-compras-s4.md`, fuera de git), puntos F, G y H. Lo
que la enmienda no fija y este plan necesita va en "Huecos del contrato" y se declara en el
resultado; no se inventan campos.

Queda afuera: todo lo de posveapi (su plan 3), los correos, el reembolso real y los estados
`delivered`/`cancelled` producidos por la tienda (el simulado no los alcanza, salvo `cancelled`
cuando faltan todas las líneas), y el hallazgo sin JavaScript del 4a (sigue sin decidir).

## Spec

- Spec cruzada: §1; §2 (rutas `/checkout`, `/checkout/resultado?compra=<código>`, `/cuenta`,
  `/cuenta/compras`, `/cuenta/compras/[codigo]`, todas `noindex`, fuera del sitemap y dinámicas);
  §4.1 Quote, Purchase y StoreOrder; §4.2 filas `POST /checkout/quote`, `POST /checkout`,
  `GET /me/purchases?page`, `GET /me/purchases/{code}` y `DELETE /me` (409 `open_orders`); §5.3
  (checkout y pago, resultado cada 3 s); §5.5 (faltantes reembolsados, `pickup_code`); §5.8
  (eliminar se bloquea con pedidos abiertos y borra el carrito); §6 (API caída, 401, 403
  `email_unverified`, 409 `quote_changed`, 429, doble envío, fuera de radio, vacíos); §7 viñeta
  posven-ecommerce (e2e: registrar, verificar, carrito de invitado, entrar, fusionar, pagar, ver
  la compra y el código, reembolso de una línea faltante).
- Enmienda: F (pago `fake`, `pago-fallido@posven.test`, `pending_payment` en la primera consulta),
  G (filas de `POST /checkout/quote`, `POST /checkout` y `GET /me/purchases/{code}`;
  `idempotency_key`; `error.quote`), H (página de compras, `charge`, fechas, `StoreOrder.address`,
  línea de `StoreOrder`, Quote).
- Lecciones L-02 a L-05; reglas `.claude/rules/*.md`.

### Decisiones tomadas al planificar (quien coordina, 2026-09-30)

1. **Rama** `feat/cuentas-checkout` desde `feat/cuentas-carrito` (`b8d9345`).
2. **Checkout en una página**: `/checkout` muestra las tiendas del carrito con sus líneas, retiro o
   entrega por tienda, la dirección, los totales de la Quote y "Pagar".
3. **Dirección**: un selector con las direcciones guardadas, que arranca en la predeterminada;
   retiro o entrega por tienda; cualquier cambio vuelve a cotizar en el servidor. Sin direcciones,
   un enlace a `/cuenta/direcciones?volver=/checkout`, que muestra "Volver al checkout". El
   checkout no crea direcciones.
4. **El simulado avanza la compra por consultas** de `GET /me/purchases/{code}`: primera
   `pending_payment`; segunda `paid` (o `failed` para `pago-fallido@posven.test`); tercera y
   siguientes, los pedidos de retiro en `ready_for_pickup` con `pickup_code` y los de entrega en
   `out_for_delivery`. Un producto fijo (`alcohol-isopropilico-250-ml` en
   `farmacia-central-valencia`) sale faltante y reembolsado al pagarse. Sin rutas de prueba.
5. **Compras**: `/cuenta/compras` paginada de 10 en 10 (`?pagina=N`); `/cuenta/compras/[codigo]`
   con una tarjeta por tienda (estado, retiro o entrega, `pickup_code` destacado, dirección,
   líneas con "Faltante · reembolsado", subtotal, envío, reembolsado, fechas no nulas); "Últimas
   compras" (3) en `/cuenta` con "Ver todas"; "Mis compras" en el menú de la cuenta y en la
   navegación de `/cuenta`.
6. **Un solo plan** de 7 tareas, que cierra el e2e de §7.

### Huecos del contrato (se declaran en el resultado; a acordar con el plan 3 de posveapi)

- **Estado de los pedidos antes del pago**: `StoreOrder.status` no tiene un valor para una compra
  `pending_payment`, `failed` o `expired`. El simulado los deja en `accepted` y la UI **sólo
  muestra el estado del pedido si la compra está `paid`**.
- **Formato de `code` y de `pickup_code`**: la spec no los fija. El simulado usa `PV-` más 6
  caracteres `[A-Z0-9]` y 6 dígitos; la UI acepta en la URL `^[A-Za-z0-9-]{1,40}$` y si no, 404.
- **Envoltura del detalle**: §4.2 dice "Purchase" (como "Cart" y "Quote", sin `{ data }`); se lee
  sin envoltura.
- **Mensaje de `open_orders`**: el simulado usa "Tienes pedidos en curso. Podrás eliminar tu
  cuenta cuando se entreguen."; la UI muestra el mensaje de la API.
- **El listado no avanza el estado** en el simulado: sólo el detalle cuenta consultas.

## Restricciones globales

1. **El frontend no calcula montos**: muestra las cadenas de la Quote, la compra o el carrito con
   `formatUsd`/`formatVes`/`formatRate`. No suma el envío, no resta el reembolso. Comparar dos
   cadenas para marcar "Cambió" tras un `quote_changed` no es calcular. Sólo
   `lib/marketplace/mock/money.ts` suma y multiplica, en céntimos enteros (`contract.md` 1).
2. **El navegador nunca llama a posveapi**; la consulta cada 3 s es un `router.refresh()` que
   vuelve a pintar el Server Component.
3. **Contrato en `lib/marketplace/`**: esquemas zod en `schemas.ts`, tipos por `z.infer`,
   `client.ts` y `mock/adapter.ts` con las mismas firmas, cada respuesta simulada validada en
   `schemas.test.ts`.
4. **Nada de un comprador en `'use cache'`**; toda lectura de cookies o `searchParams` en un
   componente dentro de `<Suspense>` (`app-router.md` 2 y 3).
5. **Un archivo `"use server"` sólo exporta acciones de formulario**; lo que recibe un
   `AccountContext` vive en un módulo `server-only`.
6. **Interruptor del 4a** (`cartEnabled()`): apagado, `/checkout`, `/checkout/resultado` y
   `/cuenta/compras*` dan 404, y "Mis compras", "Últimas compras" e "Ir a pagar" no se pintan.
7. **Sesión**: `/checkout`, `/checkout/resultado` y `/cuenta/compras*` usan `requireCustomer(ruta)`
   (sin sesión, `/entrar?volver=`; sesión vencida, `/api/sesion/vencida`). Un 401 en una acción
   usa `withSession` o su patrón.
8. **shadcn es la base** (`ui.md`): tokens, foco por outline, 44 px en móvil, L-03 en lo que
   anime, L-04 si un `Select` vive en un formulario con `useActionState`; íconos de `lucide-react`.
9. **Rutas nuevas con `noindex`** y fuera del sitemap; `app/robots.ts` suma `/checkout`
   (`/cuenta` ya está).
10. **Textos que el e2e usa se conservan** (ficha, tienda, cabecera, cuenta y carrito). Los nuevos
    se fijan en cada tarea.
11. **Pruebas**: las existentes siguen pasando o se ajustan cuando el contrato nuevo lo exige (se
    reporta); nuevas, las que pide cada tarea (`tests.md` 6).
12. Commit por tarea con el `commit:` de su cabecera, en español, sin firma ni atribución de
    ningún tipo; autor `Sergio Carrillo <miele.web.developer@gmail.com>`. Push de la rama a `gitea`
    al terminar cada tarea; nunca a `main` ni a GitHub. Nunca `cd`. Sin `--no-verify`.

## Repos y ramas

Todo en `posven-ecommerce` (`<repo>` = `/home/user/posven-ecommerce` en la nube), rama
`feat/cuentas-checkout` desde `feat/cuentas-carrito` `b8d9345`. Remoto: `gitea`.

## Identificadores que estrena

- Esquemas: `fulfillmentSchema`, `deliveryUnavailableReasonSchema`, `quoteStoreSchema`,
  `quoteSchema`, `chargeSchema`, `checkoutQuoteInputSchema`, `checkoutInputSchema`,
  `checkoutStartSchema`, `purchaseStatusSchema`, `storeOrderStatusSchema`, `orderAddressSchema`,
  `storeOrderLineSchema`, `storeOrderSchema`, `purchaseSchema`, `purchasePageSchema`; códigos
  `email_unverified`, `quote_changed`, `cart_empty`, `open_orders`; `quote` opcional en
  `accountErrorBodySchema`; `MarketplaceAccountError.quote`.
- `client.ts`: `quoteCheckout(ctx, input)`, `startCheckout(ctx, input)`,
  `listPurchases(ctx, page)`, `getPurchase(ctx, code)`.
- `lib/marketplace/mock/checkout.ts` (cotización, checkout, compras y su avance); en
  `mock/fixtures.ts`, `delivery_radius_km`, `delivery_fee_usd`, `delivery_fee_ves` en `MockStore`,
  `MOCK_MISSING_LINE` y la cuenta sembrada `pago-fallido@posven.test`; `clearMockCart(id)` en
  `mock/cart.ts`.
- Módulo `features/checkout/`: `server.ts` (`readCheckoutParams`, `loadCheckout`), `actions.ts`
  (`payCheckout`), `checkoutState.ts`, `CheckoutView.tsx`, `CheckoutForm.tsx`,
  `CheckoutResult.tsx`, `PurchasePoller.tsx`, `README.md` (`RN-CHECKOUT-01` a `RN-CHECKOUT-04`).
- Módulo `features/purchases/`: `labels.ts`, `PurchaseList.tsx`, `PurchaseDetail.tsx`,
  `RecentPurchases.tsx`, `README.md` (`RN-PURCHASES-01` a `RN-PURCHASES-03`).
- Rutas `app/checkout/page.tsx`, `app/checkout/resultado/page.tsx`, `app/cuenta/compras/page.tsx`,
  `app/cuenta/compras/[codigo]/page.tsx`; `e2e/checkout.spec.ts`.

## Mapa de archivos

- Task 1 (≈6): `lib/marketplace/{schemas,errors,http,client}.ts`, `lib/marketplace/schemas.test.ts`,
  `lib/marketplace/http.test.ts`.
- Task 2 (≈8): `lib/marketplace/mock/{fixtures,checkout,cart,accounts,adapter}.ts`,
  `lib/marketplace/mock/checkout.test.ts`, `lib/marketplace/mock/accounts.test.ts` (o la prueba
  que cubra `deleteAccount`), `lib/marketplace/schemas.test.ts`.
- Task 3 (≈11): `features/checkout/{server,actions,checkoutState}.ts`,
  `features/checkout/{CheckoutView,CheckoutForm}.tsx` y sus pruebas, `app/checkout/page.tsx`,
  `features/cart/CartView.tsx` y su prueba ("Ir a pagar"), `app/cuenta/direcciones/page.tsx`
  ("Volver al checkout"), `app/robots.ts`.
- Task 4 (≈5): `app/checkout/resultado/page.tsx`, `features/checkout/{CheckoutResult,
  PurchasePoller}.tsx` y sus pruebas.
- Task 5 (≈12): `features/purchases/{labels.ts,PurchaseList,PurchaseDetail,RecentPurchases}.tsx`
  y sus pruebas, `app/cuenta/compras/page.tsx`, `app/cuenta/compras/[codigo]/page.tsx`,
  `app/cuenta/page.tsx`, `app/cuenta/layout.tsx`, `features/account/AccountDropdown.tsx`,
  `features/account/formState.ts` (`open_orders`) y las pruebas de cuenta que cambien.
- Task 6 (≈2): `e2e/checkout.spec.ts`, `.claude/rules/tests.md` 7.
- Task 7 (≈10): `features/{checkout,purchases}/README.md`, `features/{cart,account}/README.md`,
  `lib/marketplace/README.md`, `.claude/rules/{seo,app-router}.md`, `docs/CAPABILITIES.md`,
  `docs/plans/terminados/2026-09-30-cuentas-plan-4b-checkout-resultado.md`.

## Composición

- Task 1, contrato de checkout y compras (`opus`, `review: yes`).
- Task 2, simulado de checkout, pago y compras (`opus`, `review: yes`).
- Task 3, `/checkout` y "Pagar" (`opus`, `review: yes`): sesión, recotización, errores, acción.
- Task 4, `/checkout/resultado` (`sonnet`, `review: yes`).
- Task 5, compras y cuenta (`sonnet`, `review: yes`).
- Task 6, e2e de §7 (`sonnet`, `review: yes`).
- Task 7, cierre (`sonnet`): README, reglas, índice, verificación completa y resultado.

Costura: la Task 1 no toca `mock/` ni `features/`; la 2 no toca `features/` ni `app/`; la 3 no
toca el resultado ni las compras; la 4 no toca `/checkout` ni `/cuenta`; la 5 no toca
`features/checkout/`; la 6 sólo `e2e/` y su regla.

### Task 1: Contrato de checkout y compras

repo: posven-ecommerce
model: opus
mechanical: no
review: yes
commit: feat(checkout): contrato de cotización, checkout y compras

Lee antes `.claude/rules/{contract,tests}.md`, `lib/marketplace/README.md`, la spec cruzada §4 y
la enmienda F, G y H.

**Produce**

- `schemas.ts`:
  - `fulfillmentSchema`: `pickup` o `delivery`. `deliveryUnavailableReasonSchema`: `no_delivery`,
    `out_of_radius`, `no_address`.
  - `quoteStoreSchema`: `store_slug`, `fulfillment`, `delivery_available` (bool),
    `delivery_unavailable_reason` (el enum o nulo), `subtotal_usd`, `subtotal_ves`,
    `delivery_fee_usd`, `delivery_fee_ves`, `total_usd`, `total_ves` (`Money`).
  - `chargeSchema`: `{ currency: "VES" | "USD", amount: Money }`.
  - `quoteSchema`: `quote_hash` (cadena no vacía), `stores` (al menos 1), `total_usd`,
    `total_ves`, `charge`, `rate` (`rateSchema`).
  - `checkoutQuoteInputSchema`: `z.strictObject` con `stores: [{ store_slug (1 a
    CART_SLUG_MAX_LENGTH), fulfillment }]` (1 a `CART_MAX_LINES`, sin tiendas repetidas) y
    `address_id` (entero ≥ 1 o nulo). `checkoutInputSchema`: lo mismo más `quote_hash` (1 a 200
    caracteres) e `idempotency_key` (`z.uuid({ version: "v4" })`).
  - `checkoutStartSchema`: `{ purchase_code, payment: { provider, redirect_url (URL http/https o
    nulo), instructions (texto o nulo) } }` con un `refine`: exactamente uno de los dos no es
    nulo (enmienda F).
  - `purchaseStatusSchema`: `pending_payment`, `paid`, `expired`, `failed`.
    `storeOrderStatusSchema`: `accepted`, `ready_for_pickup`, `out_for_delivery`, `delivered`,
    `cancelled`.
  - `orderAddressSchema`: `{ label, recipient_name, phone, city: cityRefSchema, line, reference
    (nulo) }` (enmienda H: sin `id`, coordenadas ni `is_default`).
  - `storeOrderLineSchema`: `product` (la forma de la línea del carrito), `quantity`,
    `accepted_quantity` (entero ≥ 0), `unit_usd`, `unit_ves`, `line_usd`, `line_ves`, `missing`.
  - `storeOrderSchema`: `store` (`storeSummarySchema`), `status`, `fulfillment`, `pickup_code`
    (cadena o nulo), `address` (nulo en retiro), `lines` (al menos 1), `subtotal_usd`,
    `subtotal_ves`, `delivery_fee_usd`, `delivery_fee_ves`, `refunded_usd`, `refunded_ves`,
    `timeline: { paid_at, ready_at, dispatched_at, delivered_at, cancelled_at }` (fechas ISO con
    zona, `z.iso.datetime({ offset: true })`, o nulas).
  - `purchaseSchema`: `code`, `status`, `created_at`, `paid_at` (o nulo), `total_usd`,
    `total_ves`, `charge`, `rate`, `orders`. `purchasePageSchema`: `{ data, meta: pageMetaSchema }`.
  - `accountErrorCodeSchema` suma `email_unverified`, `quote_changed`, `cart_empty` y
    `open_orders`; `accountErrorBodySchema.error` suma `quote: quoteSchema.optional()`.
  - El producto de la línea del carrito se extrae a un esquema con nombre si hace falta para
    reutilizarlo en `storeOrderLineSchema`, sin cambiar su forma.
- `errors.ts`: `MarketplaceAccountError` suma `quote: Quote | null` (por defecto nulo).
- `http.ts`: `readAccountError` pasa `error.quote` al error.
- `client.ts` (sin `'use cache'`), con `accountRequest` y validación:
  - `quoteCheckout(ctx, input)` → `POST /checkout/quote` → `quoteSchema`.
  - `startCheckout(ctx, input)` → `POST /checkout` → `checkoutStartSchema` (201).
  - `listPurchases(ctx, page)` → `GET /me/purchases?page=N` → `purchasePageSchema`.
  - `getPurchase(ctx, code)` → `GET /me/purchases/{code}` (con `encodeURIComponent`) →
    `purchaseSchema`; un 404 sale como `MarketplaceAccountError` `not_found`, como las
    direcciones.
  - Las cuatro existen también en `mock/adapter.ts` con la misma firma: en esta tarea, un stub
    que lanza `MarketplaceUnavailableError` basta para que compile; la Task 2 las implementa.

**Tests**

- `schemas.test.ts`: una Quote, una compra `paid` con un pedido de retiro y otro de entrega, y
  una página de compras escritas a mano pasan sus esquemas; `checkoutStartSchema` rechaza los dos
  nulos y los dos no nulos; `checkoutInputSchema` rechaza una clave que no es UUID v4, tiendas
  repetidas y claves de más; un cuerpo de error `quote_changed` con `quote` se lee.
- `http.test.ts`: un 409 `quote_changed` produce `MarketplaceAccountError` con su `quote`.

**Verificación**: `tsc`, `eslint` sobre `lib/marketplace`, `vitest run lib/marketplace`, `next
build` en simulado sin `blocking-route`.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los archivos de esta tarea.

### Task 2: Simulado de checkout, pago y compras

repo: posven-ecommerce
model: opus
mechanical: no
review: yes
commit: feat(checkout): simulado de cotización, pago y compras

Lee antes `.claude/rules/{contract,tests}.md`, `lib/marketplace/mock/{cart,accounts,money}.ts`,
la spec cruzada §5.3, §5.5 y §5.8 y la enmienda F, G y H.

**Produce**

- `mock/fixtures.ts`:
  - `MockStore` suma `delivery_radius_km` y `delivery_fee_usd`/`delivery_fee_ves` (cadenas,
    internos, no contrato): `farmacia-central-valencia` 5 km y `1.50`/`54.75`;
    `farmacia-altamira` 5 km y `2.00`/`73.00`; el resto sin reparto.
  - `MOCK_MISSING_LINE = { store_slug: "farmacia-central-valencia", product_slug:
    "alcohol-isopropilico-250-ml" }`.
  - `MOCK_ACCOUNT_SEED` suma dos cuentas verificadas con contraseña `clave-segura-3`, propias del
    e2e de checkout (los archivos del e2e corren en paralelo y `account.spec.ts` cambia la
    dirección predeterminada de `comprador@posven.test`): `pago-fallido@posven.test`, sin
    direcciones, y `entrega@posven.test`, con una dirección predeterminada a menos de 5 km de
    `farmacia-central-valencia` y a más de 5 km de `farmacia-altamira`.
- `mock/checkout.ts`, estado en `globalThis` (`Symbol.for("posven.mockPurchases")`):
  - **Cotización** desde el carrito del comprador (`mock/cart.ts`): sólo las tiendas pedidas con
    líneas `ok`; ninguna → `cart_empty`. `delivery` sin `address_id`, o con una dirección que no
    es del comprador → `validation_failed` con "Elige una dirección de entrega." en `address_id`.
    Entrega disponible si la tienda la ofrece, hay dirección y la distancia haversine (dirección
    a `latitude`/`longitude` de la tienda) es ≤ `delivery_radius_km`; si no, `fulfillment:
    "pickup"`, `delivery_available: false` y el motivo (`no_delivery`, `no_address`,
    `out_of_radius`, en ese orden). Envío `0.00` en retiro. Totales por tienda y de la compra con
    `money.ts`; `charge = { currency: "VES", amount: total_ves }`. `quote_hash`: `sha256` del JSON
    de la Quote sin el hash (`node:crypto`).
  - **Checkout**: sesión; correo sin verificar → 403 `email_unverified`; `idempotency_key` ya
    vista para ese comprador → la misma respuesta 201; recotiza y, si el hash no coincide, 409
    `quote_changed` con `quote`; crea la compra `pending_payment` (`code` `PV-` + 6 `[A-Z0-9]`,
    `created_at` ahora en ISO con zona), un pedido por tienda con las líneas `ok` del carrito
    (`unit_*` = precio, `accepted_quantity` = cantidad, `missing: false`), la dirección copiada
    sin `id` ni coordenadas en entrega; responde `payment: { provider: "fake", redirect_url:
    `${SITE_URL}/checkout/resultado?compra=<code>`, instructions: null }` (`lib/site.ts`).
  - **Avance por consultas del detalle** (decisión 4): la primera `pending_payment`; la segunda
    `paid` (con `paid_at` y `timeline.paid_at`) o `failed` si el correo es
    `pago-fallido@posven.test`; al pasar a `paid` se quitan del carrito las líneas compradas
    (§5.3.4) y la línea `MOCK_MISSING_LINE`, si está, queda `missing: true`,
    `accepted_quantity: 0`, con su importe en `refunded_*` del pedido; un pedido con todas sus
    líneas faltantes pasa a `cancelled` con `cancelled_at`. Desde la tercera, retiro →
    `ready_for_pickup` con `pickup_code` (6 dígitos) y `ready_at`; entrega → `out_for_delivery`
    con `dispatched_at`. `failed` no avanza. El listado no cuenta consultas.
  - **Listado**: más recientes primero, 10 por página, `meta { page, per_page: 10, total }`;
    una página vacía fuera de rango. **Detalle** de otro comprador o inexistente → 404
    `not_found`.
  - `hasOpenOrders(customerId)`: algún pedido de una compra `paid` en `accepted`,
    `ready_for_pickup` u `out_for_delivery`. `resetMockPurchases()` para las pruebas.
- `mock/cart.ts`: exporta `clearMockCart(customerId)` y lo que el checkout necesite leer del
  carrito (sin duplicar la cotización).
- `mock/accounts.ts`: `deleteAccount(ctx, input, beforeDelete?)` llama a `beforeDelete(id)` tras
  validar la contraseña y antes de borrar; mensajes de `email_unverified`, `quote_changed`,
  `cart_empty` (los de la enmienda G) y `open_orders` ("Tienes pedidos en curso. Podrás eliminar
  tu cuenta cuando se entreguen.").
- `mock/adapter.ts`: las cuatro funciones de la Task 1; `deleteAccount` pasa un `beforeDelete`
  que lanza 409 `open_orders` si `hasOpenOrders` y, tras borrar, `clearMockCart` (§5.8; las
  compras se conservan). Sin imports circulares entre `accounts.ts`, `cart.ts` y `checkout.ts`.

**Tests** (`mock/checkout.test.ts`, y la de cuentas para el borrado)

- Cotización: retiro con envío `0.00`; entrega dentro de radio con su envío (`entrega@posven.test`
  y `farmacia-central-valencia`); fuera de radio (`farmacia-altamira`), tienda sin reparto y sin
  dirección, con su motivo; `delivery` sin `address_id` →
  `validation_failed`; carrito sin líneas `ok` → `cart_empty`; totales exactos en cadenas.
- Checkout: correo sin verificar → 403; hash viejo → 409 con `quote`; misma
  `idempotency_key` → misma compra, una sola en el listado.
- Avance: `pending_payment`, `paid` con la línea faltante reembolsada y el carrito sin las líneas
  compradas, `ready_for_pickup` con `pickup_code`; `pago-fallido@posven.test` → `failed` y el
  carrito intacto; todas faltantes → `cancelled`.
- Listado paginado (11 compras → 10 y 1) y 404 de otro comprador.
- Borrado: con un pedido abierto → 409 `open_orders` y la cuenta sigue; sin pedidos abiertos →
  se borra y el carrito también.
- `schemas.test.ts`: cada respuesta simulada nueva pasa su esquema.

**Verificación**: `tsc`, `eslint` sobre `lib/marketplace`, `vitest run lib/marketplace` y luego
entero, `next build` en simulado sin `blocking-route`.

**Terminada cuando** lo anterior pasa, ningún archivo fuera de `mock/money.ts` suma o multiplica
montos, y el commit contiene sólo los archivos de esta tarea.

### Task 3: `/checkout` y "Pagar"

repo: posven-ecommerce
model: opus
mechanical: no
review: yes
commit: feat(checkout): página de checkout con recotización y pago

Lee antes `.claude/rules/{app-router,ui,seo,tests}.md`, `features/cart/{server.ts,actions.ts,
CartView.tsx}`, `features/account/{session,accountActions,formState}.ts`, L-02 a L-05 y la
spec cruzada §5.3 y §6. Esta versión de Next difiere de tu entrenamiento: lee en
`node_modules/next/dist/docs/` las guías de `searchParams`, Server Actions, `redirect` (URL
absoluta) y lo que dice de `crypto.randomUUID()` en un render con `cacheComponents`.

**Produce**

- `app/checkout/page.tsx`: `title: "Pagar"`, `noindex`; `notFound()` con el carrito apagado;
  `<Suspense>` con esqueleto alrededor de `CheckoutView`; `h1` "Pagar".
- `features/checkout/server.ts` (`server-only`):
  - `readCheckoutParams(searchParams)`: `direccion` (entero) y, por tienda, `f-<store_slug>` =
    `pickup` | `delivery`; lo inválido se ignora.
  - `loadCheckout(ctx, params)`: `getCart`; tiendas con líneas `ok` (sin líneas → estado vacío);
    `listAddresses`; dirección = la pedida si es del comprador, si no la predeterminada, si no la
    primera, si no nula; sin dirección, todas las tiendas en `pickup`; `quoteCheckout`.
    `cart_empty` → estado vacío; `validation_failed` en `address_id` → recotiza sin dirección.
- `CheckoutView.tsx` (Server Component): `requireCustomer("/checkout")`, `loadCheckout`, genera la
  `idempotency_key` (UUID v4) y pinta:
  - vacío: "Tu carrito no tiene productos disponibles." con "Volver al carrito" (`/carrito`);
  - correo sin verificar: aviso "Verifica tu correo para comprar." con `ResendVerificationForm`, y
    sin botón "Pagar";
  - `CheckoutForm`.
- `CheckoutForm.tsx` (cliente):
  - Un formulario GET a `/checkout` con el `Select` de direcciones (`name="direccion"`, "Dirección
    de entrega") y, por tienda, un `RadioGroup` "Retiro en tienda" / "Entrega a domicilio"
    (`name="f-<slug>"`); "Entrega a domicilio" deshabilitado si `delivery_available` es falso, con
    el motivo: "Esta tienda no hace entregas." (`no_delivery`), "Tu dirección está fuera de su zona
    de entrega." (`out_of_radius`), "Agrega una dirección para pedir entrega." (`no_address`, con
    el enlace "Agregar dirección" a `/cuenta/direcciones?volver=/checkout`). Un cambio de
    dirección o de entrega navega con `router.replace(<url con los parámetros>, { scroll: false })`
    dentro de `useTransition`, con "Actualizando…" en `role="status"` mientras dura, y
    deshabilita "Pagar" hasta que llega la Quote nueva. Sin botón "Actualizar": sin JavaScript el
    checkout no se ve (hallazgo del 4a).
  - Por tienda: nombre, "Cerrada ahora" si `is_open` es falso, sus líneas `ok` del carrito
    (nombre, cantidad, `line_usd`), subtotal, envío (si es entrega) y total de la Quote.
  - Resumen: total USD, total Bs, "Se cobrará Bs X" (`charge`) y la tasa.
  - El formulario de pago (`useActionState(payCheckout)`) con campos ocultos `address_id`,
    `f-<slug>` de la Quote, `quote_hash` e `idempotency_key`, y el botón "Pagar Bs X" ("Pagando…"
    pendiente).
  - Estado de la acción: `quote_changed` → aviso "Tu compra cambió. Revisa los precios y la
    entrega." y la Quote nueva reemplaza a la vieja (también su `quote_hash`), con "Cambió" en
    cada tienda cuyo `total_usd` o `fulfillment` difiere; `email_unverified` → el aviso de arriba;
    `cart_empty` → el vacío; otro error → su mensaje en `role="alert"`; `instructions` → el texto
    y "Ver el estado de tu compra" a `/checkout/resultado?compra=<code>`.
- `features/checkout/checkoutState.ts`: tipo `CheckoutState` e inicial.
- `features/checkout/actions.ts` (`"use server"`, sólo `payCheckout`): carrito apagado → inicial;
  lee y valida con `checkoutInputSchema` (inválido → "No pudimos iniciar el pago. Intenta de
  nuevo."); `startCheckout`; éxito con `redirect_url` → `redirect(redirect_url)`; con
  `instructions` → estado `instructions`; 401 → borra la sesión y lleva a
  `/entrar?volver=/checkout`; `MarketplaceUnavailableError` → el aviso genérico (§6: en un
  formulario, aviso en el formulario); 429 → "Demasiados intentos. Prueba de nuevo en N
  segundos."; `quote_changed`, `email_unverified`, `cart_empty` → sus estados.
- `features/cart/CartView.tsx`: en el resumen, con `line_count > 0`, "Ir a pagar" (enlace a
  `/checkout`) con sesión, o "Entra para pagar" (`/entrar?volver=/checkout`) sin ella;
  `CartContent` recibe `signedIn`.
- `app/cuenta/direcciones/page.tsx`: con `?volver=/checkout` (validado con `returnPath.ts`),
  "Volver al checkout" arriba de la lista.
- `app/robots.ts`: suma `/checkout`.

**Tests**

- `server.test.ts`: `readCheckoutParams` ignora lo inválido; `loadCheckout` elige la dirección
  pedida, la predeterminada o ninguna, y pide retiro para todas sin dirección.
- `actions.test.ts`: redirige a `redirect_url`; `quote_changed` devuelve la Quote nueva; 403,
  `cart_empty`, 429 con segundos, API caída, 401 (borra la sesión); entrada inválida no llama a
  la API; carrito apagado no hace nada.
- `CheckoutForm.test.tsx`: muestra las cadenas de la Quote sin calcular (montos que no salen de
  sumar); "Entrega a domicilio" deshabilitada con cada motivo; "Cambió" sólo en la tienda que
  cambió; campos ocultos con el `quote_hash` vigente.
- `CartView.test.tsx`: "Ir a pagar" con sesión, "Entra para pagar" sin ella, nada con
  `line_count` 0.

**Verificación**: `tsc`, `eslint` sobre `app`, `features`, `lib`; `vitest run features/checkout
features/cart features/account` y luego entero; `next build` en simulado sin `blocking-route` y
`/checkout` en `◐`.

**Terminada cuando** lo anterior pasa, la página no calcula montos y el commit contiene sólo los
archivos de esta tarea.

### Task 4: `/checkout/resultado`

repo: posven-ecommerce
model: sonnet
mechanical: no
review: yes
commit: feat(checkout): resultado del pago con consulta cada 3 segundos

Lee antes `.claude/rules/{app-router,ui,tests}.md`, la spec cruzada §5.3 paso 6 y la guía de
`useRouter().refresh()` en `node_modules/next/dist/docs/`.

**Produce**

- `app/checkout/resultado/page.tsx`: `title: "Resultado del pago"`, `noindex`; `notFound()` con el
  carrito apagado o `compra` ausente o fuera de `^[A-Za-z0-9-]{1,40}$`; `<Suspense>` con esqueleto.
- `CheckoutResult.tsx` (Server Component): `requireCustomer` con la ruta y su `compra`;
  `getPurchase`; `not_found` → `notFound()`. Por estado:
  - `pending_payment`: `h1` "Estamos confirmando tu pago" y `PurchasePoller`;
  - `paid`: `h1` "¡Pago confirmado!", código de la compra, total y "Ver tu compra"
    (`/cuenta/compras/<code>`, `prefetch={false}`);
  - `failed`: `h1` "El pago no se completó", "Tu carrito sigue igual." y "Volver al carrito";
  - `expired`: `h1` "La compra venció sin pago" y "Volver al carrito".
- `PurchasePoller.tsx` (cliente): `router.refresh()` cada 3 s mientras está montado (sólo se pinta
  en `pending_payment`); limpia el intervalo al desmontar; texto `role="status"` "Consultando el
  estado…"; enlace "Consultar de nuevo" (misma URL) para quien no tenga JavaScript.

**Tests**: `CheckoutResult.test.tsx` con `render(await CheckoutResult(props))`: los cuatro estados
con sus textos y enlaces, el poller sólo en `pending_payment`, 404 con `not_found`;
`PurchasePoller.test.tsx` con temporizadores falsos: refresca a los 3 s y deja de hacerlo al
desmontar.

**Verificación**: `tsc`, `eslint`, `vitest run features/checkout` y luego entero, `next build` en
simulado sin `blocking-route`.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los archivos de esta tarea.

### Task 5: Compras y cuenta

repo: posven-ecommerce
model: sonnet
mechanical: no
review: yes
commit: feat(compras): historial, detalle de compra y últimas compras en la cuenta

Lee antes `.claude/rules/{app-router,ui,seo,tests}.md`, `app/cuenta/*`,
`features/account/{AccountDropdown.tsx,AccountMenu.tsx,formState.ts}`, L-05 y la spec cruzada §4.1 y
§5.5.

**Produce**

- `features/purchases/labels.ts`: textos de estado de compra ("Pago pendiente", "Pagada",
  "Vencida", "Pago fallido"), de pedido ("Aceptado", "Listo para retirar", "En camino",
  "Entregado", "Cancelado") y de entrega ("Retiro en tienda", "Entrega a domicilio"), y el formato
  de fecha (`Intl.DateTimeFormat("es-VE")`, zona `America/Caracas`).
- `PurchaseList.tsx`: filas con código, fecha, estado (`Badge`), total USD y Bs y "N tiendas",
  cada una enlazada a su detalle; vacío "Todavía no tienes compras." con "Buscar productos";
  paginación "Anteriores" / "Siguientes" (`?pagina=N`) desde `meta`.
- `PurchaseDetail.tsx`: cabecera con código, fecha, estado, total y cobro (`charge`); una tarjeta
  por pedido con tienda, entrega, estado del pedido (sólo con la compra `paid`, hueco del
  contrato), `pickup_code` destacado ("Código de retiro") cuando no es nulo, dirección en entrega,
  líneas (cantidad, `line_usd`; faltante con "Faltante · reembolsado"), subtotal, envío (en
  entrega), reembolsado (si no es `0.00`) y las fechas no nulas de `timeline`.
- `RecentPurchases.tsx`: las 3 primeras de la página 1 y "Ver todas" (`/cuenta/compras`); sin
  compras, no se pinta.
- `app/cuenta/compras/page.tsx` (`title: "Mis compras"`) y `app/cuenta/compras/[codigo]/page.tsx`
  (`title: "Compra <código>"` sin datos de la API en los metadatos): `notFound()` con el carrito
  apagado, código inválido o `not_found`; `?pagina` inválida → 1; fuera de rango con compras →
  `notFound()`; `<Suspense>` con esqueleto.
- `app/cuenta/page.tsx`: bloque "Últimas compras" (en su `<Suspense>`) y atajo "Mis compras" con el
  carrito encendido. `app/cuenta/layout.tsx` y `AccountDropdown.tsx`: "Mis compras" tras
  "Resumen", con el carrito encendido.
- `features/account/formState.ts`: `open_orders` muestra el mensaje de la API en el formulario de
  eliminar cuenta.

**Tests**: `PurchaseList.test.tsx` (filas, vacío, paginación en la primera y la última página);
`PurchaseDetail.test.tsx` (código de retiro, faltante reembolsado, dirección en entrega, estado
del pedido oculto si no está `paid`, montos sin calcular); `RecentPurchases.test.tsx` (3 y "Ver
todas", nada sin compras); la prueba del menú de cuenta ("Mis compras" con el carrito encendido y
no apagado); `formState` o `accountActions` con `open_orders`.

**Verificación**: `tsc`, `eslint`, `vitest run features/purchases features/account` y luego
entero, `next build` en simulado sin `blocking-route`, rutas nuevas en `◐`.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los archivos de esta tarea.

### Task 6: e2e de §7

repo: posven-ecommerce
model: sonnet
mechanical: no
review: yes
commit: test(checkout): e2e de compra, resultado, código de retiro y reembolso

Lee antes `.claude/rules/tests.md`, `e2e/{account,cart}.spec.ts` y la decisión 4.

**Produce** `e2e/checkout.spec.ts`, en serie:

1. **Compra completa** (comprador nuevo en cada corrida): como invitado agrega acetaminofén 500 mg
   y alcohol isopropílico de Farmacia Central; se registra (fusión); verifica con
   `/verificar/verificacion-simulada`; en `/carrito` "Ir a pagar"; en `/checkout` deja retiro y
   paga; en `/checkout/resultado` ve "Estamos confirmando tu pago" y luego "¡Pago confirmado!";
   "Ver tu compra" muestra "Código de retiro" (recargando hasta que aparezca, con `toPass`) y el
   alcohol con "Faltante · reembolsado"; `/cuenta` muestra la compra en "Últimas compras"; el
   contador vuelve a "Carrito"; eliminar la cuenta responde el mensaje de `open_orders`.
2. **Sin verificar**: un comprador nuevo sin verificar ve "Verifica tu correo para comprar." y no
   ve "Pagar".
3. **Entrega**: `entrega@posven.test` con su dirección sembrada elige "Entrega a domicilio" en
   Farmacia Central y la Quote muestra el envío; Abasto La Esquina muestra "Esta tienda no hace
   entregas." (no paga).
4. **Pago fallido**: `pago-fallido@posven.test` agrega un producto, paga y ve "El pago no se
   completó" y su carrito intacto.
5. `/checkout` y `/checkout/resultado` llevan `noindex`; robots excluye `/checkout`.

`.claude/rules/tests.md` 7 suma `e2e/checkout.spec.ts` al e2e de cierre (en serie).

**Verificación**: `playwright test` entero en simulado dos veces seguidas contra el mismo
servidor (repetible con el estado acumulado); `/checkout` sin desbordamiento horizontal en
Pixel 7.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los archivos de esta tarea.

### Task 7: Cierre

repo: posven-ecommerce
model: sonnet
mechanical: no
commit: docs(checkout): cierre del plan 4b de cuentas y compras

**Produce**

- `features/checkout/README.md` con `RN-CHECKOUT-01` (sesión y correo verificado),
  `RN-CHECKOUT-02` (recotización y `quote_changed`), `RN-CHECKOUT-03` (`idempotency_key` por
  página), `RN-CHECKOUT-04` (resultado cada 3 s hasta un estado final);
  `features/purchases/README.md` con `RN-PURCHASES-01` (paginación), `RN-PURCHASES-02`
  (`pickup_code` y faltantes), `RN-PURCHASES-03` (estado del pedido sólo con la compra pagada).
- READMEs de `features/cart` ("Ir a pagar"), `features/account` (`open_orders`, "Mis compras") y
  `lib/marketplace` (contrato nuevo, simulado por consultas, huecos del contrato).
- Reglas `seo.md` (rutas nuevas `noindex` y robots) y `app-router.md` si cambia algo.
- `docs/CAPABILITIES.md` regenerado con `gen-capabilities.mjs` **después de añadir los README a
  git** (lección del cierre del 4a), validado contra un commit anterior.
- `docs/plans/terminados/2026-09-30-cuentas-plan-4b-checkout-resultado.md`: hecho, diferencias contra el
  plan, huecos del contrato, verificación con salidas reales, deuda, pasos de deploy y cómo
  continuar.

**Verificación**: `tsc`, `eslint` sobre `app`, `features`, `components`, `lib`, `e2e`; `vitest
run` entero; `next build` en simulado; standalone con 200 en `/checkout` (redirige sin sesión) y
`/cuenta/compras`; `playwright test` entero.

**Terminada cuando** todo lo anterior pasa, se reporta con salidas reales y el commit contiene
sólo los archivos de esta tarea.
