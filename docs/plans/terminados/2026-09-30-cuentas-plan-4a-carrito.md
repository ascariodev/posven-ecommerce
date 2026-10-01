# Plan 4a de cuentas y compras: carrito del comprador en el ecommerce

modo: completo

## Contexto

Fila 4 de la §8 de la spec cruzada
`posven/.claude/docs/specs/2026-09-29-cuentas-y-compras-design.md` ("carrito, checkout,
resultado y compras contra el simulado, luego contra la API"), partida en dos por decisión de
quien coordina: este plan 4a hace el carrito; el 4b, checkout, pago, resultado y compras. Los dos
van contra el simulado: posveapi aún no tiene su plan 3 (ninguna ruta de carrito ni de pedidos en
`pharmacies` ni en `feat/marketplace-cuentas`).

El contrato del carrito sale de la §4 de la spec cruzada con la **enmienda aprobada el
2026-09-30** (`docs/delivery/2026-09-30-enmienda-cuentas-y-compras-s4.md` en este repo, fuera de
git; pendiente de aplicar en `posven`), incluidas sus precisiones J y K, añadidas tras la revisión
de este plan. **Este plan no se ejecuta hasta que la enmienda esté aplicada en `posven`**
(`contract.md` 4: el campo nuevo de su punto A entra antes en la spec del rasgo §3).

Revisión del plan: `docs/plans/terminados/2026-09-30-cuentas-plan-4a-carrito-plan-review.md`.

Queda afuera (plan 4b): `/checkout`, `/checkout/resultado`, Quote, pago simulado, compras,
`/cuenta/compras`, "Últimas compras" de `/cuenta`, "Mis compras" en el menú de cuenta, el 403
`email_unverified`, el 409 `quote_changed`, el 422 `cart_empty` y el 409 `open_orders` de
`DELETE /me`. También queda afuera todo lo de posveapi (su plan 3).

## Spec

- Spec cruzada: §1 decisiones 9 y 13; §2 (ruta `/carrito`, cookie `mp_cart`, contador de la
  cabecera en su `<Suspense>`, el ecommerce no calcula montos); §4 (cuerpo de error); §4.1 Cart;
  §4.2 filas `POST /cart/quote`, `GET /me/cart`, `PUT /me/cart/items` y `POST /me/cart/merge`;
  §5.2; §6 filas "API caída", 401, 422, 429, "`mp_cart` inválida" y vacíos; §7 viñeta
  posven-ecommerce (cookie `httpOnly`, borrado ante 401, fusión, `noindex` y fuera del sitemap,
  carrito de invitado, entrar, fusionar).
- Enmienda: A (`accepts_orders` en `StoreSummary`), B (sin `price_changed`), C (`availability`
  nula y `unavailable_reason`), D (totales sólo de líneas `ok`, carrito vacío, `line_count`,
  `is_open`, `rate`, producto de la línea), E (`recipe` y `controlled` no se agregan), G (filas de
  `PUT /me/cart/items`, `POST /cart/quote` y `POST /me/cart/merge`), H (entrada de
  `quote`/`merge`), I (§5.2, §6), J (`quantity: 0` borra siempre) y K (fusión con techo de 20
  líneas).
- Lecciones L-02 (la cabecera degrada) y L-03; reglas `.claude/rules/*.md`.

### Decisiones tomadas al planificar (quien coordina, 2026-09-30)

1. **Rama desde el plan 5 de shadcn**: `feat/cuentas-carrito` sale de
   `feat/ui-shadcn-mercado-cabecera` (`77ca74e`).
2. **Plan 4 partido en 4a (carrito) y 4b (checkout y compras)**; 4b sale de 4a.
3. **Interruptor de entorno**: el carrito sólo existe si `MARKETPLACE_CART_ENABLED=1` o si el
   modo es simulado, con la misma regla que `usesMock()` de `client.ts` (`MARKETPLACE_MODE`
   ausente o `"mock"`). Apagado: sin botón "Agregar", sin contador, `/carrito` da 404 y el login no
   fusiona. `accepts_orders` se lee opcional (ausente = `false`) mientras posveapi no lo envíe.
   Así la rama puede llegar a `main` sin romper producción; se enciende al desplegar el plan 3 de
   posveapi.
4. **"Agregar" en la ficha y en la tienda**: un botón en cada fila de oferta de la ficha
   (normales, destacadas y "Fuera de tu zona") y en cada producto de `/tienda/[slug]`, sólo si la
   tienda tiene `accepts_orders` y el producto `restriction: "none"`.
5. **Agregar suma 1 y se queda**: Server Action con formulario (funciona sin JavaScript); el botón
   pasa a "Agregado" con "Ver carrito", y el contador se actualiza. La cantidad se ajusta en
   `/carrito`.
6. **El simulado calcula los montos del carrito en céntimos enteros**: se amplía la excepción de
   `contract.md` 1 sólo para `lib/marketplace/mock/` (módulo `money.ts`); la UI sigue sin calcular.

## Restricciones globales

1. **El frontend no calcula montos**: muestra las cadenas de la API o del simulado con
   `formatUsd`/`formatVes`/`formatRate`. No suma, no multiplica, no filtra líneas para sumar. El
   contador muestra `line_count` (usuario) o el número de entradas de `mp_cart` (invitado),
   **sin llamar a la API** para el invitado: contar entradas no es un monto.
2. **El navegador nunca llama a posveapi**: todo pasa por Server Actions y Server Components con
   la clave de servidor (`client.ts`).
3. **Contrato en `lib/marketplace/`**: esquemas zod en `schemas.ts` con tipos por `z.infer`;
   `client.ts` y `mock/adapter.ts` con las mismas firmas; `schemas.test.ts` valida cada respuesta
   simulada (`contract.md`).
4. **Nada de un comprador en `'use cache'`**: carrito, sesión y `mp_cart` se leen dentro de
   `<Suspense>` (`app-router.md` 2 y 3). Las páginas cacheadas (ficha, tienda) sólo pasan slugs
   al botón; la acción lee la cookie.
5. **Un archivo `"use server"` sólo exporta acciones que un formulario puede llamar**: todo
   export suyo es un endpoint público. Lo que recibe un `AccountContext` u otro dato de confianza
   vive en un módulo `server-only` sin `"use server"`, como `features/account/session.ts`.
6. **L-02**: el contador vive en el layout raíz y degrada ante `MarketplaceUnavailableError` y
   `MarketplaceAccountError` (429 del límite global incluido), como `AccountSlot`, sin tumbar la
   página.
7. **shadcn es la base** (`ui.md`): tokens, foco por outline en `--foreground`, 44 px en móvil,
   L-03 en lo que anime; íconos de `lucide-react`.
8. **Rutas nuevas con `noindex`** y fuera del sitemap; `app/robots.ts` excluye `/carrito`
   (`seo.md` 3 y 8).
9. **Cookie `mp_cart`**: JSON de `[{ store_slug, product_slug, quantity }]`, sin precios,
   `httpOnly`, `SameSite=Lax`, `Path=/`, `Secure` en producción, 30 días; hasta 20 líneas,
   cantidades de 1 a 99, slugs de hasta 120 caracteres, sin claves de más ni entradas repetidas
   (misma tienda y producto); el valor codificado (Next lo pasa por `encodeURIComponent`) no pasa
   de 3800 bytes. Un valor inválido se ignora y se reescribe o borra en la siguiente escritura:
   un Server Component no puede borrar cookies (desviación de §6 "se ignora y se borra", declarada
   en el resultado).
10. **Textos que el e2e usa se conservan** (los de ficha, tienda, cabecera y cuenta de los planes
    anteriores). Los nuevos se fijan en cada tarea.
11. **Pruebas**: las existentes siguen pasando o se ajustan cuando el contrato nuevo lo exige
    (se reporta); nuevas, las que pide cada tarea.
12. Commit por tarea con el `commit:` de su cabecera, en español, sin firma ni atribución de
    ningún tipo; autor `Sergio Carrillo <miele.web.developer@gmail.com>`. Push de la rama a
    `gitea` al terminar cada tarea; nunca a `main` ni a GitHub. Nunca `cd`. Sin `--no-verify`.

## Repos y ramas

Todo en `posven-ecommerce` (`<repo>` = `/home/user/posven-ecommerce` en la nube), rama
`feat/cuentas-carrito` desde `feat/ui-shadcn-mercado-cabecera` `77ca74e`. Remoto: `gitea`.

## Identificadores que estrena

- Esquemas: `accepts_orders` en `storeSummarySchema`; `cartItemSchema`, `cartItemsSchema`,
  `cartLineSchema`, `cartStoreSchema`, `cartSchema`, `unavailableReasonSchema`; códigos de error
  `not_orderable`, `product_restricted`, `cart_full`.
- `client.ts`: `quoteGuestCart(ctx, items)`, `getCart(ctx)`, `setCartItem(ctx, item)`,
  `mergeCart(ctx, items)`.
- `lib/marketplace/mock/{money,cart}.ts`; `customerIdFor(ctx)` exportado de `mock/accounts.ts`.
- Módulo `features/cart/`: `flag.ts` (`cartEnabled()`), `cookie.ts` (`CART_COOKIE`,
  `parseCartCookie`, `serializeCart`, `cartCookieOptions`, `readGuestCart`), `server.ts`
  (`getCurrentCart`, `mergeGuestCart`), `actions.ts` (`addToCart`, `setQuantity`, `removeLine`),
  `AddToCartButton`, `CartLink`/`CartLinkSkeleton`, `CartView`, `README.md` (`RN-CART-01` a
  `RN-CART-04`).
- Ruta `app/carrito/page.tsx`; `e2e/cart.spec.ts`.

## Mapa de archivos

- Task 1 (≈9): `lib/marketplace/schemas.ts` (sólo `accepts_orders`),
  `lib/marketplace/mock/fixtures.ts`, `lib/marketplace/schemas.test.ts`, y las pruebas que arman un `StoreSummary` a mano:
  `features/events/ContactButtons.test.tsx`, `features/store/{StoreProducts,NearbyStores,
  StoreCard}.test.tsx`, `features/store/jsonld.test.ts`, `features/product/ProductOffers.test.tsx`.
- Task 2 (≈10): `lib/marketplace/{schemas,client}.ts`, `lib/marketplace/mock/{fixtures,adapter,
  accounts,money,cart}.ts`, `lib/marketplace/mock/{money,cart}.test.ts`,
  `lib/marketplace/schemas.test.ts`, `.claude/rules/contract.md`.
- Task 3 (≈8): `features/cart/{flag,cookie,server,actions}.ts` y sus pruebas,
  `features/account/actions.ts` (fusión al entrar y al registrarse) y su prueba.
- Task 4 (≈7): `features/cart/AddToCartButton.tsx` y su prueba, `features/product/OfferCard.tsx`,
  `features/store/StoreProducts.tsx`, `app/p/[slug]/page.tsx` (textos de restringidos) y las
  pruebas de ficha y tienda que cambien.
- Task 5 (≈8): `app/carrito/page.tsx`, `features/cart/{CartView,CartLink}.tsx` y sus pruebas,
  `app/layout.tsx`, `app/robots.ts`, `e2e/cart.spec.ts`.
- Task 6 (≈10): `features/cart/README.md`, `lib/marketplace/README.md`,
  `features/{product,store,account}/README.md`, `.claude/rules/{seo,tests,app-router}.md`,
  `docs/CAPABILITIES.md`, `docs/plans/terminados/2026-09-30-cuentas-plan-4a-carrito-resultado.md`.

## Composición

- Task 1, `accepts_orders` en el contrato de lectura (`sonnet`, `review: no`, mecánica).
- Task 2, contrato y simulado del carrito (`opus`, `review: yes`).
- Task 3, cookie, lectura, acciones y fusión (`opus`, `review: yes`): sesión, invitado, 401,
  endpoints públicos y límites de la cookie.
- Task 4, botón "Agregar" (`sonnet`, `review: yes`): cambia ficha y tienda.
- Task 5, `/carrito` y contador (`sonnet`, `review: yes`): ruta nueva, cabecera y e2e.
- Task 6, cierre (`sonnet`): README, reglas, índice, verificación completa y resultado.

Costura: la Task 1 sólo toca el campo nuevo y lo que deja de compilar; la 2 no toca `features/`;
la 3 no toca UI; la 4 no toca la cabecera ni `/carrito`; la 5 no toca ficha ni tienda.

### Task 1: `accepts_orders` en el contrato de lectura

repo: posven-ecommerce
model: sonnet
mechanical: yes
commit: feat(carrito): accepts_orders en las tiendas del contrato de lectura

Lee antes `.claude/rules/{contract,tests}.md` y la enmienda A.

**Produce**

- `schemas.ts`: `storeSummarySchema` suma `accepts_orders: z.boolean().default(false)`, con un
  comentario: opcional mientras posveapi no lo envíe (decisión 3); pasa a obligatorio al
  desplegar su plan 3. El tipo de salida (`z.infer`) queda con `accepts_orders: boolean`.
- `mock/fixtures.ts`: `accepts_orders` en el `summary` de cada tienda simulada: al menos una
  tienda que vende y otra que no; `offers_delivery` va en `MockStore` (no es de `StoreSummary`).
- Las seis pruebas que arman `StoreSummary`, `NearbyStore`, `Store` o `StoreResponse` a mano
  suman `accepts_orders` (el mapa de archivos las nombra).

**Tests**: `schemas.test.ts`: un `StoreSummary` sin `accepts_orders` se lee con `false`; las
respuestas simuladas siguen pasando sus esquemas.

**Verificación**: `tsc`, `eslint` sobre `lib/marketplace` y las pruebas tocadas, `vitest run`
entero, `next build` en simulado sin `blocking-route`.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los archivos de esta tarea.

### Task 2: Contrato y simulado del carrito

repo: posven-ecommerce
model: opus
mechanical: no
review: yes
commit: feat(carrito): contrato y simulado del carrito del comprador

Lee antes `.claude/rules/{contract,tests}.md`, `lib/marketplace/README.md`, la spec cruzada §4 y
§5.2 y la enmienda (C a K).

**Produce**

- `schemas.ts`:
  - `cartItemSchema`: `z.strictObject` con `store_slug` y `product_slug` (1 a 120 caracteres) y
    `quantity` entero 1 a 99. `cartItemsSchema`: arreglo de hasta 20 sin repetir tienda y
    producto (un `refine`).
  - `unavailableReasonSchema`: `out_of_stock`, `store_not_selling`, `offer_gone`, `restricted`.
  - `cartLineSchema`: `product: { slug, name, image_url, category }` (con `categorySchema`
    nulo), `quantity`, `price_usd`, `price_ves`, `line_usd`, `line_ves` (`Money` o nulo),
    `availability` (`availabilitySchema` o nulo), `status` (`ok` o `unavailable`),
    `unavailable_reason` (el enum o nulo).
  - `cartStoreSchema`: `store` (`storeSummarySchema`), `is_open`, `accepts_orders`,
    `offers_delivery` (bool), `lines`, `subtotal_usd`, `subtotal_ves`.
  - `cartSchema`: `stores`, `total_usd`, `total_ves`, `line_count` (entero ≥ 0), `rate`.
  - `accountErrorCodeSchema` suma `not_orderable`, `product_restricted` y `cart_full`.
- `client.ts` (sin `'use cache'`), con `accountRequest` (errores por `MarketplaceAccountError`, 401
  incluido) y validación con `cartSchema`:
  - `quoteGuestCart(ctx, items)` → `POST /cart/quote` con cuerpo `{ items }` (enmienda H).
  - `getCart(ctx)` → `GET /me/cart`.
  - `setCartItem(ctx, item)` → `PUT /me/cart/items` con la entrada sola
    `{ store_slug, product_slug, quantity }` y `quantity` de 0 a 99 (tipo propio `CartItemPut`,
    no contrato de cookie: 0 borra, enmienda J).
  - `mergeCart(ctx, items)` → `POST /me/cart/merge` con cuerpo `{ items }`.
- `mock/accounts.ts`: exporta `customerIdFor(ctx)` (resuelve el token como `authenticate`) y
  completa `ERROR_MESSAGES` (o acota `SimpleErrorCode`) con los códigos nuevos y los mensajes de
  la enmienda G.
- `mock/fixtures.ts`: stock simulado por oferta (interno, no contrato): `available` 50, `low` 3;
  `is_open` fijo por tienda en el fixture (no por la hora real), con una tienda cerrada; un
  producto `recipe` y otro `controlled` ofrecidos por una tienda que vende.
- `mock/money.ts`: `toCents(Money)` y `fromCents(entero)` con enteros (sin coma flotante),
  `multiply(Money, n)` y `sum(Money[])`. Es el único lugar del repo que suma montos.
- `mock/cart.ts`: carrito por comprador en el estado de `globalThis` (como `mock/accounts.ts`),
  cotización de entradas (invitado y usuario) con las reglas de la enmienda C, D, E, G, J y K:
  líneas agrupadas por tienda en el orden de la entrada; `unavailable` con su motivo (`restricted`
  en la cotización no es error); montos nulos en `offer_gone`; totales sólo de `ok`; `line_count`;
  entradas inexistentes omitidas; techo de stock; `cart_full` en la línea 21 de un `PUT`; errores
  `validation_failed`, `not_orderable` y `product_restricted` con los mensajes de la enmienda G;
  `quantity: 0` borra siempre (J); `merge` suma cantidades de la misma línea con techo de stock y
  descarta en silencio las entradas que pasarían de 20 líneas (K).
- `mock/adapter.ts`: exporta las cuatro funciones con las firmas de `client.ts`.
- `.claude/rules/contract.md` regla 1: la excepción suma `mock/money.ts`, que multiplica y suma
  montos en céntimos enteros para simular lo que calcula la API.

**Tests**

- `mock/money.test.ts`: ida y vuelta de `toCents`/`fromCents`; `multiply` y `sum` sin error de
  coma flotante (`0.10 × 3`, `1.15 + 2.20`).
- `mock/cart.test.ts`: una línea `ok` y una `unavailable` (tienda que no vende) cuyo total sólo
  cuenta la `ok`; `offer_gone` con montos nulos; `restricted` en la cotización (sale
  `unavailable`); `PUT` de un `recipe` rechazado con `product_restricted`; `cart_full` en la
  línea 21; techo de stock; `PUT 0` que borra una línea `store_not_selling` y otra `offer_gone`
  (J); `merge` que suma, topa y descarta pasadas las 20 líneas (K); entrada inexistente omitida;
  carrito vacío `{ stores: [], total_usd: "0.00", total_ves: "0.00", line_count: 0, rate }`.
- `schemas.test.ts`: cada respuesta de carrito simulada pasa `cartSchema`; `cartItemsSchema`
  rechaza claves de más, repetidos y slugs de más de 120 caracteres.

**Verificación**: `tsc`, `eslint` sobre `lib/marketplace`, `vitest run lib/marketplace` y luego
entero, `next build` en simulado sin `blocking-route`.

**Terminada cuando** lo anterior pasa, ningún archivo fuera de `lib/marketplace/mock/money.ts`
suma o multiplica montos, y el commit contiene sólo los archivos de esta tarea.

### Task 3: Cookie del invitado, lectura del carrito, acciones y fusión

repo: posven-ecommerce
model: opus
mechanical: no
review: yes
commit: feat(carrito): carrito de invitado, acciones y fusión al entrar

Lee antes `.claude/rules/{app-router,tests}.md`, `features/account/{session,actions,
accountActions}.ts` y su README, L-02 y la spec cruzada §2, §5.2 y §6. Esta versión de Next
difiere de tu entrenamiento: lee en `node_modules/next/dist/docs/` las guías de `cookies`,
Server Actions y `refresh`.

**Produce**

- `features/cart/flag.ts`: `cartEnabled()`: `MARKETPLACE_CART_ENABLED === "1"` o
  `(process.env.MARKETPLACE_MODE ?? "mock") === "mock"` (la regla de `usesMock()`).
- `features/cart/cookie.ts` (`server-only`): `CART_COOKIE = "mp_cart"`, `cartCookieOptions()`
  (restricción 9, `maxAge` 2592000), `parseCartCookie(value)` (JSON válido contra
  `cartItemsSchema`; si no, `[]`), `serializeCart(items)` que devuelve `null` si el valor
  codificado con `encodeURIComponent` pasa de 3800 bytes, y `readGuestCart()`.
- `features/cart/server.ts` (`server-only`, sin `"use server"`):
  - `getCurrentCart()` con `cache` de React: con sesión, `getCart(ctx)`; un 401
    `unauthenticated` se trata como invitado; sin sesión y con entradas, `quoteGuestCart`; sin
    entradas, `null` (carrito vacío sin llamar a la API).
  - `mergeGuestCart(ctx)`: con entradas en `mp_cart` (o con una `mp_cart` presente pero inválida),
    `mergeCart(ctx, items)` y borra `mp_cart`. Ante `MarketplaceUnavailableError`, conserva la
    cookie y no interrumpe (se reintenta en el próximo login); ante `MarketplaceAccountError`, la
    borra y no interrumpe (una falla permanente no se reintenta para siempre).
- `features/cart/actions.ts` (`"use server"`, sólo las tres acciones de formulario), todas no-op
  si `!cartEnabled()`:
  - `addToCart(prev, formData)` (`store_slug`, `product_slug`): con sesión, `setCartItem` con la
    cantidad actual + 1 (la actual sale de `getCart`; en 99 no se envía 100 y se responde "Ya
    tienes 99 unidades de este producto."); sin sesión, suma en `mp_cart` con techo 99; si la
    línea sería la 21 o la cookie pasaría de 3800 bytes, "Tu carrito admite hasta 20 productos."
    sin escribir. Devuelve `{ status: "added" | "error", message }`. Cada `MarketplaceAccountError`
    (`not_orderable`, `product_restricted`, `cart_full`, `validation_failed`,
    `too_many_attempts`...) llega con su mensaje; `MarketplaceUnavailableError` da "No pudimos
    agregar el producto. Intenta de nuevo."
  - `setQuantity(formData)` (1 a 99) y `removeLine(formData)` (cantidad 0): mismo reparto usuario
    / invitado. Un `not_orderable` o `product_restricted` hace `refresh()` sin error (la línea se
    pinta `unavailable` en el siguiente render). La API caída en estos botones va a `error.tsx`
    (precedente de `deleteAddressAction`; se aparta de §6 "aviso en el formulario" y se declara).
  - En las tres, un 401 `unauthenticated` borra `mp_session` y la operación sigue como invitado
    (spec §6); una `mp_cart` inválida se reescribe con la escritura nueva.
  - Tras escribir, `refresh()` de `next/cache` para que la cabecera y `/carrito` se actualicen.
- `features/account/actions.ts`: `login` y `register`, tras guardar `mp_session`, llaman a
  `mergeGuestCart` (de `features/cart/server.ts`) con el token nuevo si `cartEnabled()`.

**Tests**

- `features/cart/flag.test.ts`: `MARKETPLACE_MODE` ausente, `"mock"`, `"api"` con y sin
  `MARKETPLACE_CART_ENABLED=1`.
- `features/cart/cookie.test.ts`: `cartCookieOptions()` (`httpOnly`, `sameSite: "lax"`,
  `path: "/"`, `maxAge` 2592000); JSON inválido, más de 20 entradas, cantidad fuera de rango,
  claves de más y repetidos dan `[]`; ida y vuelta de `serializeCart`; 20 líneas con slugs de 120
  caracteres dan `null` en `serializeCart`.
- `features/cart/actions.test.ts` (simulando `next/headers`, `next/cache` y `client.ts` con
  `vi.mock`): invitado agrega a cookie y topa en 99; línea 21 da el error sin escribir; con sesión
  llama a `setCartItem` con +1 y no manda 100; 401 en `addToCart` y en `setQuantity` borra
  `mp_session` y escribe en la cookie; `removeLine` con `not_orderable` no lanza; con el
  interruptor apagado no hace nada.
- `features/account/actions.test.ts`: `login` con `mp_cart` llama a `mergeCart` y borra la
  cookie; con `MarketplaceUnavailableError` el login sigue y la cookie queda; con
  `MarketplaceAccountError` el login sigue y la cookie se borra; `register` también fusiona.

**Verificación**: `tsc`, `eslint` sobre `features/cart` y `features/account`,
`vitest run features/cart features/account`, `next build` en simulado sin `blocking-route`.

**Terminada cuando** lo anterior pasa, `features/cart/actions.ts` sólo exporta `addToCart`,
`setQuantity` y `removeLine`, y el commit contiene sólo los archivos de esta tarea.

### Task 4: Botón "Agregar" en la ficha y en la tienda

repo: posven-ecommerce
model: sonnet
mechanical: no
review: yes
commit: feat(carrito): agregar al carrito desde la ficha y la tienda

Lee antes `.claude/rules/{ui,app-router,tests}.md`, `features/product/README.md`,
`features/store/README.md`, L-04 y la enmienda E.

**Produce**

- `features/cart/AddToCartButton.tsx` (`"use client"`): formulario con `addToCart` por
  `useActionState`, `store_slug` y `product_slug` ocultos; `Button` outline `sm` con ícono
  `ShoppingCart` y "Agregar al carrito" (nombre accesible "Agregar {producto} de {tienda} al
  carrito"); pendiente: deshabilitado con "Agregando…"; hecho: el botón sigue sumando (texto
  "Agregar otro") y a su lado "Agregado" con un enlace "Ver carrito" a `/carrito`; error: el
  mensaje en `text-destructive` con `role="status"`.
- `features/product/OfferCard.tsx`: el botón junto a `ContactButtons` cuando `cartEnabled()`,
  `offer.store.accepts_orders` y `product.restriction === "none"`; en toda lista de ofertas
  (normales, destacadas y "Fuera de tu zona").
- `features/store/StoreProducts.tsx`: el botón en cada producto con las mismas condiciones.
- Ficha (`app/p/[slug]/page.tsx`, en el panel): con `cartEnabled()`, un producto `recipe` muestra
  "Requiere récipe, consúltalo en la tienda." y uno `controlled` "Venta controlada, consúltalo en
  la tienda." (enmienda E), sin botón.
- `cartEnabled()` se evalúa en el servidor y queda fijado en lo que se prerenderiza al construir;
  no entra en `'use cache'` (si una función cacheada lo necesita, se pasa como argumento).

**Tests**

- `features/cart/AddToCartButton.test.tsx` (`vi.mock` de `./actions`): pinta el nombre accesible;
  tras una respuesta `added` muestra "Agregado", "Ver carrito" y "Agregar otro"; con `error`, el
  mensaje.
- Pruebas de `ProductOffers` y `StoreProducts`: el botón sale con tienda que vende y producto
  `none`, y no sale con tienda sin `accepts_orders`, con `recipe`, con `controlled` ni con el
  interruptor apagado.

**Verificación**: `tsc`, `eslint` sobre `features/cart`, `features/product`, `features/store`,
`app/p`, `vitest run features/cart features/product features/store`, `next build` en simulado sin
`blocking-route` y con `/p/[slug]` y `/tienda/[slug]` en `◐`.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los archivos de esta tarea.

### Task 5: Página `/carrito` y contador de la cabecera

repo: posven-ecommerce
model: sonnet
mechanical: no
review: yes
commit: feat(carrito): página del carrito y contador en la cabecera

Lee antes `.claude/rules/{ui,app-router,seo,tests}.md`, L-02, `app/layout.tsx`,
`features/account/AccountMenu.tsx` (degradación de la cabecera) y la spec cruzada §5.2 y §6.

**Produce**

- `app/carrito/page.tsx`: `metadata` `title: "Carrito"` y `robots: { index: false, follow: false }`;
  `notFound()` fuera de `<Suspense>` si `!cartEnabled()`; el cuerpo en `<Suspense>` con
  esqueleto. `h1` "Tu carrito".
- `features/cart/CartView.tsx` (Server Component; los controles son formularios):
  - Vacío (`null` o `stores: []`): "Tu carrito está vacío." y un enlace "Buscar productos" a
    `/buscar`.
  - Por tienda (`Card`): nombre (enlace a la tienda), ciudad, "Cerrada ahora" si `!is_open`; cada
    línea con `ProductThumb`, nombre (enlace a la ficha), precio unitario USD y Bs, cantidad con
    "Quitar uno" (deshabilitado en 1) y "Agregar uno" (deshabilitado en 99), ambos `setQuantity`,
    44 px en móvil y con el producto en el nombre accesible; "Quitar" (`removeLine`); total de la
    línea. Una línea `unavailable` va atenuada, sin controles de cantidad salvo "Quitar", sin
    precio si sus montos son nulos, con su motivo: "Sin existencias", "La tienda ya no vende en
    línea", "Ya no se ofrece en esta tienda" o "Se vende sólo en tienda". Subtotal de la tienda.
  - Al pie: total en USD y Bs y la tasa (`Tasa BCV del ...`, como en la búsqueda). Sin botón de
    pagar: llega con el plan 4b.
  - API caída: el error sube a `app/error.tsx` (ruta propia, `app-router.md` 7).
- `features/cart/CartLink.tsx` (Server Component) y `CartLinkSkeleton` (`h-11 md:h-9`): enlace a
  `/carrito` con ícono `ShoppingCart` y un `Badge` con `line_count` (usuario) o
  `readGuestCart().length` (invitado, sin API) si es mayor que 0; nombre accesible "Carrito" o
  "Carrito, N productos"; atrapa `MarketplaceUnavailableError` y `MarketplaceAccountError` y
  degrada a "Carrito" sin número (L-02). `null` si `!cartEnabled()`.
- `app/layout.tsx`: `<CartLink />` en su `<Suspense fallback={<CartLinkSkeleton />}>`, junto a la
  cuenta (fila 1 en móvil, a la izquierda de la cuenta).
- `app/robots.ts`: excluye `/carrito`.
- `e2e/cart.spec.ts` (en serie, con slugs del simulado fijados en la prueba: dos productos de dos
  tiendas que venden): un invitado agrega desde la ficha y desde la tienda, ve el contador en 2,
  cambia una cantidad y quita una línea en `/carrito`; una tienda sin venta en línea, un producto
  `recipe` y uno `controlled` no tienen botón; **registra un comprador nuevo**
  (`e2e-cart-<timestamp>@posven.test`) con el carrito de invitado y el carrito se fusiona; sale,
  agrega de nuevo como invitado, entra con ese comprador y se fusiona otra vez (las cantidades
  suman); `/carrito` lleva `noindex`, `robots.txt` excluye `/carrito` y el sitemap estático no lo
  lista; la cabecera no desborda en móvil con sesión y el contador visible; sin JavaScript
  (`javaScriptEnabled: false`), "Agregar" suma y el contador sube tras la recarga.

**Tests**

- `features/cart/CartView.test.tsx`: vacío (`null` y `stores: []`); una tienda con una línea `ok`
  y una `unavailable` (motivo, sin controles de cantidad, sin precio con montos nulos); "Quitar
  uno" deshabilitado en 1; los montos son las cadenas del carrito formateadas.
- `features/cart/CartLink.test.tsx`: con `line_count` 2, "Carrito, 2 productos"; invitado con dos
  entradas sin llamar a la API; con `MarketplaceUnavailableError` y con un 429
  (`MarketplaceAccountError` `too_many_attempts`), "Carrito"; con el interruptor apagado, nada.

**Verificación**: `tsc`, `eslint` sobre `app`, `features/cart`, `e2e`, `vitest run features/cart`,
`next build` en simulado sin `blocking-route`, y `playwright test` entero en simulado dos veces
seguidas con el mismo servidor (en la nube, con la configuración temporal del Chromium del
contenedor, borrada al terminar), para comprobar que el e2e es repetible.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los archivos de esta tarea.

### Task 6: Cierre del plan 4a

repo: posven-ecommerce
model: sonnet
mechanical: no
commit: docs(carrito): cierre del plan 4a de cuentas y compras

Lee antes el resultado del plan 5 de shadcn (formato) y `docs/conventions/README.template.md`.

**Produce**

- `features/cart/README.md` con frontmatter (`capabilities` de `addToCart`, `getCurrentCart`,
  `<CartLink />` y `<CartView />`) y reglas: `RN-CART-01` (formato y límites de `mp_cart`),
  `RN-CART-02` (fusión al entrar y al registrarse; qué falla se reintenta y cuál no),
  `RN-CART-03` (cuándo sale "Agregar"), `RN-CART-04` (el interruptor), cada una con su prueba.
- `lib/marketplace/README.md` (carrito, `accepts_orders` opcional, `mock/money.ts`); READMEs de
  `features/product`, `features/store` y `features/account` (botón, textos de restringidos,
  fusión).
- Reglas: `seo.md` 3 y 8 (`/carrito` con `noindex` y en `robots`), `tests.md` 7
  (`e2e/cart.spec.ts` en el e2e de cierre, en serie), `app-router.md` 7 (`CartLink` entre las
  excepciones del layout).
- `docs/CAPABILITIES.md` regenerado con la reproducción `gen-capabilities.mjs` validada antes
  contra el archivo de `77ca74e`.
- `docs/plans/terminados/2026-09-30-cuentas-plan-4a-carrito-resultado.md`, con:
  - pasos de deploy: `MARKETPLACE_CART_ENABLED` apagada en producción hasta el plan 3 de posveapi;
    se lee al construir (lo prerenderizado queda fijado), así que cambiarla exige reconstruir y
    debe estar también en el `next build` del CI; `accepts_orders` pasa a obligatorio cuando
    posveapi lo envíe;
  - desviaciones: `mp_cart` inválida se reescribe en la siguiente escritura (no se borra al leer);
    la API caída en "Quitar uno", "Agregar uno" y "Quitar" va a `error.tsx`.

**Verificación**: `tsc`, `eslint` de `app`, `features`, `components`, `lib` y `e2e`, `vitest run`
entero, `next build` en simulado sin `blocking-route`, standalone en el 3100 con 200 en `/`,
`/p/<slug>`, `/tienda/<slug>` y `/carrito`, detenido al terminar, y `playwright test` entero en
simulado. El estado apagado del interruptor lo cubren las pruebas unitarias (`flag.test.ts`,
`CartLink.test.tsx`, ficha y tienda); un build en modo API exige la API, así que no se prueba y se
declara.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los documentos de esta tarea.

## Cierre

### Pendientes del cierre

- Destino `posven`: aplicar la enmienda del 2026-09-30, con J y K (bloquea la ejecución de este
  plan).
- Destino plan 3 de posveapi: rutas de carrito, `accepts_orders` en `StoreSummary`, errores de la
  enmienda G, `quantity: 0` que borra siempre (J) y el techo de 20 líneas en `merge` (K).
- Destino plan 4b del ecommerce: checkout, pago simulado, resultado, compras, "Mis compras" y el
  botón de pagar en `/carrito`.
- Destino revisión visual de quien coordina: botón "Agregar" en ficha y tienda, `/carrito` en
  móvil y escritorio, contador en la cabecera.
