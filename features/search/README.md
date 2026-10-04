---
module: "search"
path: "features/search"
type: "feature"
exports: ["SearchQuery", "parseSearchQuery", "searchHref", "SearchResults", "ProductCard", "FeaturedCard", "RadiusFilter", "Pagination", "EmptyState", "CategoryLinks", "categoryIcon", "categoryTint", "ProductThumb", "HeaderSearchSlot", "SearchPill", "CategoryRail", "FiltersSheet", "SearchBox", "SuggestionsPanel", "buildPanelItems", "useSuggestions", "readRecents", "addRecent"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/site.ts", "features/location/lib/cookie.ts", "features/location/server/location.ts", "components/ui/button.tsx", "components/ui/input.tsx", "components/ui/badge.tsx", "components/ui/card.tsx", "components/ui/sheet.tsx", "components/ui/toggle.tsx", "components/ui/skeleton.tsx", "lib/utils.ts", "app/api/suggestions/route.ts"]
tests: "features/search/__tests__/*.test.{ts,tsx}"
verified_against: ["features/search/lib/query.ts", "features/search/components/SearchResults.tsx", "features/search/components/ProductCard.tsx", "features/search/components/FeaturedCard.tsx", "features/search/components/RadiusFilter.tsx", "features/search/components/Pagination.tsx", "features/search/components/EmptyState.tsx", "features/search/components/CategoryLinks.tsx", "features/search/lib/categoryIcon.ts", "features/search/components/ProductThumb.tsx", "features/search/components/HeaderSearchSlot.tsx", "features/search/components/SearchPill.tsx", "features/search/components/CategoryRail.tsx", "features/search/lib/categoryTint.ts", "features/search/components/FiltersSheet.tsx", "features/search/components/SearchBox.tsx", "features/search/components/SuggestionsPanel.tsx", "features/search/lib/panelItems.ts", "features/search/lib/useSuggestions.ts", "features/search/lib/recents.ts", "app/api/suggestions/route.ts", "app/layout.tsx", "app/buscar/page.tsx", "app/page.tsx", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "features/location/lib/cookie.ts", "features/location/server/location.ts", "features/site/components/SiteHeader.tsx", "components/ui/skeleton.tsx", "components/ui/sheet.tsx", "components/ui/toggle.tsx"]
capabilities:
  - intent: "buscar productos por texto o categoría cerca del usuario"
    intent_aliases: ["buscar producto", "resultados de busqueda", "pagina buscar", "buscar por categoria"]
    entrypoint: "<SearchResults />"
    file: "features/search/components/SearchResults.tsx"
    input: "searchParams: Promise<Record<string, string | string[] | undefined>> con q, categoria, radio (3 | 10 | 25 | 50 | pais) y pagina"
    output: "chips de categoría, RadiusFilter (en línea desde md, en el Sheet de FiltersSheet en móvil) si hay ubicación, total y línea de tasa, FeaturedCard por destacado, ProductCard por resultado en rejilla y Pagination; EmptyState si no hay nada"
    source: "searchProducts() de lib/marketplace con geo de getEffectiveLocation() (cookie loc)"
    rules: ["RN-SEARCH-01", "RN-SEARCH-03", "RN-SEARCH-04"]
  - intent: "leer y escribir los parámetros de la URL de /buscar"
    intent_aliases: ["parametros de busqueda", "url de buscar", "radio de busqueda", "enlace a buscar"]
    entrypoint: "parseSearchQuery() / searchHref()"
    file: "features/search/lib/query.ts"
    input: "Record<string, string | string[] | undefined> | SearchQuery"
    output: "SearchQuery { q: string; categoria: string | null; radio: RadiusKm | null; pagina: number } | '/buscar?...'"
    source: "URL"
    rules: ["RN-SEARCH-02"]
  - intent: "mostrar la píldora de búsqueda"
    intent_aliases: ["pildora de busqueda", "buscador del inicio", "buscador con ubicacion", "que y donde", "buscador de la cabecera", "caja de busqueda", "buscador"]
    entrypoint: "<SearchPill />"
    file: "features/search/components/SearchPill.tsx"
    input: "defaultQuery?: string; compact?: boolean (por defecto false; true en /buscar y en la cabecera)"
    output: "contenedor redondeado con el Form de next/form (action /buscar), el SearchBox (combobox con panel de sugerencias) y el botón 'Buscar' enlazado al formulario por form={id}"
    source: "URL; /api/suggestions y localStorage (en el SearchBox)"
    rules: ["RN-SEARCH-05"]
  - intent: "mostrar el carril de categorías del inicio"
    intent_aliases: ["carril de categorias", "categorias del inicio", "categorias con icono"]
    entrypoint: "<CategoryRail />"
    file: "features/search/components/CategoryRail.tsx"
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
| `RN-SEARCH-01` | Sin término ni categoría, `/buscar` no llama a la API y muestra la invitación a buscar. | `features/search/__tests__/SearchResults.test.tsx` ("sin q ni categoría pide escribir y no llama a searchProducts") |
| `RN-SEARCH-02` | Un radio fuera de 3, 10, 25, 50 o `pais` se toma como 10 km. | `features/search/__tests__/query.test.ts` ("lleva un radio que no está entre las opciones a 10", "sin radio usa 10") |
| `RN-SEARCH-03` | Un producto con `restriction` `recipe` muestra el aviso "Requiere récipe". | `features/search/__tests__/ProductCard.test.tsx` ("avisa que requiere récipe") |
| `RN-SEARCH-04` | "Desde" antecede al precio sólo si `offers_count` es mayor que 1. | `features/search/__tests__/ProductCard.test.tsx` ("con una sola oferta no antepone Desde", "con varias ofertas antepone Desde") |
| `RN-SEARCH-05` | Con menos de 2 caracteres el buscador no llama a `/api/suggestions`: sólo ofrece los recientes. | `features/search/__tests__/SearchBox.test.tsx` ("con una letra no llama a la API") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Un parámetro nuevo de la URL o su valor por defecto | `SearchQuery`, `parseSearchQuery` y `searchHref` en `query.ts` | sus casos en `query.test.ts`; `searchHref` omite el valor por defecto |
| Qué se envía a la API | la llamada a `searchProducts` en `SearchResults.tsx` | las claves las fija `searchQuery` de `lib/marketplace/params.ts`, que no se cambia desde acá |
| Opciones del filtro de radio | `optionsFor` en `RadiusFilter.tsx` | las opciones salen de `RADIUS_OPTIONS`; `RadiusFilter.test.tsx` cuenta los enlaces |
| Sugerencias del estado vacío | `EmptyState.tsx` (`relatedCategories`, ampliar radio, todo el país) | sus casos en `EmptyState.test.tsx` |
| Tinte de una categoría sin imagen | `TINTS` en `categoryTint.ts` | `categoryTint.test.ts`; los colores son los tokens `primary-soft`, `success-soft`, `warning-soft` y `muted` de `app/globals.css` |
| Píldora de búsqueda | `SearchPill.tsx` | el rol `combobox` con nombre "Buscar productos" y el botón "Buscar" que usa `e2e/search.spec.ts` (el botón de ubicación también empieza por "Buscar": se pulsa con `exact: true`) |
| Carril de categorías del inicio | `CategoryRail.tsx` | chips `rounded-full` de 44 px (`buttonVariants` outline) con "Todo" primero; los enlaces se arman con `searchHref` y el nombre accesible de cada chip es el de la categoría |
| Filtros en móvil | `FiltersSheet.tsx` (recibe el `RadiusFilter` como `children`) | el caso "elegir ciudad" de `e2e/search.spec.ts` abre "Filtros" en móvil |
| Panel de sugerencias (orden de secciones, enlaces) | `buildPanelItems` en `panelItems.ts` y `SuggestionsPanel.tsx` | `panelItems.test.ts`; los precios sólo por `formatUsd` y `formatVes` |
| Teclado, ARIA y recientes del buscador | `SearchBox.tsx` y `recents.ts` | `SearchBox.test.tsx`, `recents.test.ts` y el caso de sugerencias de `e2e/search.spec.ts` |
| Datos de la tarjeta de producto | `ProductCard.tsx` | `ProductCard.test.tsx`; los montos sólo por `formatUsd` y `formatVes` |
| El ícono de una categoría raíz | `ROOT_ICONS` en `categoryIcon.ts` | su caso en `categoryIcon.test.ts`; los íconos salen sólo de `lucide-react` |
| En qué rutas la cabecera muestra el buscador | `HeaderSearchSlot.tsx` | sus casos en `HeaderSearchSlot.test.tsx` |

## 4. API pública

URL de la búsqueda, `features/search/lib/query.ts`:

- `type SearchQuery = { q: string; categoria: string | null; radio: RadiusKm | null; pagina: number }`
- `parseSearchQuery(raw: Record<string, string | string[] | undefined>): SearchQuery`: `q` recortado y cortado a 100 caracteres; `categoria` sólo si casa `^[a-z0-9-]+$`; `radio` `pais` es `null`, ausente o inválido es 10; `pagina` entero mayor o igual a 1, si no 1; de un arreglo toma el primer valor.
- `searchHref(query: SearchQuery): string`: `/buscar?...` sin `q` vacío, `categoria` null, `radio` 10 ni `pagina` 1; `radio` null se escribe `pais`.

Componentes:

- `SearchPill({ defaultQuery, compact = false }: { defaultQuery?: string; compact?: boolean })`, Client Component (`"use client"`), `features/search/components/SearchPill.tsx`: píldora `rounded-full` con el `Form` de `next/form` (`role="search"`, `onSubmit` que guarda la consulta en recientes) que contiene el `SearchBox`, y el botón "Buscar" fuera del `<form>` con `form={id}` para no anidar formularios; `compact` usa controles de 44 px en móvil y 36 px desde `md` (`h-11 md:h-9`, `/buscar`), si no 44 px (inicio); la ubicación no vive en la píldora: es el botón de la cabecera (`features/location/components/LocationBar.tsx`)
- `SearchBox({ defaultQuery, className }: { defaultQuery?: string; className?: string })`, `"use client"`, `features/search/components/SearchBox.tsx`: input `role="combobox"` ("Buscar productos", `aria-expanded`, `aria-controls`, `aria-activedescendant`) con el panel; las flechas mueven la opción activa, Enter la abre, Escape y perder el foco cierran; el radio sale de la URL actual
- `SuggestionsPanel({ id, items, activeIndex, onPick }: { id: string; items: PanelItem[]; activeIndex: number; onPick: (item: PanelItem) => void })`, `features/search/components/SuggestionsPanel.tsx`: `listbox` con grupos Sugerencias, Productos (miniatura, nombre, `formatUsd` y `formatVes` de `min_price_*`), Categorías y Recientes; cada opción es un `Link` con `role="option"`
- `CategoryRail({ categories }: { categories: CategoryNode[] })`, Server Component, `features/search/components/CategoryRail.tsx`: `<nav aria-label="Categorías">` con chips de ícono y nombre (más "Todo", sin categoría) a `searchHref({ q: "", categoria, radio: DEFAULT_RADIUS_KM, pagina: 1 })`, en scroll horizontal nativo; `null` sin categorías
- `FiltersSheet({ children }: { children: ReactNode })`, `features/search/components/FiltersSheet.tsx` (`"use client"`): botón "Filtros" (sólo bajo `md`) que abre un `Sheet` inferior con los hijos; el `RadiusFilter` sigue siendo de servidor
- `SearchResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<React.JSX.Element>`, Server Component, `features/search/components/SearchResults.tsx`
- `ProductCard({ item }: { item: SearchItem })`, `features/search/components/ProductCard.tsx`
- `FeaturedCard({ item }: { item: FeaturedProduct })`, `features/search/components/FeaturedCard.tsx`
- `RadiusFilter({ query, geoKind, cityName }: { query: SearchQuery; geoKind: "coords" | "city"; cityName: string | null })`, `features/search/components/RadiusFilter.tsx`
- `Pagination({ query, meta }: { query: SearchQuery; meta: PageMeta })`, `features/search/components/Pagination.tsx`
- `EmptyState({ query, geoKind, categories }: { query: SearchQuery; geoKind: "coords" | "city" | null; categories: CategoryNode[] })`, `features/search/components/EmptyState.tsx`
- `CategoryLinks({ categories }: { categories: CategoryNode[] })`, `features/search/components/CategoryLinks.tsx`: chips de categoría como enlaces a `/buscar`, con `buttonVariants` outline `sm`, `rounded-full` y `shadow-card`
- `ProductThumb({ imageUrl, category, size, alt, preload, className }: { imageUrl: string | null; category: Category | null; size: "md" | "card" | "detail"; alt?: string; preload?: boolean; className?: string })`, Server Component, `features/search/components/ProductThumb.tsx`: la imagen (96 px en `md`; `card` llena un contenedor `aspect-[4/3]`; `detail`, el de la ficha, llena uno `aspect-square` con `object-contain p-6`, `sizes` a su columna (`(min-width: 1024px) 540px, (min-width: 768px) 50vw, 100vw`) e ícono `size-24` sin imagen) con `alt` (por defecto `""`) y `preload` (por defecto `false`), que sólo se aplican a `<Image>`, o, sin imagen, el ícono de `categoryIcon(category)` sobre el tinte de `categoryTint(category)`, con `aria-hidden`
- `HeaderSearchSlot({ children }: { children: ReactNode })`, `features/search/components/HeaderSearchSlot.tsx` (`"use client"`): `null` en `/` y en toda ruta que empieza por `/buscar`, que ya tienen su buscador; si no, sus hijos

Sugerencias, `features/search/lib/`:

- `buildPanelItems({ query, data, recents, radio }): PanelItem[]` (`panelItems.ts`): con 2 o más caracteres y datos, términos, productos y categorías; luego los recientes; los enlaces se arman con `searchHref` o `/p/{slug}`
- `useSuggestions(query: string, radio: RadiusKm | null): SuggestionsData | null` (`useSuggestions.ts`): pide `/api/suggestions` con 200 ms de espera y cancela la petición vigente; `null` con menos de 2 caracteres o si la API falla
- `readRecents(): string[]` y `addRecent(term: string): string[]` (`recents.ts`): hasta 5 términos en `localStorage` (clave `recent-searches`), el más nuevo primero y sin repetir; si el almacenamiento está bloqueado o lleno, no lanza

Tintes, `features/search/lib/categoryTint.ts`:

- `categoryTint(category: Category | null): { bg: string; fg: string }`: una de cuatro parejas de tokens (`bg-primary-soft`/`text-primary-text`, `bg-success-soft`/`text-success`, `bg-warning-soft`/`text-warning`, `bg-muted`/`text-muted-foreground`) según un hash estable del `slug`; sin categoría, la primera.

Íconos, `features/search/lib/categoryIcon.ts`:

- `categoryIcon(category: Category | null): LucideIcon`: el ícono de `lucide-react` de la raíz (`parent_slug ?? slug`); `Package` sin categoría o con una raíz sin mapeo.

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `optionsFor` | `components/RadiusFilter.tsx` | con coordenadas, 3, 10, 25, 50 km y todo el país; con ciudad, "Sólo {ciudad}" (radio 10) y todo el país; el vigente lleva `aria-current="true"` |
| `relatedCategories` | `components/EmptyState.tsx` | hasta cuatro: con `categoria`, sus hermanas; sin ella o si no está en el árbol, las raíz |
| Panel de sugerencias | `components/SearchBox.tsx`, `components/SuggestionsPanel.tsx` | el panel cuelga del contenedor `relative` de `SearchPill`; la ruta que consulta es `app/api/suggestions/route.ts` (no se cambia desde acá) |
| Cabecera | `features/site/components/SiteHeader.tsx` (montada por `app/layout.tsx`) | `SearchPill compact` dentro de `HeaderSearchSlot` (en móvil, segunda fila a todo el ancho; desde `md`, centrada con `md:max-w-xl`), en un `<Suspense fallback={null}>` porque `usePathname` suspende en las rutas con parámetros de respaldo |
| Barra de filtros | `components/SearchResults.tsx` | chips de categoría raíz (`toggleVariants` sobre `<Link>`, el activo con `aria-current="true"` y `href` que la quita) y `RadiusFilter` en línea desde `md` o dentro de `FiltersSheet` en móvil |
| Página | `app/buscar/page.tsx` | `metadata` estática con `robots` `noindex, follow`; `SearchPill compact` y resultados, cada uno en su `<Suspense>` |
| Inicio | `app/page.tsx` | héroe sobre `bg-primary` (insignia, `h1`, texto y `SearchPill`), `CategoryRail` y `NearbyStores`; sin rejilla de productos (spec §7); el `h1` lo comprueba `e2e/search.spec.ts` |

## 6. Dependencias

- `lib/marketplace/client.ts`: `searchProducts()` y `listCategories()` en `SearchResults.tsx`.
- `lib/marketplace/params.ts` (`RADIUS_OPTIONS`, `DEFAULT_RADIUS_KM`, `RadiusKm`) y `lib/marketplace/schemas.ts` (`SearchItem`, `FeaturedProduct`, `PageMeta`, `CategoryNode`).
- `features/location/server/location.ts` (`getEffectiveLocation`) y `features/location/lib/cookie.ts` (`toGeoFilter`); `features/site/components/SiteHeader.tsx` monta `SearchPill` dentro de `HeaderSearchSlot`.
- `lib/format.ts` (`formatUsd`, `formatVes`, `formatRate`, `formatDistance`) y `lib/site.ts` (`SITE_NAME`).
- `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/badge.tsx`, `components/ui/card.tsx`, `components/ui/sheet.tsx`, `components/ui/toggle.tsx` (`toggleVariants` en `RadiusFilter` y los chips) y `components/ui/skeleton.tsx`.
- `next/form`, `next/link`, `next/image` y `next/navigation` (`usePathname` en `HeaderSearchSlot`).
- `app/api/suggestions/route.ts` (sólo por `fetch` desde `useSuggestions`; el navegador no llama a posveapi) y `next/navigation` (`useRouter` en `SearchBox`).
- `lucide-react`: íconos por nombre, decorativos con `aria-hidden`.
- `lib/utils.ts` (`cn`) en `SearchPill`, `ProductThumb`, `RadiusFilter`, `SearchResults` y `CategoryLinks`.

## 7. Ejemplo de uso

```tsx
import { Suspense } from "react";
import { SearchPill } from "@/features/search/components/SearchPill";
import { SearchResults } from "@/features/search/components/SearchResults";

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
- `SearchPill` no depende de la petición: la portada usa la píldora sin `defaultQuery`. No lee la cookie `loc`; el radio de las sugerencias sale de `window.location.search` al interactuar, así no exige `<Suspense>`.
- `localStorage` se toca sólo desde `recents.ts`, dentro de `try`, y sólo en el navegador tras interactuar: nunca durante el render del servidor.
- El panel no calcula montos: `min_price_usd` y `min_price_ves` van por `formatUsd` y `formatVes`.
- `buttonVariants` y `toggleVariants` sobre `<Link>` pasan por `cn` (`.claude/rules/ui.md` 3); los colores de los tintes son tokens, no clases de paleta.

## 9. Pruebas

- Comando: `npx vitest run features/search`
- `features/search/__tests__/query.test.ts`: radio inválido, `pais` y válido; página negativa; `q` largo y recortado; categoría inválida; `searchHref` con valores por defecto y `radio=pais`.
- `features/search/__tests__/ProductCard.test.tsx`: aviso de récipe, "Desde" según `offers_count` y "Fuera de tu zona".
- `features/search/__tests__/EmptyState.test.tsx`: ampliar radio, todo el país según ubicación y radio, categorías hermanas y enlace a `/comercios`.
- `features/search/__tests__/RadiusFilter.test.tsx`: cinco enlaces con coordenadas y dos con ciudad.
- `features/search/__tests__/SearchResults.test.tsx`: sin `q` ni `categoria` no llama a `searchProducts`.
- `features/search/__tests__/categoryTint.test.ts`: mismo slug, misma pareja; sin categoría, la primera pareja; las cuatro parejas son alcanzables.
- `features/search/__tests__/categoryIcon.test.ts`: hija por su raíz, raíz propia, `null` y raíz sin mapeo.
- `features/search/__tests__/SearchBox.test.tsx`: pide con 2 o más letras y muestra el precio, no llama con una, flechas, Enter y Escape, recientes sin texto y API caída.
- `features/search/__tests__/panelItems.test.ts`: orden de secciones, enlaces con radio y recientes sin término.
- `features/search/__tests__/recents.test.ts`: orden, tope de cinco, valor corrupto y almacenamiento bloqueado o lleno.
- `features/search/__tests__/HeaderSearchSlot.test.tsx`: oculto en `/` y `/buscar`, visible en la ficha de un producto.
