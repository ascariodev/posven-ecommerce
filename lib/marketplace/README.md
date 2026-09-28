---
module: "marketplace"
path: "lib/marketplace"
type: "integration"
exports: ["searchProducts", "listNearbyStores", "listCategories", "listLocations", "MarketplaceUnavailableError", "RADIUS_OPTIONS", "RadiusKm", "DEFAULT_RADIUS_KM", "GeoFilter", "searchQuery", "storesQuery", "moneySchema", "Money", "rateSchema", "Rate", "availabilitySchema", "restrictionSchema", "categorySchema", "Category", "categoryNodeSchema", "CategoryNode", "cityRefSchema", "CityRef", "locationStateSchema", "LocationState", "storeSummarySchema", "StoreSummary", "productSchema", "Product", "offerSchema", "Offer", "searchItemSchema", "SearchItem", "pageMetaSchema", "PageMeta", "searchResponseSchema", "SearchResponse", "FeaturedProduct", "nearbyStoreSchema", "NearbyStore", "storesResponseSchema", "StoresResponse", "categoriesResponseSchema", "locationsResponseSchema"]
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

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Campo nuevo del contrato | la spec §3 primero, después `schemas.ts` | agregarlo a los objetos de `mock/fixtures.ts` y a lo que arma `mock/adapter.ts`, para que `schemas.test.ts` siga pasando |
| Endpoint nuevo | función pública en `client.ts` que llama a `requestJson` | su esquema en `schemas.ts`, la misma firma en `mock/adapter.ts` y su caso en `schemas.test.ts` |
| Parámetro de consulta nuevo | `searchQuery` o `storesQuery` en `params.ts` | su caso en `params.test.ts` y su lectura en `mock/adapter.ts` (`readScope` si es de ubicación; si no, la función que la usa) |
| Radios elegibles | `RADIUS_OPTIONS` y `DEFAULT_RADIUS_KM` en `params.ts` | cambiar antes la spec §5.1 |
| Datos simulados | `mock/fixtures.ts` | montos, `nearest_km` y `distance_km` como literales, nunca calculados |

## 4. API pública

Cliente de servidor, `lib/marketplace/client.ts` (`import "server-only"`):

- `searchProducts(p: { q: string; category: string | null; geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): Promise<SearchResponse>`
- `listNearbyStores(p: { geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): Promise<StoresResponse>`
- `listCategories(): Promise<CategoryNode[]>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:categories")`.
- `listLocations(): Promise<LocationState[]>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:locations")`.

Errores, `lib/marketplace/errors.ts`:

- `class MarketplaceUnavailableError extends Error { readonly endpoint: string; constructor(endpoint: string, options?: { cause?: unknown }) }`

Consultas, `lib/marketplace/params.ts`:

- `RADIUS_OPTIONS = [3, 10, 25, 50] as const`
- `type RadiusKm = (typeof RADIUS_OPTIONS)[number]`
- `DEFAULT_RADIUS_KM: RadiusKm = 10`
- `type GeoFilter = { lat: number; lng: number } | { city: string } | null`
- `searchQuery(p: { q: string; category: string | null; geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): URLSearchParams`
- `storesQuery(p: { geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): URLSearchParams`

Esquemas y tipos inferidos (`z.infer`), `lib/marketplace/schemas.ts`:

- `moneySchema` / `Money`; `rateSchema` / `Rate`; `availabilitySchema`; `restrictionSchema`
- `categorySchema` / `Category`; `categoryNodeSchema` / `CategoryNode`
- `cityRefSchema` / `CityRef`; `locationStateSchema` / `LocationState`
- `storeSummarySchema` / `StoreSummary`; `productSchema` / `Product`; `offerSchema` / `Offer`
- `searchItemSchema` / `SearchItem`; `pageMetaSchema` / `PageMeta`
- `searchResponseSchema` / `SearchResponse`; `FeaturedProduct` (elemento de `featured`)
- `nearbyStoreSchema` / `NearbyStore`; `storesResponseSchema` / `StoresResponse`
- `categoriesResponseSchema`; `locationsResponseSchema`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `requestJson` | `lib/marketplace/http.ts` | `fetch` con Bearer y tope de 5 s, validación con el esquema y `MarketplaceUnavailableError` ante cualquier fallo |
| Adaptador simulado | `lib/marketplace/mock/adapter.ts` | las cuatro funciones de `client.ts` con la misma firma; interpreta la consulta de `params.ts` como la API |
| Datos simulados | `lib/marketplace/mock/fixtures.ts` | tasa, ubicaciones, categorías, seis tiendas con `distance_km` fijo y productos con sus ofertas |
| Selección de modo | `usesMock` en `lib/marketplace/client.ts` | `MARKETPLACE_MODE` ausente o `mock`: simulado; `api`: `requestJson`; otro valor: `Error` |

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

## 8. Restricciones

- Los montos son `Money` (cadena `^\d+\.\d{2}$`): el módulo no suma, no convierte ni redondea; el simulado los escribe como literales.
- `client.ts` y `http.ts` abren con `import "server-only"`: `MARKETPLACE_API_KEY` no llega al navegador.
- Fuera de `lib/marketplace/` sólo se importa `client.ts`, `params.ts`, `errors.ts` y `schemas.ts`; nunca `http.ts` ni `mock/`.
- Con ciudad, `radius_km` no se envía; con ciudad y todo el país (`radiusKm` null), tampoco `city`.
- `searchProducts` y `listNearbyStores` no se cachean; `listCategories` y `listLocations` sí, y `cacheLife` exige `cacheComponents: true`.
- El simulado pagina de a 20 productos y 12 tiendas, y sólo devuelve `featured` en la página 1.

## 9. Pruebas

- Comando: `npx vitest run lib/marketplace`
- `lib/marketplace/schemas.test.ts`: cada respuesta del simulado pasa su esquema; `moneySchema` y el tope de dos destacados.
- `lib/marketplace/params.test.ts`: claves de consulta según ubicación y radio.
- `lib/marketplace/http.test.ts`: Bearer, URL, tope de 5 s, errores de red, estado y esquema, y falta de configuración.
- `lib/marketplace/mock/adapter.test.ts`: búsqueda sin mayúsculas ni acentos, `featured` fuera de la página 1 y filtro por ciudad.
