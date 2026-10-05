---
module: "store"
path: "features/store"
type: "feature"
exports: ["StoreCard", "NearbyStores", "NearbyStoresSkeleton", "SponsoredStore", "StoreLogo", "StoreOpenBadge", "storeInitials", "formatSchedule", "openingHoursJsonLd", "storeJsonLd", "StoreHeader", "StoreProducts", "StoreProductsSkeleton", "StoresDirectory", "StoresDirectorySkeleton"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/jsonld.ts", "lib/site.ts", "features/location/lib/cookie.ts", "features/location/server/location.ts", "features/events/components/ContactButtons.tsx", "features/events/components/ViewBeacon.tsx", "components/ui/badge.tsx", "components/ui/button.tsx", "components/ui/card.tsx", "lib/utils.ts", "components/ui/skeleton.tsx", "features/cart/components/AddToCartButton.tsx", "features/cart/lib/flag.ts", "features/search/components/ProductThumb.tsx", "features/search/components/Pagination.tsx"]
tests: "features/store/__tests__/*.test.{ts,tsx}"
verified_against: ["features/store/components/StoreCard.tsx", "features/store/components/StoreLogo.tsx", "features/store/components/NearbyStores.tsx", "features/store/components/SponsoredStore.tsx", "features/store/lib/initials.ts", "features/store/lib/schedule.ts", "features/store/lib/jsonld.ts", "features/store/components/StoreHeader.tsx", "features/store/components/StoreProducts.tsx", "features/search/components/ProductThumb.tsx", "features/store/components/StoresDirectory.tsx", "features/search/components/Pagination.tsx", "app/tiendas/page.tsx", "app/page.tsx", "app/tienda/[slug]/page.tsx", "lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/jsonld.ts", "lib/site.ts", "features/location/lib/cookie.ts", "features/location/server/location.ts", "features/events/components/ContactButtons.tsx", "features/events/components/ViewBeacon.tsx", "components/ui/badge.tsx", "components/ui/button.tsx", "components/ui/card.tsx", "lib/utils.ts", "components/ui/skeleton.tsx"]
capabilities:
  - intent: "mostrar la tienda patrocinada y los comercios cercanos en la portada"
    intent_aliases: ["tiendas cercanas", "tiendas cerca de mi", "comercios cercanos", "tiendas destacadas"]
    entrypoint: "<NearbyStores />"
    file: "features/store/components/NearbyStores.tsx"
    input: "sin props; lee la cookie loc; se monta dentro de <Suspense fallback={<NearbyStoresSkeleton />}>"
    output: "tarjeta PATROCINADO con el primer destacado y sección 'Comercios cerca' (con ubicación) o 'Comercios en {SITE_NAME}' (sin ella): el resto de destacados primero, hasta 6 StoreCard en rejilla sm:2 lg:3 y 'Ver todos' a /tiendas; sin comercios, un aviso que invita a probar otra ciudad; con la API caída no pinta nada"
    source: "listNearbyStores() de lib/marketplace con geo de getEffectiveLocation() (cookie loc)"
    rules: ["RN-STORE-02"]
  - intent: "mostrar la tarjeta de una tienda"
    intent_aliases: ["tarjeta de tienda", "logo de tienda", "iniciales de tienda", "fuera de tu zona"]
    entrypoint: "<StoreCard />"
    file: "features/store/components/StoreCard.tsx"
    input: "store: NearbyStore; featured?: boolean"
    output: "Card como enlace a /tienda/{slug}: portada (cover_url) arriba si la tienda es premium y la trae, y en fila logo o iniciales, nombre, city.name, distancia si no es null, 'Destacado' si featured, 'Fuera de tu zona' si outside_radius y, si la API informa is_open, 'Abierto' (con 'hasta {closes_at}') o 'Cerrado'"
    source: "props"
    rules: ["RN-STORE-01", "RN-STORE-03"]
  - intent: "listar todas las tiendas cercanas con paginación"
    intent_aliases: ["directorio de tiendas", "todas las tiendas", "pagina tiendas", "comercios cercanos paginados"]
    entrypoint: "<StoresDirectory />"
    file: "features/store/components/StoresDirectory.tsx"
    input: "searchParams con pagina opcional (entero >= 1, si no 1); lee la cookie loc; se monta en <Suspense fallback={<StoresDirectorySkeleton />}>"
    output: "total de comercios, rejilla de StoreCard (destacados primero sin repetirse) y Pagination hacia /tiendas?pagina={n}; sin comercios, un aviso; un error de la API sube a app/error.tsx"
    source: "listNearbyStores() de lib/marketplace con geo de getEffectiveLocation() (cookie loc) y la página de la URL"
    rules: ["RN-STORE-02", "RN-STORE-04", "RN-STORE-05"]
  - intent: "mostrar la cabecera de la página de una tienda con su horario y contacto"
    intent_aliases: ["pagina de tienda", "datos de la tienda", "horario de tienda", "portada de tienda", "contacto de tienda"]
    entrypoint: "<StoreHeader />"
    file: "features/store/components/StoreHeader.tsx"
    input: "store: Store; children opcional (la página monta ahí el botón de favorito)"
    output: "portada si es premium y trae cover_url; tarjeta con logo si es premium (si no, iniciales), h1 con el nombre, company_name, dirección y ciudad, h2 'Horario' con las líneas de formatSchedule(), ContactButtons sin producto y children; no pinta abierto o cerrado porque Store no trae is_open"
    source: "Store de getStore() (cacheado por slug, sin ubicación)"
    rules: ["RN-STORE-01", "RN-STORE-04"]
  - intent: "listar los productos de una tienda con paginación"
    intent_aliases: ["productos de la tienda", "catalogo de tienda", "precios de una tienda"]
    entrypoint: "<StoreProducts />"
    file: "features/store/components/StoreProducts.tsx"
    input: "slug: string; searchParams con pagina opcional (entero >= 1, si no 1); se monta en <Suspense fallback={<StoreProductsSkeleton />}>"
    output: "sección 'Productos': tasa, rejilla de 2 a 4 columnas con una tarjeta por producto (miniatura ProductThumb, enlace a /p/{slug}, USD, Bs, 'Pocas unidades', 'Requiere récipe' y antigüedad); 'Anterior' y 'Siguiente' a /tienda/{slug}?pagina={n}; sin productos (meta.total 0), el aviso de tienda sin productos publicados"
    source: "getStore({ slug, page }) de lib/marketplace"
    rules: []
  - intent: "armar el JSON-LD de una tienda"
    intent_aliases: ["json-ld tienda", "seo de tienda", "openinghoursspecification", "schema.org store"]
    entrypoint: "storeJsonLd()"
    file: "features/store/lib/jsonld.ts"
    input: "store: Store"
    output: "Store con name, url absoluta, PostalAddress, GeoCoordinates, telephone si hay, openingHoursSpecification si hay tramos e image con logo_url sólo si es premium"
    source: "Store de getStore()"
    rules: ["RN-STORE-04"]
---

# Módulo `store`

## 1. Propósito

Las tiendas: la lista "Tiendas cercanas" de la portada según la cookie `loc`, la tarjeta de cada
tienda y la página `/tienda/[slug]` con su cabecera (portada, logo, datos, horario y contacto), sus
productos paginados, sus metadatos y su JSON-LD. No ordena ni calcula distancias ni precios: la API
entrega el orden, `distance_km`, `outside_radius` y los montos.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-STORE-01` | El logo se muestra sólo si la tienda es premium y tiene `logo_url`; si no, un círculo con la inicial en mayúscula de cada una de las dos primeras palabras del nombre. | `features/store/__tests__/StoreCard.test.tsx` ("toma las iniciales de las dos primeras palabras del nombre", "premium sin logo muestra las iniciales", "no premium con logo_url muestra las iniciales y no el logo"); el logo y las iniciales de StoreHeader.tsx aplican la misma regla, pendiente: sin prueba |
| `RN-STORE-02` | El primer destacado va en el bloque patrocinado, el segundo abre la lista con "Destacado" y ninguno se repite si también viene en `data`. | `features/store/__tests__/NearbyStores.test.tsx` ("el primer destacado va en el bloque patrocinado y no se repite en la lista", "el segundo destacado abre la lista con la etiqueta Destacado") |
| `RN-STORE-05` | El estado abierto o cerrado y la hora de cierre se muestran tal como los entrega la API; sin `is_open` no hay etiqueta. | `features/store/__tests__/StoreCard.test.tsx` ("muestra Abierto con la hora de cierre que entrega la API", "muestra Cerrado si la API dice que no está abierta y nada si no informa") |
| `RN-STORE-03` | Una tienda fuera del radio lleva la etiqueta "Fuera de tu zona". | `features/store/__tests__/StoreCard.test.tsx` ("una tienda con outside_radius muestra Fuera de tu zona") |
| `RN-STORE-04` | La portada (en la tarjeta y en la cabecera), la imagen Open Graph y la imagen del JSON-LD de una tienda salen sólo si es premium. | `features/store/__tests__/StoreCard.test.tsx` ("muestra la portada sólo si la tienda es premium y la trae"), `features/store/__tests__/jsonld.test.ts` ("una tienda premium con logo trae image", "una tienda sin premium no trae image aunque tenga logo_url"); la portada de `StoreHeader.tsx` y la imagen Open Graph de `app/tienda/[slug]/page.tsx`, pendiente: sin prueba |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Datos o aspecto de la tarjeta, logo o etiqueta de abierto | `components/StoreCard.tsx` (`StoreOpenBadge`), `components/StoreLogo.tsx` | `__tests__/StoreCard.test.tsx`; la distancia sólo por `formatDistance`; los colores de la banda son tokens |
| Cuándo se muestra el logo o cómo salen las iniciales | `StoreLogo` en `components/StoreLogo.tsx`, `logoUrl` en `components/StoreHeader.tsx`; `storeInitials` en `lib/initials.ts` | los casos de RN-STORE-01 en `__tests__/StoreCard.test.tsx` |
| Qué se pide a la API, cuántos comercios salen o el bloque patrocinado | la llamada a `listNearbyStores`, `MAX_STORES` en `components/NearbyStores.tsx` y `components/SponsoredStore.tsx` | `__tests__/NearbyStores.test.tsx`; las claves de la consulta las fija `storesQuery` de `lib/marketplace/params.ts` |
| Títulos, "Ver todos" o aviso sin comercios | `components/NearbyStores.tsx` | el `getByRole("heading")` de `e2e/search.spec.ts` |
| Directorio `/tiendas`: página, orden de pintado, enlaces de paginación o aviso | `components/StoresDirectory.tsx`; metadatos en `app/tiendas/page.tsx` | `__tests__/StoresDirectory.test.tsx` y el caso de `/tiendas` de `e2e/site.spec.ts`; las rejillas de `NearbyStores` y `StoresDirectory` fijan `grid-cols-[minmax(0,1fr)]` en móvil (L-08) |
| Texto del horario o días en el JSON-LD | `formatSchedule` y `openingHoursJsonLd` en `lib/schedule.ts` | `__tests__/schedule.test.ts` |
| Campos del JSON-LD de tienda | `storeJsonLd` en `lib/jsonld.ts` | `__tests__/jsonld.test.ts`; se serializa sólo con `serializeJsonLd` de `lib/jsonld.ts` |
| Tarjeta de producto, paginación o `pagina` | `components/StoreProducts.tsx` | `__tests__/StoreProducts.test.tsx`; montos sólo por `formatUsd`/`formatVes` |
| Título, descripción, canónica, imagen OG, 404 o slugs prerenderizados | `generateMetadata` y `generateStaticParams` en `app/tienda/[slug]/page.tsx` | la regla `.claude/rules/seo.md`; comprobar el 404 con `next start` (no con `next dev`) |

## 4. API pública

- `StoreCard({ store, featured }: { store: NearbyStore; featured?: boolean })`, `features/store/components/StoreCard.tsx`
- `NearbyStores(): Promise<React.JSX.Element | null>`, Server Component sin props, `features/store/components/NearbyStores.tsx`; `null` ante `MarketplaceUnavailableError`
- `SponsoredStore({ store }: { store: NearbyStore })`, `features/store/components/SponsoredStore.tsx`: enlace a `/tienda/{slug}` con "PATROCINADO", logo, nombre, ciudad y distancia, etiqueta de abierto y "Ver tienda"
- `StoreLogo({ store, className }: { store: NearbyStore; className: string })`, `features/store/components/StoreLogo.tsx`
- `StoreOpenBadge({ store }: { store: NearbyStore })`, `features/store/components/StoreCard.tsx`
- `NearbyStoresSkeleton()`, fallback de `NearbyStores`, `features/store/components/NearbyStores.tsx`
- `StoresDirectory({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<React.JSX.Element>`, Server Component, `features/store/components/StoresDirectory.tsx`
- `StoresDirectorySkeleton()`, fallback de `StoresDirectory`, `features/store/components/StoresDirectory.tsx`
- `storeInitials(name: string): string`, `features/store/lib/initials.ts`
- `formatSchedule(entries: ScheduleEntry[]): string[]`, `features/store/lib/schedule.ts`
- `openingHoursJsonLd(entries: ScheduleEntry[]): object[]`, `features/store/lib/schedule.ts`
- `storeJsonLd(store: Store): object`, `features/store/lib/jsonld.ts`
- `StoreHeader({ store, children }: { store: Store; children?: ReactNode })`, `features/store/components/StoreHeader.tsx`
- `StoreProducts({ slug, searchParams }: { slug: string; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<React.JSX.Element>`, Server Component, `features/store/components/StoreProducts.tsx`
- `StoreProductsSkeleton()`, fallback de `StoreProducts`, `features/store/components/StoreProducts.tsx`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Tarjeta | `components/StoreCard.tsx` | `Card` sin relleno dentro de un `<Link>` (foco en `--foreground`, `hover:shadow-raised`): portada `h-20` si es premium y trae `cover_url` y, debajo, una fila con `StoreLogo` (`size-12`), textos truncados y `StoreOpenBadge` a la derecha |
| Logo | `components/StoreLogo.tsx` | `next/image` si la tienda es premium y trae `logo_url`; si no, un bloque con las iniciales de `storeInitials` |
| Iniciales | `lib/initials.ts` | primeras letras de las dos primeras palabras del nombre, en mayúscula |
| Consulta de cercanas | `components/NearbyStores.tsx` | `listNearbyStores({ geo, radiusKm: geo ? DEFAULT_RADIUS_KM : null, page: 1 })` |
| Orden de pintado | `components/NearbyStores.tsx` | `featured[0]` en `SponsoredStore`; el resto de `featured` y después `data` sin los slugs destacados, hasta `MAX_STORES` (6) |
| Patrocinada | `components/SponsoredStore.tsx` | tarjeta enlace con `PATROCINADO`, `StoreLogo` (`size-14`) y `Ver tienda` por `buttonVariants` sobre un `<span>` (no hay botón anidado) |
| Horario | `lib/schedule.ts` | `Lun`...`Dom`; tres o más días seguidos como `Lun a Sáb`, el resto separados por `, `; sin tramos, "Horario no informado"; días en inglés para `OpeningHoursSpecification` |
| JSON-LD | `lib/jsonld.ts` | `Store` con URL absoluta por `SITE_URL`, `PostalAddress` con `addressCountry: "VE"` y `GeoCoordinates` |
| Cabecera | `components/StoreHeader.tsx` | portada sobre una tarjeta con logo (sólo premium), `h1`, razón social, dirección, `h2` "Horario", `ContactButtons` con `product: null` y `children` (el favorito de la página) |
| Productos | `components/StoreProducts.tsx` | `pagina` a entero, `getStore({ slug, page })`, tasa, tarjetas con `ProductThumb` (con `AddToCartButton` si el carrito está encendido, la tienda tiene `accepts_orders` y el producto no tiene restricción, `RN-CART-03`), "Anterior" y "Siguiente" |
| Directorio | `components/StoresDirectory.tsx` | `pagina` a entero, `listNearbyStores({ geo, radiusKm: geo ? DEFAULT_RADIUS_KM : null, page })`, destacados primero y sin repetirse, total y `Pagination` de `features/search` con `hrefForPage` a `/tiendas` (la página 1 sin parámetro) |
| Página del directorio | `app/tiendas/page.tsx` | `h1` "Tiendas", canónica `/tiendas` sin parámetros, indexable, y `StoresDirectory` en `<Suspense>`; sin `loading.tsx` |
| Página | `app/tienda/[slug]/page.tsx` | `generateStaticParams` (20 slugs de `listSitemap` o `__vacio`), `generateMetadata`, JSON-LD, `StoreHeader` (con `FavoriteButton` de `features/account` como hijo), `ViewBeacon` con `store_view` y `StoreProducts` en `<Suspense>` |

## 6. Dependencias

- `lib/marketplace/client.ts`: `listNearbyStores()` en `NearbyStores.tsx` (que atrapa `MarketplaceUnavailableError` de `lib/marketplace/errors.ts`), `getStore()` en `StoreProducts.tsx` y en la página, que usa además `listSitemap()`.
- `lib/marketplace/params.ts` (`DEFAULT_RADIUS_KM`) y `lib/marketplace/schemas.ts` (`NearbyStore`, `Store`, `StoreProduct`, `ScheduleEntry`).
- `features/location/server/location.ts` (`getEffectiveLocation`) y `features/location/lib/cookie.ts` (`toGeoFilter`).
- `features/events/components/ContactButtons.tsx` en `StoreHeader.tsx` y `features/events/components/ViewBeacon.tsx` en la página.
- `lib/format.ts` (`formatDistance`, `formatRate`, `formatUsd`, `formatVes`, `formatUpdatedAgo`), `lib/jsonld.ts` (`serializeJsonLd`, en la página) y `lib/site.ts` (`SITE_NAME`, `SITE_URL`).
- `components/ui/badge.tsx`, `components/ui/button.tsx`, `components/ui/card.tsx` y `components/ui/skeleton.tsx`; `lib/utils.ts` (`cn`) en `StoreLogo`.
- `features/search/components/ProductThumb.tsx` en `StoreProducts.tsx` y `features/search/components/Pagination.tsx` en `StoresDirectory.tsx`; `FavoriteButton` de `features/account` lo monta la página.
- `next/link`, `next/image` (en `StoreLogo` y `StoreHeader`) y `next/navigation`.

## 7. Ejemplo de uso

```tsx
const { slug } = await params;
const response = await getStore({ slug, page: 1 });
if (response === null) notFound();

<StoreHeader store={response.data} />
<Suspense fallback={<StoreProductsSkeleton />}>
  <StoreProducts slug={slug} searchParams={searchParams} />
</Suspense>
```

## 8. Restricciones

- `NearbyStores` lee la cookie `loc`: va siempre dentro de un `<Suspense>` (`cacheComponents: true`) y nunca dentro de `'use cache'`.
- La ubicación sale de `getEffectiveLocation`: una ciudad que no reconoce llega como sin ubicación (RN-LOCATION-04), así que se pide sin `geo` ni radio y el título es el nacional.
- El orden de las tiendas, `distance_km` y `outside_radius` los entrega la API; aquí sólo se quitan los destacados repetidos y se formatea la distancia.
- `StoreCard` muestra la portada (`cover_url`) sólo de una tienda premium, también en el inicio; `/tiendas` es indexable (canónica sin `pagina`) y entra al grupo `static` del sitemap, y sus errores de API llegan a `app/error.tsx` (regla `app-router` 7), a diferencia de `NearbyStores`.
- `NearbyStores` es un bloque secundario del inicio: ante `MarketplaceUnavailableError` no se pinta (regla `app-router` 7). El estado abierto y la hora de cierre llegan de la API y no se calculan aquí.
- Logo y portada sólo para premium porque es parte de lo que la tienda premium recibe (spec §5.4); `logo_url` y `cover_url` de una tienda sin premium se ignoran.
- Logo y portada van por `next/image`: su dominio tiene que estar en `images.remotePatterns` de `next.config.ts` (spec §4.5).
- La página hace `await params` y `getStore({ slug, page: 1 })` fuera de `<Suspense>` para que `notFound()` dé 404 antes del primer byte; `app/tienda/` no lleva `loading.tsx`. `generateStaticParams` devuelve al menos un slug porque con Cache Components un arreglo vacío rompe el build.
- Metadatos, cabecera y JSON-LD no dependen de la cookie ni de `pagina`: la canónica es `/tienda/{slug}` también en `?pagina=2`.
- `Store` (`getStore`) no trae `is_open` ni `closes_at`: la cabecera muestra sólo el horario formateado y no calcula el estado en el frontend.
- `new Date()` en `StoreProducts` va después de leer `searchParams`; si no, el prerender falla.

## 9. Pruebas

- Comando: `npx vitest run features/store`; el 404, con `next build` y `next start`.
- `features/store/__tests__/StoreCard.test.tsx`: iniciales "FS", premium sin logo y no premium con `logo_url` muestran iniciales, "Destacado" con `featured`, "Fuera de tu zona" con `outside_radius` y "Abierto" o "Cerrado" según `is_open`.
- `features/store/__tests__/SponsoredStore.test.tsx`: enlace a la tienda con "PATROCINADO" y "Ver tienda" sin botón anidado, sin `is_open` no hay estado y `outside_radius` no pinta "Fuera de tu zona".
- `features/store/__tests__/StoresDirectory.test.tsx`: destacados primero sin repetirse, "Siguiente" y "Anterior" a `/tiendas`, `pagina` de la URL (inválida cae a 1) y aviso sin comercios.
- `features/store/__tests__/NearbyStores.test.tsx`: patrocinado sin repetirse, segundo destacado en la lista, sin patrocinado, API caída sin pintar nada y otros errores relanzados.
- `features/store/__tests__/schedule.test.ts`: `Lun a Sáb`, `Sáb, Dom`, "Horario no informado" y los días en inglés.
- `features/store/__tests__/jsonld.test.ts`: `image` sólo premium con logo, sin `telephone` cuando falta.
- `features/store/__tests__/StoreProducts.test.tsx`: productos con sus precios, "Siguiente" sin "Anterior" en la página 1 de 2, `pagina=abc` pide la página 1.
- `e2e/site.spec.ts`: `/tiendas` llega desde "Ver todos" del inicio, lista tiendas y tiene canónica e indexable.
- `e2e/search.spec.ts` (`npx playwright test`): la portada muestra los productos, el patrocinado y el bloque de comercios.
