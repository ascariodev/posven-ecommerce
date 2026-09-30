---
module: "search"
path: "features/search"
type: "feature"
exports: ["SearchQuery", "parseSearchQuery", "searchHref", "SearchForm", "SearchResults", "ProductCard", "FeaturedCard", "RadiusFilter", "Pagination", "EmptyState", "CategoryLinks", "categoryIcon", "categoryTint", "ProductThumb", "HeaderSearchSlot", "SearchPill", "CategoryRail", "FiltersSheet"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/site.ts", "features/location/cookie.ts", "features/location/server.ts", "features/location/LocationBar.tsx", "components/ui/button.tsx", "components/ui/input.tsx", "components/ui/badge.tsx", "components/ui/card.tsx", "components/ui/sheet.tsx", "components/ui/toggle.tsx", "components/ui/skeleton.tsx", "lib/utils.ts"]
tests: "features/search/*.test.{ts,tsx}"
verified_against: ["features/search/query.ts", "features/search/SearchForm.tsx", "features/search/SearchResults.tsx", "features/search/ProductCard.tsx", "features/search/FeaturedCard.tsx", "features/search/RadiusFilter.tsx", "features/search/Pagination.tsx", "features/search/EmptyState.tsx", "features/search/CategoryLinks.tsx", "features/search/categoryIcon.ts", "features/search/ProductThumb.tsx", "features/search/HeaderSearchSlot.tsx", "features/search/SearchPill.tsx", "features/search/CategoryRail.tsx", "features/search/categoryTint.ts", "features/search/FiltersSheet.tsx", "app/layout.tsx", "app/buscar/page.tsx", "app/page.tsx", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "features/location/cookie.ts", "features/location/server.ts", "features/location/LocationBar.tsx", "components/ui/skeleton.tsx", "components/ui/sheet.tsx", "components/ui/toggle.tsx"]
capabilities:
  - intent: "buscar productos por texto o categoría cerca del usuario"
    intent_aliases: ["buscar producto", "resultados de busqueda", "pagina buscar", "buscar por categoria"]
    entrypoint: "<SearchResults />"
    file: "features/search/SearchResults.tsx"
    input: "searchParams: Promise<Record<string, string | string[] | undefined>> con q, categoria, radio (3 | 10 | 25 | 50 | pais) y pagina"
    output: "chips de categoría, RadiusFilter (en línea desde md, en el Sheet de FiltersSheet en móvil) si hay ubicación, total y línea de tasa, FeaturedCard por destacado, ProductCard por resultado en rejilla y Pagination; EmptyState si no hay nada"
    source: "searchProducts() de lib/marketplace con geo de getEffectiveLocation() (cookie loc)"
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
    input: "defaultQuery?: string; size?: 'lg' | 'sm' (por defecto 'lg')"
    output: "Form de next/form con action /buscar y campo q; 'lg' es el buscador grande con vidrio, 'sm' el compacto de la cabecera"
    source: "URL"
    rules: []
  - intent: "mostrar la píldora de búsqueda con el segmento de ubicación"
    intent_aliases: ["pildora de busqueda", "buscador del inicio", "buscador con ubicacion", "que y donde"]
    entrypoint: "<SearchPill />"
    file: "features/search/SearchPill.tsx"
    input: "defaultQuery?: string; compact?: boolean (por defecto false; true en /buscar)"
    output: "contenedor redondeado con el Form de next/form (action /buscar, campo q), el segmento de ubicación (LocationBar en su Suspense) y el botón 'Buscar' enlazado al formulario por form={id}"
    source: "URL y cookie loc"
    rules: []
  - intent: "mostrar el carril de categorías del inicio"
    intent_aliases: ["carril de categorias", "categorias del inicio", "categorias con icono"]
    entrypoint: "<CategoryRail />"
    file: "features/search/CategoryRail.tsx"
    input: "categories: CategoryNode[] (las raíz de listCategories())"
    output: "nav 'Categorías' con desplazamiento horizontal y un enlace por categoría con su ícono a /buscar?categoria={slug}; sin categorías no pinta nada"
    source: "props"
    rules: []
---

# Módulo `search`

## 1. Propósito

La búsqueda de productos en `/buscar` y el buscador del inicio: lee `q`, `categoria`, `radio` y
`pagina` de la URL, pide `searchProducts()` con la ubicación de la cookie y pinta chips de
categoría, destacados, resultados, radio, paginación y el estado vacío con sugerencias; la píldora
`SearchPill` y el carril `CategoryRail` arman el inicio. No calcula montos ni distancias ni ordena
(no hay selector de orden: `/search` no acepta `sort`, spec §7): la API entrega el orden y los
montos, y esto sólo los formatea.

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
| Tinte de una categoría sin imagen | `TINTS` en `categoryTint.ts` | `categoryTint.test.ts`; los colores son los tokens `--tint-N` de `app/globals.css` |
| Píldora de búsqueda o su segmento de ubicación | `SearchPill.tsx` y `features/location/LocationSheet.tsx` | los nombres accesibles "Buscar productos", "Buscar" y "Ubicación: ..." que usa `e2e/search.spec.ts` |
| Carril de categorías del inicio | `CategoryRail.tsx` | los enlaces se arman con `searchHref` |
| Filtros en móvil | `FiltersSheet.tsx` (recibe el `RadiusFilter` como `children`) | el caso "elegir ciudad" de `e2e/search.spec.ts` abre "Filtros" en móvil |
| Datos de la tarjeta de producto | `ProductCard.tsx` | `ProductCard.test.tsx`; los montos sólo por `formatUsd` y `formatVes` |
| El ícono de una categoría raíz | `ROOT_ICONS` en `categoryIcon.ts` | su caso en `categoryIcon.test.ts`; los íconos salen sólo de `lucide-react` |
| En qué rutas la cabecera muestra el buscador | `HeaderSearchSlot.tsx` | sus casos en `HeaderSearchSlot.test.tsx` |

## 4. API pública

URL de la búsqueda, `features/search/query.ts`:

- `type SearchQuery = { q: string; categoria: string | null; radio: RadiusKm | null; pagina: number }`
- `parseSearchQuery(raw: Record<string, string | string[] | undefined>): SearchQuery`: `q` recortado y cortado a 100 caracteres; `categoria` sólo si casa `^[a-z0-9-]+$`; `radio` `pais` es `null`, ausente o inválido es 10; `pagina` entero mayor o igual a 1, si no 1; de un arreglo toma el primer valor.
- `searchHref(query: SearchQuery): string`: `/buscar?...` sin `q` vacío, `categoria` null, `radio` 10 ni `pagina` 1; `radio` null se escribe `pais`.

Componentes:

- `SearchPill({ defaultQuery, compact = false }: { defaultQuery?: string; compact?: boolean })`, Server Component, `features/search/SearchPill.tsx`: píldora `rounded-full` con el `Form` de `next/form` (`role="search"`, campo `q`, "Buscar productos"), el segmento de ubicación (`LocationBar` en su `<Suspense>`) y el botón "Buscar" fuera del `<form>` con `form={id}` para no anidar formularios; `compact` usa controles de 44 px en móvil y 36 px desde `md` (`h-11 md:h-9`, `/buscar`), si no 44 px (inicio)
- `CategoryRail({ categories }: { categories: CategoryNode[] })`, Server Component, `features/search/CategoryRail.tsx`: `<nav aria-label="Categorías">` con enlaces de ícono y nombre a `searchHref({ q: "", categoria, radio: DEFAULT_RADIUS_KM, pagina: 1 })`; `null` sin categorías
- `FiltersSheet({ children }: { children: ReactNode })`, `features/search/FiltersSheet.tsx` (`"use client"`): botón "Filtros" (sólo bajo `md`) que abre un `Sheet` inferior con los hijos; el `RadiusFilter` sigue siendo de servidor
- `SearchForm({ defaultQuery, size = "lg" }: { defaultQuery?: string; size?: "lg" | "sm" })`, `features/search/SearchForm.tsx`: `"lg"` con vidrio propio; `"sm"` sin vidrio, con input y botón de 44 px en móvil y 36 px desde `md`, para la cabecera. Ya no lo usan el inicio ni `/buscar`, que montan `SearchPill`
- `SearchResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<React.JSX.Element>`, Server Component, `features/search/SearchResults.tsx`
- `ProductCard({ item }: { item: SearchItem })`, `features/search/ProductCard.tsx`
- `FeaturedCard({ item }: { item: FeaturedProduct })`, `features/search/FeaturedCard.tsx`
- `RadiusFilter({ query, geoKind, cityName }: { query: SearchQuery; geoKind: "coords" | "city"; cityName: string | null })`, `features/search/RadiusFilter.tsx`
- `Pagination({ query, meta }: { query: SearchQuery; meta: PageMeta })`, `features/search/Pagination.tsx`
- `EmptyState({ query, geoKind, categories }: { query: SearchQuery; geoKind: "coords" | "city" | null; categories: CategoryNode[] })`, `features/search/EmptyState.tsx`
- `CategoryLinks({ categories }: { categories: CategoryNode[] })`, `features/search/CategoryLinks.tsx`: chips de categoría como enlaces a `/buscar`, con `buttonVariants` outline `sm`, `rounded-full` y `shadow-card`
- `ProductThumb({ imageUrl, category, size, alt, preload, className }: { imageUrl: string | null; category: Category | null; size: "md" | "card" | "detail"; alt?: string; preload?: boolean; className?: string })`, Server Component, `features/search/ProductThumb.tsx`: la imagen (96 px en `md`; `card` llena un contenedor `aspect-[4/3]`; `detail`, el de la ficha, llena uno `aspect-square` con `object-contain p-6`, `sizes` a su columna (`(min-width: 1024px) 540px, (min-width: 768px) 50vw, 100vw`) e ícono `size-24` sin imagen) con `alt` (por defecto `""`) y `preload` (por defecto `false`), que sólo se aplican a `<Image>`, o, sin imagen, el ícono de `categoryIcon(category)` sobre el tinte de `categoryTint(category)`, con `aria-hidden`
- `HeaderSearchSlot({ children }: { children: ReactNode })`, `features/search/HeaderSearchSlot.tsx` (`"use client"`): `null` en `/` y en toda ruta que empieza por `/buscar`, que ya tienen su buscador; si no, sus hijos

Tintes, `features/search/categoryTint.ts`:

- `categoryTint(category: Category | null): { bg: string; fg: string }`: una de cuatro parejas `bg-tint-N` / `text-tint-N-foreground` según un hash estable del `slug`; sin categoría, `tint-1`.

Íconos, `features/search/categoryIcon.ts`:

- `categoryIcon(category: Category | null): LucideIcon`: el ícono de `lucide-react` de la raíz (`parent_slug ?? slug`); `Package` sin categoría o con una raíz sin mapeo.

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `optionsFor` | `RadiusFilter.tsx` | con coordenadas, 3, 10, 25, 50 km y todo el país; con ciudad, "Sólo {ciudad}" (radio 10) y todo el país; el vigente lleva `aria-current="true"` |
| `relatedCategories` | `EmptyState.tsx` | hasta cuatro: con `categoria`, sus hermanas; sin ella o si no está en el árbol, las raíz |
| Cabecera | `app/layout.tsx` | `SearchForm size="sm"` y `LocationSummary` dentro de `HeaderSearchSlot`, en un `<Suspense fallback={null}>` porque `usePathname` suspende en las rutas con parámetros de respaldo |
| Barra de filtros | `SearchResults.tsx` | chips de categoría raíz (`toggleVariants` sobre `<Link>`, el activo con `aria-current="true"` y `href` que la quita) y `RadiusFilter` en línea desde `md` o dentro de `FiltersSheet` en móvil |
| Página | `app/buscar/page.tsx` | `metadata` estática con `robots` `noindex, follow`; `SearchPill compact` (con su segmento de ubicación) y resultados, cada uno en su `<Suspense>` |
| Inicio | `app/page.tsx` | título, `SearchPill`, `CategoryRail` y `NearbyStores`; sin rejilla de productos (spec §7) |

## 6. Dependencias

- `lib/marketplace/client.ts`: `searchProducts()` y `listCategories()` en `SearchResults.tsx`.
- `lib/marketplace/params.ts` (`RADIUS_OPTIONS`, `DEFAULT_RADIUS_KM`, `RadiusKm`) y `lib/marketplace/schemas.ts` (`SearchItem`, `FeaturedProduct`, `PageMeta`, `CategoryNode`).
- `features/location/server.ts` (`getEffectiveLocation`) y `features/location/cookie.ts` (`toGeoFilter`); `features/location/LocationBar.tsx` (`LocationBar`, `LocationBarSkeleton`) en `SearchPill`.
- `lib/format.ts` (`formatUsd`, `formatVes`, `formatRate`, `formatDistance`) y `lib/site.ts` (`SITE_NAME`).
- `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/badge.tsx`, `components/ui/card.tsx`, `components/ui/sheet.tsx`, `components/ui/toggle.tsx` (`toggleVariants` en `RadiusFilter` y los chips) y `components/ui/skeleton.tsx`.
- `next/form`, `next/link`, `next/image` y `next/navigation` (`usePathname` en `HeaderSearchSlot`).
- `lucide-react`: íconos por nombre, decorativos con `aria-hidden`.
- `lib/utils.ts` (`cn`) en `SearchForm`, `SearchPill`, `ProductThumb`, `RadiusFilter`, `SearchResults` y `CategoryLinks`.

## 7. Ejemplo de uso

```tsx
import { Suspense } from "react";
import { SearchPill } from "@/features/search/SearchPill";
import { SearchResults } from "@/features/search/SearchResults";

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <SearchPill compact />
      <Suspense fallback={null}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}
```

## 8. Restricciones

- `SearchResults` lee `searchParams` y la cookie `loc`: va siempre dentro de un `<Suspense>` (`cacheComponents: true`).
- La ubicación sale de `getEffectiveLocation`: una ciudad que no reconoce llega como sin ubicación (RN-LOCATION-04), con `geo` y `geoKind` null, y el nombre de la ciudad del filtro de radio es su `name`.
- Montos y tasa sólo por `lib/format.ts`; ni el precio ni la distancia se calculan aquí.
- Todo enlace de la búsqueda se arma con `searchHref`, y los que cambian el radio vuelven a la página 1.
- Con ciudad, "todo el país" envía `radio` null y `searchProducts` no manda `city` (lo decide `searchQuery` de `lib/marketplace/params.ts`).
- `SearchPill` y `SearchForm` no dependen de la petición: la portada usa la píldora sin `defaultQuery`. Su segmento de ubicación lee la cookie `loc` y va dentro de su propio `<Suspense>`.
- `buttonVariants` y `toggleVariants` sobre `<Link>` pasan por `cn` (`.claude/rules/ui.md` 3); los colores de los tintes son tokens, no clases de paleta.

## 9. Pruebas

- Comando: `npx vitest run features/search`
- `features/search/query.test.ts`: radio inválido, `pais` y válido; página negativa; `q` largo y recortado; categoría inválida; `searchHref` con valores por defecto y `radio=pais`.
- `features/search/ProductCard.test.tsx`: aviso de récipe, "Desde" según `offers_count` y "Fuera de tu zona".
- `features/search/EmptyState.test.tsx`: ampliar radio, todo el país según ubicación y radio, categorías hermanas y enlace a `/comercios`.
- `features/search/RadiusFilter.test.tsx`: cinco enlaces con coordenadas y dos con ciudad.
- `features/search/SearchResults.test.tsx`: sin `q` ni `categoria` no llama a `searchProducts`.
- `features/search/categoryTint.test.ts`: mismo slug, misma pareja; sin categoría, `tint-1`; las cuatro parejas son alcanzables.
- `features/search/categoryIcon.test.ts`: hija por su raíz, raíz propia, `null` y raíz sin mapeo.
- `features/search/HeaderSearchSlot.test.tsx`: oculto en `/` y `/buscar`, visible en la ficha de un producto.
