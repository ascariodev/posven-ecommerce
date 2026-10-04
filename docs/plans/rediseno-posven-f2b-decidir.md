# Plan: rediseño F2b · Decidir (ficha, tienda y directorio de comercios)

**Objetivo:** las pantallas de F2 del lienzo "E · PosVen": ficha de producto con la lista de
tiendas para elegir, barra de compra fija y detalles plegables; página de tienda con portada; y
directorio de comercios, sobre los tokens de F0, la cabecera y barra de F1b y el contrato de F2a.
**Estado:** pendiente: espera F1b y el plan F2a (`posven/.claude/docs/plans/rediseno-posven-f2a-contrato.md`)

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

### [ ] Fase 1 — `OfferCard` con tienda, contacto, mejor precio y horario
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

### [ ] Fase 2 — [riesgo] La ficha muestra la lista de tiendas
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

## Notas para la próxima sesión
- Antes de la fase 1, confirmar que F1b y F2a están terminados.

## Mejoras propuestas
