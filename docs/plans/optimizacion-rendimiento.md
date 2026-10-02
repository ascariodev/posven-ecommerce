# Plan: optimización de caché y llamadas a la API

**Objetivo:** menos llamadas a posveapi y menos peso por página: lecturas públicas en caché, ficha
sin precio viejo, checkout sin lecturas duplicadas ni sondeo infinito y el árbol de ubicaciones
fuera del payload de cada página.
**Estado:** en curso · Fase actual: 1

## Contexto mínimo
- Spec: `posven/.claude/docs/specs/2026-09-26-ecommerce-hiperlocal-design.md#4.4` (caché por
  página) y `#2` (ofertas con `cacheLife` corto). El plan no la contradice: `/buscar` sigue
  dinámica, sólo se cachea el dato.
- Repos y ramas: `posven-ecommerce` en
  `C:\Users\Windows 11\Documents\Development\posven\posven-ecommerce`, rama `main`.
- Restricciones: `.claude/rules/contract.md` §7 fija qué funciones llevan `'use cache'` y con qué
  `cacheLife`: se actualiza en la misma fase que el código. Nada de un comprador en `'use cache'`
  (`features/checkout/README.md`). `cacheComponents: true`: lo que lee cookies va en `<Suspense>`.
- Archivos principales: `lib/marketplace/client.ts`, `features/checkout/server/checkout.ts`,
  `features/checkout/components/PurchasePoller.tsx`, `features/location/components/LocationSheet.tsx`.

## Fases

### [ ] Fase 1 — Caché de lecturas públicas del marketplace
- **Repo:** posven-ecommerce
- **Alcance:**
  - `searchProducts` y `listNearbyStores`: `'use cache'`, `cacheLife("minutes")`,
    `cacheTag("marketplace:search")` y `cacheTag("marketplace:stores")`. Reciben todo por
    argumento; las coordenadas ya llegan redondeadas a 3 decimales desde la cookie.
  - `getProduct(slug)` deja de tener caché propia y delega en
    `getProductOffers({ slug, geo: null, radiusKm: null, sort: "price" })`: una sola entrada de
    caché en `"minutes"` para la ficha y para las ofertas del visitante sin ubicación. Así
    `offers_summary` (el "Desde $X", el corte de "Sin disponibilidad ahora", el JSON-LD y el
    `noindex` de los metadatos) se refresca como las ofertas.
  - `contract.md` §7 y `lib/marketplace/README.md` (líneas de `source`, firmas y la lista de
    qué se cachea) dicen lo nuevo.
- **Archivos:** `lib/marketplace/client.ts`, `lib/marketplace/README.md`,
  `.claude/rules/contract.md`
- **Terminado cuando:** `<repo>/node_modules/.bin/tsc --noEmit -p <repo>/tsconfig.json` y
  `npx eslint lib/marketplace` limpios; `npx vitest run lib/marketplace features/product` pasa;
  `npx next build` termina sin avisos `blocking-route` y con `/`, `/p/[slug]` y `/tienda/[slug]`
  igual de prerenderizadas que antes.
- **Commit:** `perf(marketplace): cachear búsqueda y tiendas y unificar la caché de la ficha`

### [ ] Fase 2 — Menos llamadas a la API en el checkout
- **Repo:** posven-ecommerce
- **Alcance:** `loadCheckout` usa `getSessionCart()` (memoizado por petición, ya pedido por la
  cabecera) en lugar de `getCart(ctx)`. `PurchasePoller` refresca a 3, 5 y luego cada 10 s, se
  detiene a los 2 minutos dejando "Consultar de nuevo" y pausa con la pestaña oculta.
- **Archivos:** `features/checkout/server/checkout.ts`,
  `features/checkout/components/PurchasePoller.tsx`, `features/checkout/README.md`; pruebas
  `server.test.ts` y `PurchasePoller.test.tsx`.
- **Terminado cuando:** tsc y eslint limpios; `npx vitest run features/checkout` pasa con casos
  nuevos del intervalo creciente, el tope y la pausa.
- **Commit:** `perf(checkout): reutilizar el carrito de la petición y acotar el sondeo del pago`

### [ ] Fase 3 — Árbol de ubicaciones bajo demanda
- **Repo:** posven-ecommerce
- **Alcance:** `LocationBar` deja de pasar `states`; una server action pública
  `loadLocationStates()` lo trae (desde `listLocations`, ya cacheado) cuando se abre la hoja, y
  `LocationPicker` deshabilita "Elegir ciudad" mientras llega o si la API falla.
- **Archivos:** `features/location/server/actions.ts`,
  `features/location/components/LocationBar.tsx`, `features/location/components/LocationSheet.tsx`,
  `features/location/components/LocationPicker.tsx`, `features/location/README.md`; pruebas
  `LocationBar.test.tsx` y `LocationPicker.test.tsx`.
- **Terminado cuando:** tsc, eslint y `npx vitest run features/location` pasan; el payload RSC
  de `/` ya no contiene el árbol; `npx playwright test` (cierre del plan) pasa.
- **Commit:** `perf(location): cargar el árbol de ubicaciones al abrir la hoja`

## Decisiones
- 2026-10-02 — Puntos 1, 2, 4, 6 y 7 de la revisión; el usuario pidió en cada uno "la forma más
  eficiente".
- 2026-10-02 — Ficha: `getProduct` delega en `getProductOffers` sin ubicación, en `"minutes"`,
  en vez de separar parte estable y precio: el endpoint devuelve ambas juntas, así que separarlas
  no ahorra llamadas y unificar quita una entrada duplicada.
- 2026-10-02 — Búsqueda y tiendas cercanas en `"minutes"`, la misma frescura que las ofertas.
- 2026-10-02 — Sondeo del pago: 3, 5 y 10 s, tope de 2 minutos, pausa con la pestaña oculta.
- 2026-10-02 — Árbol de ubicaciones por server action al abrir la hoja: el dato es público y
  `listLocations` ya está cacheado en el servidor.

## Notas para la próxima sesión
- Plan sin empezar. Fuera de este plan quedaron los puntos 3 (invalidación por `revalidateTag`
  desde posveapi) y 8 (incremento del carrito en la API), que cruzan repos.
