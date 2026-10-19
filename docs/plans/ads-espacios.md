# Plan: ads-espacios

**Objetivo:** el ecommerce pinta los espacios publicitarios de `GET /placements` y el `sponsored` de `/search` y `/stores`, ordena la portada según `sections` y cuenta impresiones y clics como `ad_impression` y `ad_click`.
**Estado:** en curso · Fase actual: 9

## Contexto mínimo
- Spec: `posven/.claude/docs/specs/2026-10-18-publicidad-ecommerce-design.md` (§1 catálogo de espacios, §2.3 contrato, §3.6 conteo, §4 errores, §5 verificación). Plan 3 de §6.
- Repos y ramas: posven-ecommerce en `C:\Users\Windows 11\Documents\Development\posven\posven-ecommerce\.claude\worktrees\ads-espacios`, rama `feat/ads-espacios` desde `main` 5b5da73. El contrato lo sirve posveapi dev 5c6d8287 (sin desplegar): se trabaja en modo simulado.
- Contrato real en posveapi: `PieceResource` (`kind` `ad|house`, `format`, `image_desktop_url`, `image_mobile_url`, `alt`, `badge`, `title`, `cta`, `href`, `external`, `advertiser_name`, `token`, todos menos `kind`, `format`, `href`, `external` y `token` pueden ser nulos); `GET /placements?page=home|search|product|stores|store&city|lat,lng&category&store` responde `{slots:{<espacio no nativo>: Piece|null}, sections?}`, `sections` sólo en home con claves `trust_strip`, `promos`, `categories`, `home_strip`, `nearby_products`, `how_it_works`, `nearby_stores`, `home_bottom` (`HomeSectionKey`); `/search` página 1 suma `sponsored: {product, offer, token, advertiser_name}` y `/stores?placement=home_stores_native|stores_native` (por omisión `stores_native`) suma `sponsored: {<tienda como featured>, token, advertiser_name}`, ambas claves omitidas si no hay; `POST /events` con `{type: ad_impression|ad_click, ad_token, session_id}`, `ad_token` hasta 512 y sin slugs.
- Restricciones: el navegador nunca llama a posveapi (eventos por `app/api/events/route.ts`); campos nuevos `.optional()` (L-16) porque el push a `main` despliega solo y posveapi va primero; `cacheComponents` (regla `app-router` 2 y 3); los espacios no se cachean y, si la API falla o no hay pieza, muestran lo de hoy o no se pintan (excepción de la regla `app-router` 7, como `NearbyProducts`); premium no cambia ("Destacado" y `PremiumSeal`).
- Archivos principales: `lib/marketplace/{schemas,params,client}.ts`, `lib/marketplace/mock/{adapter,fixtures}.ts`, `features/events/lib/handle.ts`, `app/page.tsx`, `features/store/components/{NearbyStores,SponsoredStore,StoresDirectory}.tsx`, `features/search/components/SearchResults.tsx`.

## Fases

### [x] Fase 1 — Contrato de espacios y patrocinados
- **Repo:** posven-ecommerce
- **Alcance:**
  - `schemas.ts`: `pieceSchema`, `placementsResponseSchema` (`slots` como registro de espacio a `Piece | null`, `sections` opcional) y `sponsored` opcional en `searchResponseSchema` (forma de `featured` de búsqueda más `token` y `advertiser_name`) y en `storesResponseSchema` (`nearbyStoreSchema` más `token` y `advertiser_name`). Tipos por `z.infer`.
  - `params.ts`: `placementsQuery` (página, ubicación por `appendLocation`, `category`, `store`) y `placement` en `storesQuery`.
  - `client.ts`: `getPlacements` sin `'use cache'` (la rotación es por pedido) y `placement` en `listNearbyStores`. El `sponsored` de `/search` y `/stores` viaja dentro de sus respuestas cacheadas (ver Decisiones).
  - Simulado: `getPlacements` con una pieza por espacio de la página (imágenes `data:`), `sponsored` en la página 1 de `searchProducts` y `listNearbyStores` sin repetir `featured` ni la lista.
  - README de `lib/marketplace` (exports, capacidades, sección 3 y tests) y la spec de publicidad citada en `.claude/rules/contract.md`.
- **Archivos:** `lib/marketplace/schemas.ts`, `lib/marketplace/params.ts`, `lib/marketplace/client.ts`, `lib/marketplace/mock/adapter.ts`, `lib/marketplace/mock/fixtures.ts`, `lib/marketplace/README.md`, `.claude/rules/contract.md`; tests en `lib/marketplace/__tests__/{schemas,params,client}.test.ts` y `lib/marketplace/mock/__tests__/adapter.test.ts`.
- **Terminado cuando:** los esquemas aceptan respuestas con y sin `placements`, `sections` y `sponsored`; `<repo>/node_modules/.bin/tsc --noEmit -p <repo>/tsconfig.json`, `npx eslint <archivos>` y `npx vitest run lib/marketplace` pasan.
- **Commit:** `feat(marketplace): contrato de espacios publicitarios y patrocinados`

### [x] Fase 2 — Eventos de anuncio en el route handler
- **Repo:** posven-ecommerce
- **Alcance:** `ad_impression` y `ad_click` en `eventTypeSchema` con `ad_token` (sólo en esos dos, sin slugs ni campos de búsqueda); deduplicación por sesión, tipo y token; los eventos de siempre no cambian.
- **Archivos:** `lib/marketplace/schemas.ts`, `features/events/lib/handle.ts`, `features/events/README.md`, `lib/marketplace/README.md`.
- **Terminado cuando:** `npx vitest run features/events lib/marketplace` pasa con casos de token, slugs prohibidos y deduplicación.
- **Commit:** `feat(events): impresiones y clics de anuncios`

### [x] Fase 3 — Módulo ads: pieza, impresión y clic
- **Repo:** posven-ecommerce
- **Alcance:** `features/ads/` con la lectura por página (`getPagePlacements`, una llamada por pedido con `cache` de React, ubicación de `getEffectiveLocation`, `null` si la API no está), el disparo de impresión (mitad visible un segundo, una vez por montaje), el enlace con clic por `sendBeaconEvent` (externo: otra pestaña y `rel="sponsored noopener"`) y el banner con imagen de escritorio y móvil; la marca "Patrocinado" sólo en `kind: ad`. Comprobar el host de las imágenes de posveapi contra `remotePatterns`.
- **Terminado cuando:** `npx vitest run features/ads` pasa con un `IntersectionObserver` simulado; tsc y eslint limpios.
- **Commit:** `feat(ads): pieza publicitaria con impresión y clic`

### [x] Fase 4 — Portada: hero y promociones [riesgo]
- **Repo:** posven-ecommerce
- **Alcance:** `home_hero` reemplaza la imagen del hero (el `h1` y el buscador quedan fijos y prerenderizados); `home_promo_1` y `home_promo_2` reemplazan las tarjetas de hoy, que quedan de respaldo. Sin cambio de LCP ni salto de diseño cuando no hay pieza o la API tarda.
- **Terminado cuando:** vitest del área, tsc, eslint y `npx next build` sin aviso `blocking-route`.

### [x] Fase 5 — Portada: franjas y orden de secciones [riesgo]
- **Repo:** posven-ecommerce
- **Alcance:** banners `home_strip` y `home_bottom`; las secciones siguen `sections` (el hero primero y "Vende" al final quedan fijos) y, sin respuesta, el orden de hoy.
- **Terminado cuando:** vitest del orden con y sin `sections`, tsc, eslint y `npx next build`.

### [x] Fase 6 — Espacios de tiendas
- **Repo:** posven-ecommerce
- **Alcance:** "Tiendas cercanas" pide `placement=home_stores_native` y `SponsoredStore` pinta `sponsored` (no `featured[0]`); los premium vuelven a la lista como "Destacado". `/tiendas` pinta `sponsored` de `stores_native` y el banner `stores_top`. Ajustar `e2e/search.spec.ts:13` ("PATROCINADO").
- **Terminado cuando:** vitest de `features/store`, tsc, eslint y `npx next build`.

### [x] Fase 7 — Espacios de /buscar
- **Repo:** posven-ecommerce
- **Alcance:** `search_top`, `search_empty` en el estado vacío y la tarjeta `sponsored` después de los `featured`, con la marca "Patrocinado" y su impresión y clic.
- **Terminado cuando:** vitest de `features/search`, tsc, eslint y `npx next build`.

### [x] Fase 8 — Banners de producto y tienda
- **Repo:** posven-ecommerce
- **Alcance:** `product_banner` bajo las ofertas de `/p/[slug]` (con la categoría del producto) y `store_banner` en `/tienda/[slug]` (con el slug de la tienda).
- **Terminado cuando:** vitest del área, tsc, eslint y `npx next build`.

### [ ] Fase 9 — e2e de publicidad
- **Repo:** posven-ecommerce
- **Alcance:** conmutador sólo del simulado para "sin anuncios" y "API caída" en `/placements`; `e2e/ads.spec.ts` con la portada con anuncio, sin anuncio y con la API caída, `rel="sponsored"` en un destino externo y el cuerpo del evento de impresión.
- **Terminado cuando:** `npx playwright test` pasa entero.

## Decisiones
- 2026-10-19: la imagen de hoy del hero conserva su `preload` aunque haya pieza (se descarga igual); la pieza usa `fetchPriority="high"`.
- 2026-10-19: `sponsored` llega dentro de las respuestas cacheadas de `searchProducts` y `listNearbyStores` (`cacheLife("minutes")`): rota por entrada de caché y no por pedido, y el mismo token sirve a todos los que ven esa entrada. Separarlo exigiría otro endpoint en posveapi.
- 2026-10-19: las piezas propias (`kind: house`) no llevan la marca "Patrocinado"; sí cuentan impresiones y clics.

## Notas para la próxima sesión
- Fase 1 hecha: `getPlacements({page, geo, radiusKm, category?, store?})` sin `'use cache'`; `listNearbyStores` con `placement?: StoresPlacement` (`home_stores_native|stores_native`); tipos `Piece`, `PlacementsResponse`, `PlacementPage`, `HomeSectionKey`, `SponsoredProduct`, `SponsoredStore` (choca de nombre con el componente `features/store/components/SponsoredStore.tsx`: importar con alias) y constantes `PLACEMENT_PAGES`, `HOME_SECTION_KEYS`. `slots` es `Record<string, Piece|null>`. Simulado: `sponsored` sólo en página 1 y se saca de `data` (búsqueda: último no destacado; tiendas: `abasto-la-esquina`, no premium); `getPlacements` da una pieza por espacio no nativo con imágenes `data:` y `sections` en el orden por omisión.
- Fase 2 hecha: el navegador manda `{type: ad_impression|ad_click, ad_token}` (1..512) a `/api/events`; se reenvía `{type, ad_token, session_id}`; dedupe por sesión, tipo y token. `store_slug`/`product_slug` son `.nullish()` en el esquema pero los tipos de siempre los siguen exigiendo presentes.
- Fase 3 hecha: `features/ads/server/placements.ts` exporta `getPagePlacements(page, {category?, store?}): Promise<PlacementsResponse|null>` (lee la cookie: va bajo `<Suspense>`) y `pieceForSlot(placements, slot): Piece|null`; componentes `AdImpression({token, children, className?})` y `AdLink({piece, children, className?})` (client), `AdBanner({piece, className?})` (server, dos `next/image` móvil `sm:hidden` 2:1 y escritorio `hidden sm:block` 5:1); `SPONSORED_LABEL = "Patrocinado"`. El host de imágenes de posveapi se infiere igual al de productos (`media.posven.io`); se confirma con una pieza real.
- Fase 4 hecha: `features/ads/components/HeroPiece.tsx` (`HomeHeroSlot({fallback})`) y `PromoPiece.tsx` (`HomePromoSlots({fallbacks})`, `PromoList({items})`, `HOME_PROMO_SLOTS`); en `app/page.tsx` el `h1` y el buscador quedan fuera de Suspense; las dos promos van en un solo `<Suspense>` (la fase 5 mueve `promos` como un bloque). En móvil la pieza del hero cubre el fondo con velo `bg-ink/70` y sin badge ni cta: conviene que el usuario lo vea. `next build` en el worktree va con `--webpack` (Turbopack falla por la junction de node_modules). `features/site/__tests__/brand-icon.test.tsx` falla también en la base (ruta de la fuente relativa al cwd).
- Fase 5 hecha: `features/ads/components/HomeSections.tsx` con `HomeSections({blocks, promoFallbacks})`, `HomeSectionList`, `homeSectionOrder(placements)`, tipos `HomeBlocks` y `HomeContentKey`; `HomePromoSlots` pasó a `HomePromos({placements, fallbacks})`. Hero fijo arriba con su `<Suspense>`, el resto en un `<Suspense>` cuyo fallback es el orden de hoy con esqueletos; `SellBanner` fijo al final. Clave repetida una vez, `sections: []` oculta todo, banner sólo con `format: banner`. Regla `RN-ADS-07`.
- Fase 6 hecha: `SponsoredStore({store})` recibe el tipo `SponsoredStore` (alias `SponsoredStoreData`) con `AdImpression` y `AdLink`; `NearbyStores` pide `home_stores_native`, `StoresDirectory` `stores_native` (sponsored tras `featured`, excluido de la lista); `SlotBanner({page, slot, scope?})` nuevo en `features/ads/components/SlotBanner.tsx` (pinta `AdBanner` sólo con `format: banner`; reutilizable en fases 7 y 8); `/tiendas` monta `stores_top` en `<Suspense fallback={null}>`. `e2e/search.spec.ts` busca el enlace "Abasto La Esquina" con "Patrocinado" (sin correr playwright).
- Fase 7 hecha: `SponsoredCard({item}: {item: SponsoredProduct})` en `features/search/components/SponsoredCard.tsx`, último `<li>` de "Destacados" sólo en página 1 y si no está en `featured`; `search_top` sobre el encabezado y `search_empty` antes del `EmptyState`, ambos `SlotBanner page="search"` con `scope={{category: query.categoria}}`. Los tests de `SearchResults` simulan `SlotBanner` (async).
- Fase 8 hecha: `product_banner` bajo las ofertas de `/p/[slug]` (`category: product.category?.slug ?? null`) y `store_banner` tras `StoreHeader` en `/tienda/[slug]` (`store: slug`), cada uno en `<Suspense fallback={null}>`; excepción de los espacios publicitarios sumada a `.claude/rules/app-router.md` punto 7.
- tsc en el worktree necesita antes `"<árbol>/node_modules/.bin/next" typegen "<árbol>"` (si no, faltan `PageProps`/`LayoutProps`).
- `docs-check` marcará rancios los README que listan `client.ts`/`schemas.ts` (account, cart, checkout, events): se revisa tras el merge.
- En main no existe nada de `placements`, `sponsored`, `ad_token` ni `IntersectionObserver`. `SponsoredStore` hoy marca "PATROCINADO" al primer premium (`NearbyStores.tsx`), lo que la fase 6 corrige.

## Mejoras propuestas
- [ ] M-1: con `/placements` lento (tope de 5 s), `NearbyProducts` y `NearbyStores` de la portada empiezan a leer sólo cuando resuelve el orden de secciones y su esqueleto puede durar hasta ~10 s; calentar sus lecturas cacheadas antes del `await` de `HomeSections` (repo: posven-ecommerce)
      Complejidad: media · Archivos: 2 · Riesgo: ninguno → sonnet
