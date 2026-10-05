# Plan: rediseño F2b · Decidir (ficha, tienda y directorio de comercios)

**Objetivo:** las pantallas de F2 del lienzo "E · PosVen": ficha de producto con la lista de
tiendas para elegir, barra de compra fija y detalles plegables; página de tienda con portada; y
directorio de comercios, sobre los tokens de F0, la cabecera y barra de F1b y el contrato de F2a.
**Estado:** en curso: fase 3 de 7

## Contexto mínimo
- Spec: `docs/specs/2026-10-03-rediseno-posven-design.md` §2, §4 (`ui.md`), §5 (ficha `P15`/`P06`,
  tienda `W07`/`P07`), §6 (F2; puerta: e2e en verde y revisión contra el lienzo) y §8. Referencia
  visual en `docs/design/2026-10-03-rediseno/` (sin commitear): `web/P15-Ficha-Escritorio`,
  `web/W07-Tienda`, `movil/P06-Ficha`, `movil/P07-Tienda` (`.dc.html`; se copian en espíritu, con
  primitivas shadcn y tokens). Ningún lienzo dibuja el directorio: se arma con `StoreCard`.
- Repo y rama: `posven-ecommerce` en
  `C:\Users\Windows 11\Documents\Development\posven\posven-ecommerce`, rama `main` (sin push salvo
  pedido).
- Estado de partida (exploración 2026-10-04):
  - `app/p/[slug]/page.tsx` monta `ProductBuyBox` (capa de Jose): primera oferta por precio,
    `storeName="Comercio Aliado"` fijo, sin destacadas ni contacto, "Ver precios por farmacia"
    abre `MarketPricesModal`. `OfferCard`, `ProductOffers`, `SortLinks` y `PriceSummary` quedaron
    huérfanos (sólo los usan sus tests y `app/preview/rediseno/_kit`); `OfferCard` también tiene
    "Comercio Aliado" fijo y sin enlace. "Mejor precio" sale por posición (`RN-PRODUCT-05`).
  - `ContactButtons` vive en `features/events/components/ContactButtons.tsx` (lo usa
    `StoreHeader`); salió de `OfferCard` en `a900a00`.
  - `features/product/README.md` describe el diseño viejo (`OfferCard` con enlace y contacto).
  - Tienda: `app/tienda/[slug]` con `StoreHeader` (portada sólo premium), `StoreProducts`.
    `StoreCard` no usa portada. `/comercios` es la landing de captación, no un directorio; el único
    listado de tiendas es `NearbyStores` del inicio.
  - e2e rojos conocidos por "Comercio Aliado": `product.spec.ts` (destacadas, WhatsApp, "Sin
    disponibilidad ahora."), `cart.spec.ts` y `checkout.spec.ts` ("Agregar … de Farmacia Central").
- Restricciones: reglas `.claude/rules/ui.md` y `app-router.md`; sin dependencias nuevas (`sheet`
  y scroll nativo, sin `vaul` ni `embla`); el frontend no calcula montos, horarios ni el mejor
  precio (`is_best_price`, `is_open` y `closes_at` vienen de la API); README del módulo en el mismo
  cambio (L-09); rutas nuevas con la skill `new-page`.
- Archivos principales: `app/p/[slug]/page.tsx`, `features/product/components/*`,
  `features/events/components/ContactButtons.tsx`, `app/tienda/[slug]/page.tsx`,
  `features/store/components/*`, `e2e/{product,cart,checkout}.spec.ts`.
- Verificación: `<repo>/node_modules/.bin/tsc --noEmit -p <repo>/tsconfig.json`, eslint de lo
  tocado, vitest del área y Playwright con `MARKETPLACE_MODE=mock` (script Node con
  `process.chdir`, nunca `cd`).

## Fases

### [x] Fase 1 — `OfferCard` con tienda, contacto, mejor precio y horario
- **Repo:** posven-ecommerce
- **Alcance:** `OfferCard` según `P15`/`P06`: nombre de la tienda con enlace a `/tienda/<slug>`,
  `ContactButtons` (WhatsApp y llamada), pill "Mejor precio" desde `is_best_price` (deja de ser
  posicional), "Abierto · cierra HH:MM" o "Cerrado" desde `is_open`/`closes_at`, distancia y
  precio por `lib/format.ts`; `AddToCartButton` recibe el nombre real de la tienda. Sin montarlo
  aún en la página. Tests del componente y README de `features/product` (ficha de `OfferCard` y
  regla `RN-PRODUCT-05` reescrita).
- **Archivos:** `features/product/components/OfferCard.tsx`,
  `features/product/components/ProductOffers.tsx` (deja de pasar `best` por posición),
  `features/product/README.md`; tests de ambos.
- **Terminado cuando:** tsc y eslint limpios y `vitest run --root <repo> features/product` en verde.
- **Commit:** `feat(product): OfferCard con tienda, contacto y mejor precio de la API`

### [x] Fase 2 — [riesgo] La ficha muestra la lista de tiendas
- **Repo:** posven-ecommerce
- **Alcance:** `app/p/[slug]` monta `ProductOffers` (destacadas, orden y "ver más") en lugar de
  `ProductBuyBox` y `MarketPricesModal`, que se retiran si quedan sin uso; e2e de ficha, carrito y
  checkout vuelven a afirmar el nombre de la tienda.
- **Terminado cuando:** vitest del área y `e2e/product`, `e2e/cart` y `e2e/checkout` en verde.

### [ ] Fase 3 — Barra de compra fija
- **Repo:** posven-ecommerce
- **Alcance:** tienda elegida en la lista, precio y "Agregar al carrito" fijos abajo en móvil
  (sobre la barra inferior de F1b) y en la columna en escritorio; accesible por teclado.

### [ ] Fase 4 — Detalles plegables de la ficha
- **Repo:** posven-ecommerce
- **Alcance:** descripción, presentación, restricciones y datos del producto en secciones
  plegables según `P15`/`P06`, sin perder el JSON-LD ni la canónica.

### [ ] Fase 5 — Página de tienda según el lienzo
- **Repo:** posven-ecommerce
- **Alcance:** `StoreHeader` con portada, estado abierto/cierra, contacto y favorito según
  `W07`/`P07`; `StoreProducts` con los tokens y la tarjeta de F1b.

### [ ] Fase 6 — Directorio de comercios
- **Repo:** posven-ecommerce
- **Alcance:** ruta nueva con la skill `new-page` que lista las tiendas cercanas con
  `listNearbyStores` (portada de F2a, abierto ahora, distancia, paginación), enlazada desde el
  inicio y la cabecera; `StoreCard` con portada.

### [ ] Fase 7 — Revisión contra el lienzo y e2e completos
- **Repo:** posven-ecommerce
- **Alcance:** puerta de F2: Playwright completo con `MARKETPLACE_MODE=mock` sin fallos y
  revisión de ficha, tienda y directorio contra `P15`, `P06`, `W07` y `P07` en claro y oscuro;
  ajustes menores dentro del alcance.

## Decisiones
- 2026-10-04 — `OfferCard` restaura nombre de tienda con enlace y `ContactButtons`; los e2e vuelven
  a afirmar el nombre — usuario.
- 2026-10-04 — F1b primero, después F2a y F2b — usuario.
- 2026-10-04 — Ruta del directorio: `/tiendas` (`/comercios` sigue siendo la captación) — propuesta
  de quien planifica, aprobada por el usuario.

- 2026-10-04 — Fase 1: `OfferCard` queda `{ offer, product, featured, now }` (sin `best`); `now` sólo alimenta `formatUpdatedAgo` — implementación.

- 2026-10-04 — Fase 2: la ficha muestra destacadas y las tres primeras del radio; el resto va en un `<details>` "Ver N tiendas más"; `PriceSummary` toma el rango de `offers_summary`; la galería es `md:sticky` (en móvil tapaba las ofertas); vuelven los textos de récipe y venta controlada; `ContactButtons` conserva "Ver ruta" (coincide con P15/P06) — implementación.

## Notas para la próxima sesión
- Fase 2 hecha: e2e product, cart y checkout en verde (18 y 1 `fixme` previo). `npx next build` no termina por la ruta sin trackear `app/preview/rediseno/[pantalla]` (de F0, sin commitear): la puerta de la fase 7 debe resolverlo. En dev sale el aviso "runtime data during prerendering" por `await params` fuera de Suspense: es intencional (regla seo 7) y `generateStaticParams` existe. P06 pliega "Fuera de tu zona" en móvil; aquí sigue desplegado (ver fase 7).
- Fase 1 hecha: `OfferCard` con enlace a la tienda, `ContactButtons`, pill desde `is_best_price` y horario desde `is_open`/`closes_at`; `ProductOffers` ya no marca por posición. En la fase 2, comprobar contra `P15` si `ContactButtons` debe llevar "Ver ruta" (hoy trae WhatsApp, llamada y ruta).
- F1b y F2a terminados el 2026-10-04 (F2a en `posven/.claude/docs/plans/terminados/`); `is_best_price` es el mínimo entre las ofertas servidas y las ofertas a precio 0 no se publican (F2a M-5 y M-6).

## Mejoras propuestas
- [ ] M-1 — Enlace del nombre de tienda en `OfferCard` con `inline-flex min-h-11 items-center` (zona táctil de 44 px).
  posven-ecommerce · baja · sonnet
- [ ] M-2 — `OfferCard.test.tsx`: caso sin "Agregar al carrito" con restricción distinta de `none` o sin `accepts_orders`.
  posven-ecommerce · baja · sonnet
- [ ] M-3 — `ProductOffers`: al abrir "Ver N tiendas más" el `summary` se oculta (`group-open:hidden`) y el foco cae al `body`; mover el foco a la primera oferta o dejar un "Ver menos".
  posven-ecommerce · baja · sonnet
- [ ] M-4 — La galería de la ficha repite `product.image_url` tres veces ("Mocks temporales" de la capa de Jose).
  posven-ecommerce · baja · sonnet
- [ ] M-5 — El README de product no lista `ProductGallery` ni `ShareButton` entre sus exports (deuda previa).
  posven-ecommerce · baja · sonnet
