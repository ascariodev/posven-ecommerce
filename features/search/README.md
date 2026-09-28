---
module: "search"
path: "features/search"
type: "feature"
exports: ["SearchQuery", "parseSearchQuery", "searchHref", "SearchForm", "SearchResults", "ProductCard", "FeaturedCard", "RadiusFilter", "Pagination", "EmptyState", "CategoryLinks"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/site.ts", "features/location/cookie.ts", "features/location/server.ts", "features/location/LocationBar.tsx", "components/ui/button.tsx", "components/ui/input.tsx", "components/ui/badge.tsx", "components/ui/skeleton.tsx"]
tests: "features/search/*.test.{ts,tsx}"
verified_against: ["features/search/query.ts", "features/search/SearchForm.tsx", "features/search/SearchResults.tsx", "features/search/ProductCard.tsx", "features/search/FeaturedCard.tsx", "features/search/RadiusFilter.tsx", "features/search/Pagination.tsx", "features/search/EmptyState.tsx", "features/search/CategoryLinks.tsx", "app/buscar/page.tsx", "app/page.tsx", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "features/location/cookie.ts", "features/location/server.ts"]
capabilities:
  - intent: "buscar productos por texto o categoría cerca del usuario"
    intent_aliases: ["buscar producto", "resultados de busqueda", "pagina buscar", "buscar por categoria"]
    entrypoint: "<SearchResults />"
    file: "features/search/SearchResults.tsx"
    input: "searchParams: Promise<Record<string, string | string[] | undefined>> con q, categoria, radio (3 | 10 | 25 | 50 | pais) y pagina"
    output: "línea de tasa, RadiusFilter si hay ubicación, FeaturedCard por destacado, ProductCard por resultado y Pagination; EmptyState si no hay nada"
    source: "searchProducts() de lib/marketplace con geo de la cookie loc"
    rules: ["RN-SEARCH-01", "RN-SEARCH-03", "RN-SEARCH-04"]
  - intent: "leer y escribir los parámetros de la URL de /buscar"
    intent_aliases: ["parametros de busqueda", "url de buscar", "radio de busqueda", "enlace a buscar"]
    entrypoint: "parseSearchQuery() / searchHref()"
    file: "features/search/query.ts"
    input: "Record<string, string | string[] | undefined> | SearchQuery"
    output: "SearchQuery { q: string; categoria: string | null; radio: RadiusKm | null; pagina: number } | '/buscar?...'"
    source: "URL"
    rules: ["RN-SEARCH-02"]
  - intent: "mostrar el formulario de búsqueda"
    intent_aliases: ["caja de busqueda", "buscador", "formulario buscar"]
    entrypoint: "<SearchForm />"
    file: "features/search/SearchForm.tsx"
    input: "defaultQuery?: string"
    output: "Form de next/form con action /buscar y campo q"
    source: "URL"
    rules: []
---

# Módulo `search`

## 1. Propósito

La búsqueda de productos en `/buscar`: lee `q`, `categoria`, `radio` y `pagina` de la URL, pide
`searchProducts()` con la ubicación de la cookie y pinta destacados, resultados, radio, paginación
y el estado vacío con sugerencias. No calcula montos ni distancias ni ordena: la API entrega el
orden y los montos, y esto sólo los formatea.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-SEARCH-01` | Sin término ni categoría, `/buscar` no llama a la API y muestra la invitación a buscar. | `features/search/SearchResults.test.tsx` ("sin q ni categoría pide escribir y no llama a searchProducts") |
| `RN-SEARCH-02` | Un radio fuera de 3, 10, 25, 50 o `pais` se toma como 10 km. | `features/search/query.test.ts` ("lleva un radio que no está entre las opciones a 10", "sin radio usa 10") |
| `RN-SEARCH-03` | Un producto con `restriction` `recipe` muestra el aviso "Requiere récipe". | `features/search/ProductCard.test.tsx` ("avisa que requiere récipe") |
| `RN-SEARCH-04` | "Desde" antecede al precio sólo si `offers_count` es mayor que 1. | `features/search/ProductCard.test.tsx` ("con una sola oferta no antepone Desde", "con varias ofertas antepone Desde") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Un parámetro nuevo de la URL o su valor por defecto | `SearchQuery`, `parseSearchQuery` y `searchHref` en `query.ts` | sus casos en `query.test.ts`; `searchHref` omite el valor por defecto |
| Qué se envía a la API | la llamada a `searchProducts` en `SearchResults.tsx` | las claves las fija `searchQuery` de `lib/marketplace/params.ts`, que no se cambia desde acá |
| Opciones del filtro de radio | `optionsFor` en `RadiusFilter.tsx` | las opciones salen de `RADIUS_OPTIONS`; `RadiusFilter.test.tsx` cuenta los enlaces |
| Sugerencias del estado vacío | `EmptyState.tsx` (`relatedCategories`, ampliar radio, todo el país) | sus casos en `EmptyState.test.tsx` |
| Datos de la tarjeta de producto | `ProductCard.tsx` | `ProductCard.test.tsx`; los montos sólo por `formatUsd` y `formatVes` |

## 4. API pública

URL de la búsqueda, `features/search/query.ts`:

- `type SearchQuery = { q: string; categoria: string | null; radio: RadiusKm | null; pagina: number }`
- `parseSearchQuery(raw: Record<string, string | string[] | undefined>): SearchQuery`: `q` recortado y cortado a 100 caracteres; `categoria` sólo si casa `^[a-z0-9-]+$`; `radio` `pais` es `null`, ausente o inválido es 10; `pagina` entero mayor o igual a 1, si no 1; de un arreglo toma el primer valor.
- `searchHref(query: SearchQuery): string`: `/buscar?...` sin `q` vacío, `categoria` null, `radio` 10 ni `pagina` 1; `radio` null se escribe `pais`.

Componentes:

- `SearchForm({ defaultQuery }: { defaultQuery?: string })`, `features/search/SearchForm.tsx`
- `SearchResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<React.JSX.Element>`, Server Component, `features/search/SearchResults.tsx`
- `ProductCard({ item }: { item: SearchItem })`, `features/search/ProductCard.tsx`
- `FeaturedCard({ item }: { item: FeaturedProduct })`, `features/search/FeaturedCard.tsx`
- `RadiusFilter({ query, geoKind, cityName }: { query: SearchQuery; geoKind: "coords" | "city"; cityName: string | null })`, `features/search/RadiusFilter.tsx`
- `Pagination({ query, meta }: { query: SearchQuery; meta: PageMeta })`, `features/search/Pagination.tsx`
- `EmptyState({ query, geoKind, categories }: { query: SearchQuery; geoKind: "coords" | "city" | null; categories: CategoryNode[] })`, `features/search/EmptyState.tsx`
- `CategoryLinks({ categories }: { categories: CategoryNode[] })`, `features/search/CategoryLinks.tsx`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Ubicación efectiva | `SearchResults.tsx` | una ciudad que `describeLocation` no reconoce cuenta como sin ubicación: `geo` y `geoKind` null |
| `optionsFor` | `RadiusFilter.tsx` | con coordenadas, 3, 10, 25, 50 km y todo el país; con ciudad, "Sólo {ciudad}" (radio 10) y todo el país; el vigente lleva `aria-current="true"` |
| `relatedCategories` | `EmptyState.tsx` | hasta cuatro: con `categoria`, sus hermanas; sin ella o si no está en el árbol, las raíz |
| Página | `app/buscar/page.tsx` | `metadata` estática con `robots` `noindex, follow`; formulario, `LocationBar` y resultados, cada uno en su `<Suspense>` |

## 6. Dependencias

- `lib/marketplace/client.ts`: `searchProducts()`, `listLocations()` y `listCategories()` en `SearchResults.tsx`.
- `lib/marketplace/params.ts` (`RADIUS_OPTIONS`, `DEFAULT_RADIUS_KM`, `RadiusKm`) y `lib/marketplace/schemas.ts` (`SearchItem`, `FeaturedProduct`, `PageMeta`, `CategoryNode`).
- `features/location/server.ts` (`getUserLocation`) y `features/location/cookie.ts` (`toGeoFilter`, `describeLocation`); `features/location/LocationBar.tsx` (`LocationBar`, `LocationBarSkeleton`) en la página.
- `lib/format.ts` (`formatUsd`, `formatVes`, `formatRate`, `formatDistance`) y `lib/site.ts` (`SITE_NAME`).
- `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/badge.tsx` y `components/ui/skeleton.tsx` (en la página).
- `next/form`, `next/link` y `next/image`.

## 7. Ejemplo de uso

```tsx
import { Suspense } from "react";
import { SearchForm } from "@/features/search/SearchForm";
import { SearchResults } from "@/features/search/SearchResults";

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <SearchForm />
      <Suspense fallback={null}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}
```

## 8. Restricciones

- `SearchResults` lee `searchParams` y la cookie `loc`: va siempre dentro de un `<Suspense>` (`cacheComponents: true`).
- Montos y tasa sólo por `lib/format.ts`; ni el precio ni la distancia se calculan aquí.
- Todo enlace de la búsqueda se arma con `searchHref`, y los que cambian el radio vuelven a la página 1.
- Con ciudad, "todo el país" envía `radio` null y `searchProducts` no manda `city` (lo decide `searchQuery` de `lib/marketplace/params.ts`).
- `SearchForm` no depende de la petición: la portada lo usa sin `defaultQuery`.

## 9. Pruebas

- Comando: `npx vitest run features/search`
- `features/search/query.test.ts`: radio inválido, `pais` y válido; página negativa; `q` largo y recortado; categoría inválida; `searchHref` con valores por defecto y `radio=pais`.
- `features/search/ProductCard.test.tsx`: aviso de récipe, "Desde" según `offers_count` y "Fuera de tu zona".
- `features/search/EmptyState.test.tsx`: ampliar radio, todo el país según ubicación y radio, categorías hermanas y enlace a `/comercios`.
- `features/search/RadiusFilter.test.tsx`: cinco enlaces con coordenadas y dos con ciudad.
- `features/search/SearchResults.test.tsx`: sin `q` ni `categoria` no llama a `searchProducts`.
