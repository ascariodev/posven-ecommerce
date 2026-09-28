---
module: "marketplace"
path: "lib/marketplace"
type: "integration"
exports: ["searchProducts", "listNearbyStores", "listCategories", "listLocations", "getProduct", "getProductOffers", "getStore", "listSitemap", "sendEvent", "MarketplaceUnavailableError", "RADIUS_OPTIONS", "RadiusKm", "DEFAULT_RADIUS_KM", "GeoFilter", "OfferSort", "searchQuery", "storesQuery", "productQuery", "pageQuery", "moneySchema", "Money", "rateSchema", "Rate", "availabilitySchema", "restrictionSchema", "Restriction", "categorySchema", "Category", "categoryNodeSchema", "CategoryNode", "cityRefSchema", "CityRef", "locationStateSchema", "LocationState", "storeSummarySchema", "StoreSummary", "productSchema", "Product", "offerSchema", "Offer", "searchItemSchema", "SearchItem", "pageMetaSchema", "PageMeta", "searchResponseSchema", "SearchResponse", "FeaturedProduct", "nearbyStoreSchema", "NearbyStore", "storesResponseSchema", "StoresResponse", "categoriesResponseSchema", "locationsResponseSchema", "scheduleEntrySchema", "ScheduleEntry", "storeSchema", "Store", "storeProductSchema", "StoreProduct", "storeResponseSchema", "StoreResponse", "productOfferSchema", "ProductOffer", "offersSummarySchema", "OffersSummary", "productDetailSchema", "ProductDetail", "productRedirectSchema", "productPageSchema", "ProductPage", "productResponseSchema", "ProductResponse", "sitemapTypeSchema", "SitemapType", "sitemapResponseSchema", "SitemapResponse", "eventTypeSchema", "EventType", "eventInputSchema", "EventInput", "marketplaceEventSchema", "MarketplaceEvent"]
depends_on: ["package.json", "next.config.ts", "vitest.config.mts", ".env.example"]
tests: "lib/marketplace/**/*.test.ts"
verified_against: ["lib/marketplace/schemas.ts", "lib/marketplace/params.ts", "lib/marketplace/errors.ts", "lib/marketplace/http.ts", "lib/marketplace/client.ts", "lib/marketplace/mock/fixtures.ts", "lib/marketplace/mock/adapter.ts", "next.config.ts", "vitest.config.mts", ".env.example"]
capabilities:
  - intent: "buscar productos por texto, categoría y ubicación con su precio mínimo y los destacados"
    intent_aliases: ["buscar productos", "resultados de busqueda", "search de posveapi", "productos cerca"]
    entrypoint: "searchProducts()"
    file: "lib/marketplace/client.ts"
    input: "{ q: string, category: string|null, geo: GeoFilter, radiusKm: RadiusKm|null, page: number }"
    output: "SearchResponse { data: SearchItem[], featured: { product: Product, offer: Offer }[] (máx. 2), meta: PageMeta, rate: Rate }"
    source: "GET /search de posveapi vía BFF, o el simulado con MARKETPLACE_MODE=mock"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-03"]
  - intent: "listar las tiendas cercanas o de una ciudad con su distancia y las premium destacadas"
    intent_aliases: ["tiendas cercanas", "comercios", "stores de posveapi"]
    entrypoint: "listNearbyStores()"
    file: "lib/marketplace/client.ts"
    input: "{ geo: GeoFilter, radiusKm: RadiusKm|null, page: number }"
    output: "StoresResponse { data: NearbyStore[], featured: NearbyStore[] (máx. 2), meta: PageMeta }"
    source: "GET /stores de posveapi vía BFF, o el simulado con MARKETPLACE_MODE=mock"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-03"]
  - intent: "obtener el árbol de categorías globales"
    intent_aliases: ["categorias", "taxonomia", "arbol de categorias"]
    entrypoint: "listCategories()"
    file: "lib/marketplace/client.ts"
    input: "sin parámetros"
    output: "CategoryNode[] { slug, name, parent_slug: string|null, children: CategoryNode[] }"
    source: "GET /categories de posveapi vía BFF, o el simulado; cache 'hours' con tag marketplace:categories"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02"]
  - intent: "obtener estados, municipios y ciudades con tiendas"
    intent_aliases: ["ubicaciones", "ciudades", "selector de ciudad", "locations"]
    entrypoint: "listLocations()"
    file: "lib/marketplace/client.ts"
    input: "sin parámetros"
    output: "LocationState[] { slug, name, municipalities: { slug, name, cities: CityRef[] }[] }"
    source: "GET /locations de posveapi vía BFF, o el simulado; cache 'hours' con tag marketplace:locations"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02"]
  - intent: "obtener la ficha de un producto con el resumen nacional de sus ofertas, o su slug nuevo"
    intent_aliases: ["ficha de producto", "pagina de producto", "detalle de producto", "redirect de slug"]
    entrypoint: "getProduct()"
    file: "lib/marketplace/client.ts"
    input: "slug: string"
    output: "ProductResponse | null: { redirect_to: string } o ProductPage { data: ProductDetail (Product + offers_summary { offer_count, low_price_usd: Money|null, high_price_usd: Money|null }), featured: ProductOffer[] (máx. 2), offers: ProductOffer[] (máx. 50), rate: Rate }; null si la API responde 404"
    source: "GET /products/{slug}?sort=price de posveapi vía BFF, o el simulado; cache 'hours' con tag marketplace:product:{slug}"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-04"]
  - intent: "listar las ofertas de un producto según la ubicación, por precio o por distancia"
    intent_aliases: ["ofertas de un producto", "donde comprar", "tiendas que lo venden", "comparar precios"]
    entrypoint: "getProductOffers()"
    file: "lib/marketplace/client.ts"
    input: "{ slug: string, geo: GeoFilter, radiusKm: RadiusKm|null, sort: OfferSort }"
    output: "ProductResponse | null; cada ProductOffer es Offer + outside_radius: boolean"
    source: "GET /products/{slug}?lat&lng&city&radius_km&sort de posveapi vía BFF, o el simulado; cache 'minutes' con tag marketplace:product:{slug}"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-03", "RN-MARKETPLACE-04"]
  - intent: "obtener la ficha de una tienda con sus productos y precios en esa tienda"
    intent_aliases: ["ficha de tienda", "pagina de tienda", "catalogo de una tienda", "horario de tienda"]
    entrypoint: "getStore()"
    file: "lib/marketplace/client.ts"
    input: "{ slug: string, page: number }"
    output: "StoreResponse | null: { data: Store (StoreSummary + company_name, cover_url: string|null, schedule: { days, opens, closes }[]), products: StoreProduct[] (Product + price_usd, price_ves, availability, updated_at), meta: PageMeta, rate: Rate }; null si la API responde 404"
    source: "GET /stores/{slug}?page de posveapi vía BFF, o el simulado; cache 'minutes' con tag marketplace:store:{slug}"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-04"]
  - intent: "listar los slugs de productos o tiendas para el sitemap"
    intent_aliases: ["sitemap", "slugs para indexar", "urls del sitemap"]
    entrypoint: "listSitemap()"
    file: "lib/marketplace/client.ts"
    input: "{ type: SitemapType ('products'|'stores'), page: number }"
    output: "SitemapResponse { data: { slug: string, updated_at: string }[], meta: PageMeta }"
    source: "GET /sitemap/{type}?page de posveapi vía BFF, o el simulado; cache 'hours' con tag marketplace:sitemap:{type}"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02"]
  - intent: "registrar un evento de visita o de contacto con una tienda"
    intent_aliases: ["eventos", "metricas", "click whatsapp", "vista de producto"]
    entrypoint: "sendEvent()"
    file: "lib/marketplace/client.ts"
    input: "MarketplaceEvent { type: EventType, store_slug: string|null, product_slug: string|null, session_id: uuid }"
    output: "void"
    source: "POST /events de posveapi vía BFF, sin caché; el simulado no hace nada"
    rules: ["RN-MARKETPLACE-02"]
---

# Módulo `marketplace`

## 1. Propósito

Contrato con la API de marketplace de posveapi (spec §3): esquemas zod, tipos inferidos, armado de
consultas y el cliente de servidor que el BFF usa contra la API o contra un adaptador simulado. No
renderiza, no lee cookies ni `searchParams` y no calcula montos ni distancias.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-MARKETPLACE-01` | Una respuesta de la API que no pasa su esquema zod se registra con su endpoint y se trata como API caída. | `lib/marketplace/http.test.ts` ("un cuerpo que no pasa el esquema...") |
| `RN-MARKETPLACE-02` | Toda llamada a la API lleva `Authorization: Bearer <MARKETPLACE_API_KEY>` y se corta a los 5 s. | `lib/marketplace/http.test.ts` ("envía Bearer...", "el tiempo agotado...") |
| `RN-MARKETPLACE-03` | Sin ubicación no se envían `lat`, `lng`, `city` ni `radius_km`: la consulta cubre todo el país. | `lib/marketplace/params.test.ts` ("sin geo no envía ubicación...") |
| `RN-MARKETPLACE-04` | Un 404 de la API en un producto o una tienda llega como `null`; cualquier otro código no 2xx es API caída. | `lib/marketplace/http.test.ts` ("un 404 devuelve null...", "un estado 500 lanza MarketplaceUnavailableError (RN-MARKETPLACE-04)") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Campo nuevo del contrato | la spec §3 primero, después `schemas.ts` | agregarlo a los objetos de `mock/fixtures.ts` y a lo que arma `mock/adapter.ts`, para que `schemas.test.ts` siga pasando |
| Endpoint nuevo | función pública en `client.ts` que llama a `requestJson`, a `requestJsonOrNull` (si el 404 es "no existe") o a `postJson` | su esquema en `schemas.ts`, la misma firma en `mock/adapter.ts` y su caso en `schemas.test.ts` |
| Parámetro de consulta nuevo | `searchQuery`, `storesQuery`, `productQuery` o `pageQuery` en `params.ts` | su caso en `params.test.ts` y su lectura en `mock/adapter.ts` (`readScope` si es de ubicación; si no, la función que la usa) |
| Orden o destacados de las ofertas simuladas | `productPage` en `mock/adapter.ts` | su caso en `mock/adapter.test.ts`; `Number()` sólo para comparar montos, nunca para sumar ni redondear |
| Tipo de evento nuevo | la spec §3.4 primero, después `eventTypeSchema` y `hasSlugsForType` en `schemas.ts` | su caso en `schemas.test.ts` si cambia qué slug exige |
| Radios elegibles | `RADIUS_OPTIONS` y `DEFAULT_RADIUS_KM` en `params.ts` | cambiar antes la spec §5.1 |
| Datos simulados | `mock/fixtures.ts` | montos, `nearest_km` y `distance_km` como literales, nunca calculados |

## 4. API pública

Cliente de servidor, `lib/marketplace/client.ts` (`import "server-only"`):

- `searchProducts(p: { q: string; category: string | null; geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): Promise<SearchResponse>`
- `listNearbyStores(p: { geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): Promise<StoresResponse>`
- `listCategories(): Promise<CategoryNode[]>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:categories")`.
- `listLocations(): Promise<LocationState[]>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:locations")`.
- `getProduct(slug: string): Promise<ProductResponse | null>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:product:{slug}")`; nacional y por precio.
- `getProductOffers(p: { slug: string; geo: GeoFilter; radiusKm: RadiusKm | null; sort: OfferSort }): Promise<ProductResponse | null>`: `'use cache'`, `cacheLife("minutes")`, `cacheTag("marketplace:product:{slug}")`.
- `getStore(p: { slug: string; page: number }): Promise<StoreResponse | null>`: `'use cache'`, `cacheLife("minutes")`, `cacheTag("marketplace:store:{slug}")`.
- `listSitemap(p: { type: SitemapType; page: number }): Promise<SitemapResponse>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:sitemap:{type}")`.
- `sendEvent(event: MarketplaceEvent): Promise<void>`: sin caché.

Errores, `lib/marketplace/errors.ts`:

- `class MarketplaceUnavailableError extends Error { readonly endpoint: string; constructor(endpoint: string, options?: { cause?: unknown }) }`

Consultas, `lib/marketplace/params.ts`:

- `RADIUS_OPTIONS = [3, 10, 25, 50] as const`
- `type RadiusKm = (typeof RADIUS_OPTIONS)[number]`
- `DEFAULT_RADIUS_KM: RadiusKm = 10`
- `type GeoFilter = { lat: number; lng: number } | { city: string } | null`
- `searchQuery(p: { q: string; category: string | null; geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): URLSearchParams`
- `storesQuery(p: { geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): URLSearchParams`
- `type OfferSort = "price" | "distance"`
- `productQuery(p: { geo: GeoFilter; radiusKm: RadiusKm | null; sort: OfferSort }): URLSearchParams`
- `pageQuery(page: number): URLSearchParams`

Esquemas y tipos inferidos (`z.infer`), `lib/marketplace/schemas.ts`:

- `moneySchema` / `Money`; `rateSchema` / `Rate`; `availabilitySchema`; `restrictionSchema` / `Restriction`
- `categorySchema` / `Category`; `categoryNodeSchema` / `CategoryNode`
- `cityRefSchema` / `CityRef`; `locationStateSchema` / `LocationState`
- `storeSummarySchema` / `StoreSummary`; `productSchema` / `Product`; `offerSchema` / `Offer`
- `searchItemSchema` / `SearchItem`; `pageMetaSchema` / `PageMeta`
- `searchResponseSchema` / `SearchResponse`; `FeaturedProduct` (elemento de `featured`)
- `nearbyStoreSchema` / `NearbyStore`; `storesResponseSchema` / `StoresResponse`
- `categoriesResponseSchema`; `locationsResponseSchema`
- `scheduleEntrySchema` / `ScheduleEntry`; `storeSchema` / `Store`; `storeProductSchema` / `StoreProduct`; `storeResponseSchema` / `StoreResponse`
- `productOfferSchema` / `ProductOffer`; `offersSummarySchema` / `OffersSummary`; `productDetailSchema` / `ProductDetail`
- `productRedirectSchema`; `productPageSchema` / `ProductPage`; `productResponseSchema` / `ProductResponse` (unión de redirección y página)
- `sitemapTypeSchema` / `SitemapType`; `sitemapResponseSchema` / `SitemapResponse`
- `eventTypeSchema` / `EventType`; `eventInputSchema` / `EventInput` (`product_view` exige `product_slug` y `store_slug` nulo; los demás, `store_slug`); `marketplaceEventSchema` / `MarketplaceEvent` (más `session_id` uuid)

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `requestJson` | `lib/marketplace/http.ts` | `GET` con Bearer y tope de 5 s, validación con el esquema y `MarketplaceUnavailableError` ante cualquier fallo |
| `requestJsonOrNull` | `lib/marketplace/http.ts` | como `requestJson`, pero un 404 cancela el cuerpo y devuelve `null` |
| `postJson` | `lib/marketplace/http.ts` | `POST` JSON con Bearer y tope de 5 s; cancela el cuerpo y lanza `MarketplaceUnavailableError` si no es 2xx |
| Adaptador simulado | `lib/marketplace/mock/adapter.ts` | las nueve funciones de `client.ts` con la misma firma; interpreta la consulta de `params.ts` como la API |
| Ofertas simuladas | `productPage` en `lib/marketplace/mock/adapter.ts` | redirección, producto sin ofertas, orden por precio o distancia, hasta dos premium destacadas y relleno hasta tres con `outside_radius` |
| Datos simulados | `lib/marketplace/mock/fixtures.ts` | tasa, ubicaciones, categorías, seis tiendas con `distance_km` fijo y sus detalles (`MOCK_STORE_DETAILS`), productos con sus ofertas, `MOCK_REDIRECTS` y `MOCK_UNAVAILABLE_PRODUCTS` |
| Selección de modo | `usesMock` en `lib/marketplace/client.ts` | `MARKETPLACE_MODE` ausente o `mock`: simulado; `api`: las funciones de `http.ts` (`requestJson`, `requestJsonOrNull`, `postJson`); otro valor: `Error` |

## 6. Dependencias

- `package.json`: `zod` para los esquemas.
- `next/cache` (`cacheLife`, `cacheTag`) y `cacheComponents: true` en `next.config.ts`, que
  `cacheLife` exige (`poweredByHeader: false` en el mismo archivo no afecta a este módulo).
- `server-only`, que resuelve Next; en vitest, el alias de `vitest.config.mts`.
- Variables de `.env.example`: `MARKETPLACE_MODE`, `MARKETPLACE_API_URL` (incluye `/api/marketplace/v1`), `MARKETPLACE_API_KEY`.

## 7. Ejemplo de uso

```tsx
import { searchProducts } from "@/lib/marketplace/client";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";

const result = await searchProducts({
  q: "acetaminofen",
  category: null,
  geo: { city: "valencia" },
  radiusKm: DEFAULT_RADIUS_KM,
  page: 1,
});
```

```tsx
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/marketplace/client";

const product = await getProduct("acetaminofen-500-mg-20-tabletas");
if (product === null) notFound();
const newSlug = "redirect_to" in product ? product.redirect_to : null;
```

## 8. Restricciones

- Los montos son `Money` (cadena `^\d+\.\d{2}$`): el módulo no suma, no convierte ni redondea; el simulado los escribe como literales.
- `client.ts` y `http.ts` abren con `import "server-only"`: `MARKETPLACE_API_KEY` no llega al navegador.
- Fuera de `lib/marketplace/` sólo se importa `client.ts`, `params.ts`, `errors.ts` y `schemas.ts`; nunca `http.ts` ni `mock/`.
- Con ciudad, `radius_km` no se envía; con ciudad y todo el país (`radiusKm` null), tampoco `city`.
- `searchProducts`, `listNearbyStores` y `sendEvent` no se cachean; las otras seis funciones de `client.ts` sí, y `cacheLife` exige `cacheComponents: true`.
- `getProductOffers` y `getStore` usan `cacheLife("minutes")` porque traen precios por tienda; `getProduct` y `listSitemap`, `"hours"`.
- Los slugs van en la ruta con `encodeURIComponent`.
- `offers_summary` cubre todo el país, sin depender de la ubicación.
- La única excepción a "sin cálculo": `mock/adapter.ts` compara montos con `Number()` para ordenar y elegir mínimo y máximo, porque simula lo que calcula la API.
- El simulado pagina de a 20 productos (búsqueda y tienda), 12 tiendas y 50000 entradas de sitemap, y sólo devuelve `featured` de la búsqueda y de las tiendas en la página 1.

## 9. Pruebas

- Comando: `npx vitest run lib/marketplace`
- `lib/marketplace/schemas.test.ts`: cada respuesta del simulado pasa su esquema (producto con ofertas, sin ofertas y redirección, tienda y sitemap); `moneySchema`, el tope de dos destacados y los slugs que exige cada evento.
- `lib/marketplace/params.test.ts`: claves de consulta según ubicación y radio, también en `productQuery`.
- `lib/marketplace/http.test.ts`: Bearer, URL, tope de 5 s, errores de red, estado y esquema, falta de configuración, 404 como `null` y `POST` JSON.
- `lib/marketplace/mock/adapter.test.ts`: búsqueda sin mayúsculas ni acentos, `featured` fuera de la página 1, filtro por ciudad, resumen y orden de ofertas, relleno fuera del radio, redirección y slugs desconocidos.
