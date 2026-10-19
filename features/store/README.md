---
module: "store"
path: "features/store"
type: "feature"
exports: ["PremiumSeal", "StoreCard", "NearbyStores", "NearbyStoresSkeleton", "SponsoredStore", "StoreLogo", "StoreOpenBadge", "storeInitials", "formatSchedule", "openingHoursJsonLd", "storeJsonLd", "StoreHeader", "StoreProducts", "StoreProductsSkeleton", "StoreCategoryNav", "StoresDirectory", "StoresDirectorySkeleton"]
depends_on: ["features/ads/components/AdImpression.tsx", "features/ads/components/AdLink.tsx", "features/ads/components/AdBanner.tsx", "features/ads/components/SlotBanner.tsx", "app/tienda/[slug]/page.tsx", "features/location/components/OutOfRangeNotice.tsx", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/jsonld.ts", "lib/site.ts", "features/location/lib/cookie.ts", "features/location/server/location.ts", "features/events/components/ContactButtons.tsx", "features/events/components/ViewBeacon.tsx", "components/ui/badge.tsx", "components/ui/button.tsx", "components/ui/card.tsx", "lib/utils.ts", "components/ui/skeleton.tsx", "features/cart/components/AddToCartButton.tsx", "features/cart/lib/flag.ts", "features/search/components/ProductThumb.tsx", "features/search/components/Pagination.tsx", "components/EmptyState.tsx"]
tests: "features/store/__tests__/*.test.{ts,tsx}"
verified_against: ["features/ads/components/AdImpression.tsx", "features/ads/components/AdLink.tsx", "features/ads/components/AdBanner.tsx", "features/ads/components/SlotBanner.tsx", "features/location/components/OutOfRangeNotice.tsx", "features/store/components/PremiumSeal.tsx", "features/store/components/StoreCard.tsx", "features/store/components/StoreLogo.tsx", "features/store/components/NearbyStores.tsx", "features/store/components/SponsoredStore.tsx", "features/store/lib/initials.ts", "features/store/lib/schedule.ts", "features/store/lib/jsonld.ts", "features/store/components/StoreHeader.tsx", "features/store/components/StoreProducts.tsx", "features/store/components/StoreCategoryNav.tsx", "features/search/components/ProductThumb.tsx", "features/store/components/StoresDirectory.tsx", "features/search/components/Pagination.tsx", "app/tiendas/page.tsx", "app/page.tsx", "app/tienda/[slug]/page.tsx", "lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/jsonld.ts", "lib/site.ts", "features/location/lib/cookie.ts", "features/location/server/location.ts", "features/events/components/ContactButtons.tsx", "features/events/components/ViewBeacon.tsx", "components/ui/badge.tsx", "components/ui/button.tsx", "components/ui/card.tsx", "lib/utils.ts", "components/ui/skeleton.tsx", "components/EmptyState.tsx"]
verified_at: "9dba4d6"
capabilities:
  - intent: "mostrar la tienda patrocinada y los comercios cercanos en la portada"
    intent_aliases: ["tiendas cercanas", "tiendas cerca de mi", "comercios cercanos", "tiendas destacadas"]
    entrypoint: "<NearbyStores />"
    file: "features/store/components/NearbyStores.tsx"
    input: "sin props; lee la cookie loc; se monta dentro de <Suspense fallback={<NearbyStoresSkeleton />}>"
    output: "tarjeta Patrocinado con el sponsored de la respuesta (espacio home_stores_native; sin sponsored no hay tarjeta) y sección 'Comercios cerca' (con ubicación) o 'Comercios en {SITE_NAME}' (sin ella): todos los destacados primero como 'Destacado', hasta 6 StoreCard en rejilla sm:2 lg:3 y 'Ver todos' a /tiendas; sin comercios, un EmptyState (components/EmptyState.tsx) que invita a probar otra ciudad; con la API caída no pinta nada"
    source: "listNearbyStores() de lib/marketplace con geo de getEffectiveLocation() (cookie loc)"
    rules: ["RN-STORE-02"]
  - intent: "mostrar la tarjeta de una tienda"
    intent_aliases: ["tarjeta de tienda", "logo de tienda", "iniciales de tienda", "fuera de tu zona"]
    entrypoint: "<StoreCard />"
    file: "features/store/components/StoreCard.tsx"
    input: "store: NearbyStore; featured?: boolean"
    output: "Card como enlace a /tienda/{slug}: franja de portada siempre (cover_url o relleno bg-muted) con las insignias encima, y en fila logo o iniciales, nombre, sello 'Aliado PosVen' si is_premium, city.name, distancia si no es null, 'Destacado' si featured, 'Fuera de tu zona' si outside_radius y, si la API informa is_open, 'Abierto' (con 'hasta {closes_at}') o 'Cerrado'"
    source: "props"
    rules: ["RN-STORE-01", "RN-STORE-03", "RN-STORE-06"]
  - intent: "listar todas las tiendas cercanas con paginación"
    intent_aliases: ["directorio de tiendas", "todas las tiendas", "pagina tiendas", "comercios cercanos paginados"]
    entrypoint: "<StoresDirectory />"
    file: "features/store/components/StoresDirectory.tsx"
    input: "searchParams con pagina opcional (entero >= 1, si no 1); lee la cookie loc; se monta en <Suspense fallback={<StoresDirectorySkeleton />}>"
    output: "total de comercios, rejilla de StoreCard (destacados primero sin repetirse), la tarjeta Patrocinado del sponsored de stores_native después de los destacados y Pagination hacia /tiendas?pagina={n}; sin comercios, un EmptyState (components/EmptyState.tsx) con 'No hay más comercios.' y una meta robots noindex desde la página 2; un error de la API sube a app/error.tsx"
    source: "listNearbyStores() de lib/marketplace con geo de getEffectiveLocation() (cookie loc) y la página de la URL"
    rules: ["RN-STORE-02", "RN-STORE-04", "RN-STORE-05"]
  - intent: "mostrar la cabecera de la página de una tienda con su horario y contacto"
    intent_aliases: ["pagina de tienda", "datos de la tienda", "horario de tienda", "portada de tienda", "contacto de tienda"]
    entrypoint: "<StoreHeader />"
    file: "features/store/components/StoreHeader.tsx"
    input: "store: Store; children opcional (la página monta ahí el botón de favorito)"
    output: "portada si trae cover_url; tarjeta con logo si trae logo_url (si no, iniciales), h1 con el nombre, sello 'Aliado PosVen' si is_premium, company_name, 'Abierta' (con 'hasta {closes_at}') o 'Cerrada ahora' si la API informa is_open, dirección y ciudad, h2 'Horario' con las líneas de formatSchedule(), ContactButtons sin producto y children"
    source: "Store de getStore() (cacheado por slug, sin ubicación)"
    rules: ["RN-STORE-01", "RN-STORE-04", "RN-STORE-06"]
  - intent: "listar los productos de una tienda con paginación"
    intent_aliases: ["productos de la tienda", "catalogo de tienda", "precios de una tienda"]
    entrypoint: "<StoreProducts />"
    file: "features/store/components/StoreProducts.tsx"
    input: "slug: string; searchParams con pagina opcional (entero >= 1, si no 1) y categoria opcional (slug de una categoría raíz); se monta en <Suspense fallback={<StoreProductsSkeleton />}>"
    output: "sección 'Productos': tasa, StoreCategoryNav si la respuesta trae categories (barra lateral desde md, chips en móvil), rejilla de 2 a 4 columnas con una tarjeta por producto (miniatura ProductThumb, enlace a /p/{slug}, USD, Bs, 'Pocas unidades', 'Requiere récipe' y antigüedad); 'Anterior' y 'Siguiente' a /tienda/{slug}?pagina={n} (con &categoria= si hay filtro); una categoría sin productos conserva la barra y avisa; sin productos y sin filtro (meta.total 0), un EmptyState (components/EmptyState.tsx) de tienda sin productos publicados"
    source: "getStore({ slug, page, category }) de lib/marketplace"
    rules: []
  - intent: "filtrar los productos de una tienda por categoría con conteos"
    intent_aliases: ["categorias de la tienda", "barra lateral de categorias", "chips de categorias", "filtrar tienda por categoria"]
    entrypoint: "<StoreCategoryNav />"
    file: "features/store/components/StoreCategoryNav.tsx"
    input: "slug: string; categories: StoreCategories (de getStore); activeCategory: string | null"
    output: "nav 'Categorías de la tienda': 'Todo' con categories.total y una categoría raíz por ítem con su conteo, en el orden de la API; barra vertical desde md y chips horizontales con desplazamiento en móvil; la activa lleva aria-current='page'; los enlaces van a /tienda/{slug}?categoria={slug} (sin pagina)"
    source: "props; los conteos los calcula la API"
    rules: []
  - intent: "armar el JSON-LD de una tienda"
    intent_aliases: ["json-ld tienda", "seo de tienda", "openinghoursspecification", "schema.org store"]
    entrypoint: "storeJsonLd()"
    file: "features/store/lib/jsonld.ts"
    input: "store: Store"
    output: "Store con name, url absoluta, PostalAddress, GeoCoordinates, telephone si hay, openingHoursSpecification si hay tramos e image con logo_url si lo trae"
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
| `RN-STORE-01` | El logo se muestra si la tienda tiene `logo_url`, sea premium o no; si no, un círculo con la inicial en mayúscula de cada una de las dos primeras palabras del nombre. | `features/store/__tests__/StoreCard.test.tsx` ("toma las iniciales de las dos primeras palabras del nombre", "premium sin logo muestra las iniciales", "con logo_url muestra el logo, premium o no"), `features/store/__tests__/StoreHeader.test.tsx` ("muestra el logo si la tienda lo trae aunque no sea premium") |
| `RN-STORE-02` | La tarjeta patrocinada es el `sponsored` de la respuesta (nunca un `featured`): sin él no se pinta; todos los `featured` van a la lista como "Destacado"; ninguna tienda se repite entre `sponsored`, `featured` y `data`. | `features/store/__tests__/NearbyStores.test.tsx` ("pide el espacio home_stores_native y pinta sponsored arriba sin repetirlo en la lista", "todos los destacados van a la lista como Destacado y sin sponsored no hay bloque patrocinado") y `features/store/__tests__/StoresDirectory.test.tsx` ("pinta sponsored (stores_native) tras los destacados y sin repetirlo", "sin sponsored no hay tarjeta patrocinada") |
| `RN-STORE-03` | Una tienda fuera del radio lleva la etiqueta "Fuera de tu zona". | `features/store/__tests__/StoreCard.test.tsx` ("una tienda con outside_radius muestra Fuera de tu zona") |
| `RN-STORE-04` | La portada (tarjeta y cabecera) sale si la tienda trae `cover_url`; la imagen Open Graph y la del JSON-LD, si trae `logo_url` (la portada no las alimenta). Premium no condiciona ninguna. | `features/store/__tests__/StoreCard.test.tsx` ("muestra la portada si la tienda la trae, premium o no"), `features/store/__tests__/jsonld.test.ts` ("una tienda premium con logo trae image", "una tienda sin premium con logo también trae image", "sin logo no trae image"), `features/store/__tests__/StoreHeader.test.tsx` ("muestra la portada si la tienda la trae, premium o no", "no muestra la portada si la tienda no la trae"), `features/store/__tests__/storeMetadata.test.ts` ("una tienda premium con logo trae la imagen Open Graph", "una tienda sin premium con logo también trae la imagen Open Graph", "sin logo no trae Open Graph aunque tenga portada") |
| `RN-STORE-05` | El estado y la hora de cierre salen tal como los entrega la API, en la tarjeta ("Abierto · hasta HH:MM", "Cerrado") y en la cabecera ("Abierta · hasta HH:MM", "Cerrada ahora"); sin `is_open` no hay etiqueta. | `features/store/__tests__/StoreCard.test.tsx` ("muestra Abierto con la hora de cierre que entrega la API", "muestra Cerrado si la API dice que no está abierta y nada si no informa"), `features/store/__tests__/StoreHeader.test.tsx` ("muestra Abierta con la hora de cierre que entrega la API", "muestra Abierta sin hora si la API no trae closes_at", "muestra Cerrada ahora si la API dice que no está abierta y nada si no informa") |
| `RN-STORE-06` | El sello "Aliado PosVen" (icono de apretón de manos y texto) sale junto al nombre de una tienda con `is_premium`: en la tarjeta, el bloque patrocinado, la cabecera y la oferta; sin `is_premium` no sale. | `features/store/__tests__/StoreCard.test.tsx`, `features/store/__tests__/SponsoredStore.test.tsx`, `features/store/__tests__/StoreHeader.test.tsx`, `features/store/__tests__/NearbyStores.test.tsx` (destacados premium) y `features/product/__tests__/OfferCard.test.tsx` (los casos "el sello Aliado PosVen sale sólo si la tienda es premium") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Datos o aspecto de la tarjeta, logo o etiqueta de abierto | `components/StoreCard.tsx` (`StoreOpenBadge`), `components/StoreLogo.tsx` | `__tests__/StoreCard.test.tsx`; la distancia sólo por `formatDistance`; los colores de la banda son tokens |
| Sello "Aliado PosVen" | `components/PremiumSeal.tsx` y su montaje en `StoreCard`, `SponsoredStore`, `StoreHeader` y `features/product/components/OfferCard.tsx` | los casos de RN-STORE-06 en los cinco tests |
| Cuándo se muestra el logo o cómo salen las iniciales | `StoreLogo` en `components/StoreLogo.tsx`, `logoUrl` en `components/StoreHeader.tsx`; `storeInitials` en `lib/initials.ts` | los casos de RN-STORE-01 en `__tests__/StoreCard.test.tsx` |
| Qué se pide a la API, cuántos comercios salen o el bloque patrocinado | la llamada a `listNearbyStores` (con `placement`), `MAX_STORES` en `components/NearbyStores.tsx` y `components/SponsoredStore.tsx` | `__tests__/NearbyStores.test.tsx`; las claves de la consulta las fija `storesQuery` de `lib/marketplace/params.ts` |
| Títulos, "Ver todos" o aviso sin comercios | `components/NearbyStores.tsx` | el `getByRole("heading")` de `e2e/search.spec.ts` |
| Directorio `/tiendas`: página, orden de pintado, enlaces de paginación o aviso | `components/StoresDirectory.tsx`; metadatos en `app/tiendas/page.tsx` | `__tests__/StoresDirectory.test.tsx` y el caso de `/tiendas` de `e2e/site.spec.ts`; las rejillas de `NearbyStores` y `StoresDirectory` fijan `grid-cols-[minmax(0,1fr)]` en móvil (L-08) y estiran las tarjetas a la altura de su fila |
| Texto del horario o días en el JSON-LD | `formatSchedule` y `openingHoursJsonLd` en `lib/schedule.ts` | `__tests__/schedule.test.ts` |
| Campos del JSON-LD de tienda | `storeJsonLd` en `lib/jsonld.ts` | `__tests__/jsonld.test.ts`; se serializa sólo con `serializeJsonLd` de `lib/jsonld.ts` |
| Tarjeta de producto, paginación, `pagina` o `categoria` | `components/StoreProducts.tsx` | `__tests__/StoreProducts.test.tsx`; montos sólo por `formatUsd`/`formatVes` |
| Barra o chips de categorías | `components/StoreCategoryNav.tsx` | los casos de categorías en `__tests__/StoreProducts.test.tsx`; los conteos y el orden son de la API |
| Título, descripción, canónica, imagen OG, 404 o slugs prerenderizados | `generateMetadata` y `generateStaticParams` en `app/tienda/[slug]/page.tsx` | la regla `.claude/rules/seo.md`; comprobar el 404 con `next start` (no con `next dev`) |

## 4. API pública

- `PremiumSeal({ className }: { className?: string })`, `features/store/components/PremiumSeal.tsx`: sello "Aliado PosVen" con el icono `Handshake`; quien lo usa decide con `is_premium`
- `StoreCard({ store, featured }: { store: NearbyStore; featured?: boolean })`, `features/store/components/StoreCard.tsx`
- `NearbyStores(): Promise<React.JSX.Element | null>`, Server Component sin props, `features/store/components/NearbyStores.tsx`; `null` ante `MarketplaceUnavailableError`
- `SponsoredStore({ store }: { store: SponsoredStore })` (el tipo de `lib/marketplace/schemas.ts`, importado con alias `SponsoredStoreData`), `features/store/components/SponsoredStore.tsx`: dentro de `AdImpression` y `AdLink` de `features/ads` (`ad_impression` y `ad_click` con `store.token`), enlace interno a `/tienda/{slug}` con "Patrocinado", logo, nombre, ciudad y distancia, etiqueta de abierto y "Ver tienda"
- `StoreLogo({ store, className }: { store: Pick<StoreSummary, "name" | "logo_url">; className: string })`, `features/store/components/StoreLogo.tsx`
- `StoreOpenBadge({ store }: { store: NearbyStore })`, `features/store/components/StoreCard.tsx`
- `NearbyStoresSkeleton()`, fallback de `NearbyStores`, `features/store/components/NearbyStores.tsx`
- `StoresDirectory({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<React.JSX.Element>`, Server Component, `features/store/components/StoresDirectory.tsx`
- `StoresDirectorySkeleton()`, fallback de `StoresDirectory`, `features/store/components/StoresDirectory.tsx`
- `storeInitials(name: string): string`, `features/store/lib/initials.ts`
- `formatSchedule(entries: ScheduleEntry[]): string[]`, `features/store/lib/schedule.ts`
- `openingHoursJsonLd(entries: ScheduleEntry[]): object[]`, `features/store/lib/schedule.ts`
- `storeJsonLd(store: Store): object`, `features/store/lib/jsonld.ts`
- `StoreHeader({ store, children }: { store: Store; children?: ReactNode })`, `features/store/components/StoreHeader.tsx`
- `StoreCategoryNav({ slug, categories, activeCategory }: { slug: string; categories: StoreCategories; activeCategory: string | null })`, Server Component, `features/store/components/StoreCategoryNav.tsx`
- `StoreProducts({ slug, searchParams }: { slug: string; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<React.JSX.Element>`, Server Component, `features/store/components/StoreProducts.tsx`
- `StoreProductsSkeleton()`, fallback de `StoreProducts` (cuatro `Card` con la misma estructura y grilla que la tarjeta de producto: fila en móvil, tarjeta desde `md`), `features/store/components/StoreProducts.tsx`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Tarjeta | `components/StoreCard.tsx` | `Card` sin relleno dentro de un `<Link>` (foco en `--foreground`, `hover:shadow-raised`): franja `h-20` siempre (`cover_url` o relleno `bg-muted`) con las insignias encima (`StoreOpenBadge`, "Destacado", "Fuera de tu zona", `PremiumSeal`; las `secondary` sobre `bg-card` para no fundirse con el relleno) y, debajo, `StoreLogo` (`size-12`) con nombre y ubicación truncados: todas las tarjetas miden lo mismo |
| Sello | `components/PremiumSeal.tsx` | `span` con `Handshake` de `lucide-react` y "Aliado PosVen", en `bg-primary-soft`; lo montan `StoreCard`, `SponsoredStore`, `StoreHeader` y `OfferCard` si `store.is_premium` |
| Logo | `components/StoreLogo.tsx` | `next/image` si la tienda trae `logo_url`; si no, un bloque con las iniciales de `storeInitials` |
| Iniciales | `lib/initials.ts` | primeras letras de las dos primeras palabras del nombre, en mayúscula |
| Consulta de cercanas | `components/NearbyStores.tsx` | `listNearbyStores({ geo, radiusKm: geo ? DEFAULT_RADIUS_KM : null, page: 1, placement: "home_stores_native" })` |
| Orden de pintado | `components/NearbyStores.tsx` | `sponsored` en `SponsoredStore`; todos los `featured` (menos el slug patrocinado) y después `data` sin los slugs destacados ni el patrocinado, hasta `MAX_STORES` (6) |
| Patrocinada | `components/SponsoredStore.tsx` | tarjeta enlace (`AdLink`, dentro de `AdImpression`) con `SPONSORED_LABEL`, `StoreLogo` (`size-14`) y `Ver tienda` por `buttonVariants` sobre un `<span>` (no hay botón anidado) |
| Horario | `lib/schedule.ts` | `Lun`...`Dom`; tres o más días seguidos como `Lun a Sáb`, el resto separados por `, `; sin tramos, "Horario no informado"; días en inglés para `OpeningHoursSpecification` |
| JSON-LD | `lib/jsonld.ts` | `Store` con URL absoluta por `SITE_URL`, `PostalAddress` con `addressCountry: "VE"` y `GeoCoordinates` |
| Cabecera | `components/StoreHeader.tsx` | portada sobre una tarjeta con logo (si trae `logo_url`), `h1`, razón social, etiqueta de abierta o cerrada (`StoreHeaderStatus`, RN-STORE-05), dirección, `h2` "Horario", `ContactButtons` con `product: null` y `children` (el favorito de la página) |
| Categorías | `components/StoreCategoryNav.tsx` | un solo `nav` con `Link` por categoría: columna en tarjeta desde `md` y fila con desplazamiento horizontal debajo; activa con `aria-current="page"`; "Todo" enlaza a `/tienda/{slug}` y cada categoría a `?categoria=` sin `pagina` |
| Productos | `components/StoreProducts.tsx` | `pagina` a entero, `categoria` al primer valor no vacío, `getStore({ slug, page, category })`, tasa, `StoreCategoryNav` si `categories` llega (si no, la rejilla ocupa todo el ancho), aviso si la categoría no tiene productos, tarjetas con `ProductThumb` (fila en móvil con miniatura de 64 px, nombre, USD, Bs y botón, y tarjeta vertical desde `md`; `sizes`: 240 px desde 1024 px, un tercio del ancho útil desde 768 px y 64 px debajo; con `AddToCartButton` si el carrito está encendido, la tienda tiene `accepts_orders` y el producto no es `recipe`, `RN-CART-03`), "Anterior" y "Siguiente" que conservan `categoria` |
| Directorio | `components/StoresDirectory.tsx` | `pagina` a entero, `listNearbyStores({ geo, radiusKm: geo ? DEFAULT_RADIUS_KM : null, page, placement: "stores_native" })`, destacados primero y sin repetirse, `sponsored` (misma tarjeta `SponsoredStore`) como celda siguiente a los destacados, total y `Pagination` de `features/search` con `hrefForPage` a `/tiendas` (la página 1 sin parámetro) |
| Página del directorio | `app/tiendas/page.tsx` | `h1` "Tiendas", canónica `/tiendas` sin parámetros, indexable (la página fuera de rango pone `noindex` desde `StoresDirectory`: `notFound()` tras el streaming no cambia el 200), `SlotBanner` de `features/ads` (`stores_top`, en su propio `<Suspense fallback={null}>`) y `StoresDirectory` en `<Suspense>`; sin `loading.tsx` |
| Página | `app/tienda/[slug]/page.tsx` | `generateStaticParams` (20 slugs de `listSitemap` o `__vacio`), `generateMetadata`, JSON-LD, `StoreHeader` (con `FavoriteButton` de `features/account` como hijo), `ViewBeacon` con `store_view`, `SlotBanner` de `features/ads` (`store_banner` con `scope={{ store: slug }}`, tras `StoreHeader`, en su propio `<Suspense fallback={null}>`) y `StoreProducts` en `<Suspense>` |

## 6. Dependencias

- `lib/marketplace/client.ts`: `listNearbyStores()` en `NearbyStores.tsx` (que atrapa `MarketplaceUnavailableError` de `lib/marketplace/errors.ts`), `getStore()` en `StoreProducts.tsx` y en la página, que usa además `listSitemap()`.
- `lib/marketplace/params.ts` (`DEFAULT_RADIUS_KM`) y `lib/marketplace/schemas.ts` (`NearbyStore`, `SponsoredStore`, `Store`, `StoreProduct`, `ScheduleEntry`).
- `features/location/server/location.ts` (`getEffectiveLocation`) y `features/location/lib/cookie.ts` (`toGeoFilter`).
- `features/events/components/ContactButtons.tsx` en `StoreHeader.tsx` y `features/events/components/ViewBeacon.tsx` en la página.
- `lib/format.ts` (`formatDistance`, `formatRate`, `formatUsd`, `formatVes`, `formatUpdatedAgo`), `lib/jsonld.ts` (`serializeJsonLd`, en la página) y `lib/site.ts` (`SITE_NAME`, `SITE_URL`).
- `components/ui/badge.tsx`, `components/ui/button.tsx`, `components/ui/card.tsx` y `components/ui/skeleton.tsx`; `lib/utils.ts` (`cn`) en `StoreLogo`.
- `features/search/components/ProductThumb.tsx` en `StoreProducts.tsx` y `features/search/components/Pagination.tsx` en `StoresDirectory.tsx`; `FavoriteButton` de `features/account` lo monta la página.
- `lib/marketplace/schemas.ts` (`StoreCategories`) en `StoreCategoryNav.tsx`.
- `lucide-react` (`Handshake`) en `PremiumSeal`.
- `next/link`, `next/image` (en `StoreLogo` y `StoreHeader`) y `next/navigation`.
- `features/ads/components/AdImpression.tsx` y `AdLink.tsx` en `SponsoredStore.tsx` (conteo de impresión y clic), `SPONSORED_LABEL` de `AdBanner.tsx` y `SlotBanner` en `app/tiendas/page.tsx` y `app/tienda/[slug]/page.tsx`.
- `features/location/components/OutOfRangeNotice.tsx`: `NearbyStores` lo pinta antes de la lista con `meta.out_of_range === true`.

## 7. Ejemplo de uso

```tsx
const { slug } = await params;
const response = await getStore({ slug, page: 1, category: null });
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
- `StoreCard` muestra la portada (`cover_url`) de toda tienda que la trae, también en el inicio; `/tiendas` es indexable (canónica sin `pagina`) y entra al grupo `static` del sitemap, y sus errores de API llegan a `app/error.tsx` (regla `app-router` 7), a diferencia de `NearbyStores`.
- `NearbyStores` es un bloque secundario del inicio: ante `MarketplaceUnavailableError` no se pinta (regla `app-router` 7). El estado abierto y la hora de cierre llegan de la API y no se calculan aquí.
- Logo y portada salen para toda tienda publicada que los trae: la API devuelve `logo_url` con vuelta al logo de la empresa y `cover_url` sin condición premium; premium sólo decide lo destacado y el sello.
- Logo y portada van por `next/image`: su dominio tiene que estar en `images.remotePatterns` de `next.config.ts` (spec §4.5).
- Los conteos y el orden de las categorías los entrega la API; el filtro viaja como `categoria` en la URL de `/tienda/{slug}` y no entra a la canónica. La página hace `await params` y `getStore({ slug, page: 1, category: null })` fuera de `<Suspense>` para que `notFound()` dé 404 antes del primer byte; `app/tienda/` no lleva `loading.tsx`. `generateStaticParams` devuelve al menos un slug porque con Cache Components un arreglo vacío rompe el build.
- Metadatos, cabecera y JSON-LD no dependen de la cookie ni de `pagina`: la canónica es `/tienda/{slug}` también en `?pagina=2`.
- `Store` (`getStore`) trae `is_open` y `closes_at` calculados por la API: la cabecera los muestra (`StoreHeaderStatus`) y no calcula el estado en el frontend; sin `is_open` no pinta etiqueta.
- `new Date()` en `StoreProducts` va después de leer `searchParams`; si no, el prerender falla.

## 9. Pruebas

- Comando: `npx vitest run features/store`; el 404, con `next build` y `next start`.
- `features/store/__tests__/StoreCard.test.tsx`: iniciales "FS", premium sin logo muestra iniciales y con `logo_url` (premium o no) muestra el logo, "Destacado" con `featured`, "Fuera de tu zona" con `outside_radius` y "Abierto" o "Cerrado" según `is_open`.
- `features/store/__tests__/SponsoredStore.test.tsx`: enlace a la tienda con "Patrocinado" y "Ver tienda" sin botón anidado, `ad_click` con el token, sin `is_open` no hay estado y `outside_radius` no pinta "Fuera de tu zona".
- `features/store/__tests__/StoresDirectory.test.tsx`: destacados primero sin repetirse, `sponsored` tras ellos sin repetirse y sin él no hay tarjeta, "Siguiente" y "Anterior" a `/tiendas`, `pagina` de la URL (inválida, `abc`, `0` o repetida con el primero inválido cae a 1; repetida válida toma la primera), aviso sin comercios y `noindex` sólo fuera de rango.
- `features/store/__tests__/NearbyStores.test.tsx`: `sponsored` arriba sin repetirse y con el espacio `home_stores_native`, todos los destacados en la lista (premium con sello Aliado PosVen), sin patrocinado, API caída sin pintar nada y otros errores relanzados.
- `features/store/__tests__/schedule.test.ts`: `Lun a Sáb`, `Sáb, Dom`, "Horario no informado" y los días en inglés.
- Los casos de RN-STORE-06 en `StoreCard.test.tsx`, `SponsoredStore.test.tsx`, `StoreHeader.test.tsx`, `NearbyStores.test.tsx` y `features/product/__tests__/OfferCard.test.tsx`: el sello sólo con `is_premium`.
- `features/store/__tests__/jsonld.test.ts`: `image` con logo (premium o no), sin `telephone` cuando falta.
- `features/store/__tests__/storeMetadata.test.ts`: `generateMetadata` de `app/tienda/[slug]/page.tsx` con imagen Open Graph del logo (premium o no) y sin ella cuando falta el logo, aunque haya portada.
- `features/store/__tests__/StoreHeader.test.tsx`: portada y logo si la tienda los trae (premium o no), la etiqueta Abierta (con y sin hora) o Cerrada ahora según `is_open`, y los hijos pintados junto al contacto.
- `features/store/__tests__/StoreProducts.test.tsx`: productos con sus precios, "Siguiente" sin "Anterior" en la página 1 de 2, `pagina=abc` pide la página 1, y las categorías: sin `categories` no hay barra, "Todo" con el total y activa, `categoria` se pide a `getStore`, marca la activa y la paginación la conserva, y una categoría vacía conserva la barra y avisa.
- `e2e/site.spec.ts`: `/tiendas` llega desde "Ver todos" del inicio, lista tiendas y tiene canónica e indexable.
- `e2e/site.spec.ts`: `/tiendas?pagina=999` avisa "No hay más comercios." con `noindex` y la misma canónica.
- `e2e/search.spec.ts` (`npx playwright test`): la portada muestra los productos, el patrocinado y el bloque de comercios.
- `features/store/__tests__/NearbyStores.test.tsx`: el aviso de fuera de rango sólo con `meta.out_of_range` `true`.
