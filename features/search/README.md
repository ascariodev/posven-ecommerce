---
module: "search"
path: "features/search"
type: "feature"
exports: ["SearchQuery", "parseSearchQuery", "searchHref", "SearchResults", "ProductCard", "FeaturedCard", "RadiusFilter", "Pagination", "EmptyState", "CategoryLinks", "categoryIcon", "categoryTint", "ProductThumb", "HeaderSearchSlot", "SearchPill", "CategoryRail", "NearbyProducts", "NearbyProductsSkeleton", "FiltersSheet", "SortLinks", "ResultsHeader", "findCategory", "OpenNowFilter", "ActiveFilters", "SearchBox", "SuggestionsPanel", "buildPanelItems", "useSuggestions", "readRecents", "addRecent", "clearRecents"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/site.ts", "features/location/lib/cookie.ts", "features/location/server/location.ts", "components/ui/button.tsx", "components/ui/input.tsx", "components/ui/badge.tsx", "components/ui/card.tsx", "components/ui/sheet.tsx", "components/ui/toggle.tsx", "components/ui/skeleton.tsx", "lib/utils.ts", "app/api/suggestions/route.ts"]
tests: "features/search/__tests__/*.test.{ts,tsx}"
verified_against: ["features/search/lib/query.ts", "features/search/components/SearchResults.tsx", "features/search/components/ProductCard.tsx", "features/search/components/FeaturedCard.tsx", "features/search/components/RadiusFilter.tsx", "features/search/components/Pagination.tsx", "features/search/components/EmptyState.tsx", "features/search/components/CategoryLinks.tsx", "features/search/lib/categoryIcon.ts", "features/search/components/ProductThumb.tsx", "features/search/components/HeaderSearchSlot.tsx", "features/search/components/SearchPill.tsx", "features/search/components/CategoryRail.tsx", "features/search/components/NearbyProducts.tsx", "features/search/lib/categoryTint.ts", "features/search/components/FiltersSheet.tsx", "features/search/components/SortLinks.tsx", "features/search/components/ResultsHeader.tsx", "features/search/components/OpenNowFilter.tsx", "features/search/components/ActiveFilters.tsx", "features/search/components/SearchBox.tsx", "features/search/components/SuggestionsPanel.tsx", "features/search/lib/panelItems.ts", "features/search/lib/useSuggestions.ts", "features/search/lib/recents.ts", "app/api/suggestions/route.ts", "app/layout.tsx", "app/buscar/page.tsx", "app/page.tsx", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "features/location/lib/cookie.ts", "features/location/server/location.ts", "features/site/components/SiteHeader.tsx", "components/ui/skeleton.tsx", "components/ui/sheet.tsx", "components/ui/toggle.tsx"]
capabilities:
  - intent: "buscar productos por texto o categoría cerca del usuario"
    intent_aliases: ["buscar producto", "resultados de busqueda", "pagina buscar", "buscar por categoria"]
    entrypoint: "<SearchResults />"
    file: "features/search/components/SearchResults.tsx"
    input: "searchParams: Promise<Record<string, string | string[] | undefined>> con q, categoria, radio (3 | 10 | 25 | 50 | pais), orden (precio | cercania), abierto (1) y pagina"
    output: "ResultsHeader (migas, título y total), ActiveFilters (chips y Limpiar filtros), SortLinks, chips de categoría, RadiusFilter (si hay ubicación) y OpenNowFilter (en la columna desde md, en el Sheet de FiltersSheet en móvil), línea de tasa, FeaturedCard por destacado, ProductCard por resultado en rejilla y Pagination numerada; EmptyState si no hay nada"
    source: "searchProducts() de lib/marketplace con geo de getEffectiveLocation() (cookie loc)"
    rules: ["RN-SEARCH-01", "RN-SEARCH-03", "RN-SEARCH-04", "RN-SEARCH-06", "RN-SEARCH-07"]
  - intent: "leer y escribir los parámetros de la URL de /buscar"
    intent_aliases: ["parametros de busqueda", "url de buscar", "radio de busqueda", "enlace a buscar"]
    entrypoint: "parseSearchQuery() / searchHref()"
    file: "features/search/lib/query.ts"
    input: "Record<string, string | string[] | undefined> | SearchQuery"
    output: "SearchQuery { q: string; categoria: string | null; radio: RadiusKm | null; pagina: number; sort?: OfferSort; openNow?: boolean } | '/buscar?...'"
    source: "URL"
    rules: ["RN-SEARCH-02", "RN-SEARCH-06", "RN-SEARCH-07"]
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
  - intent: "mostrar el riel de productos cercanos del inicio"
    intent_aliases: ["cerca de ti", "productos cercanos", "riel de productos", "productos cerca del inicio"]
    entrypoint: "<NearbyProducts />"
    file: "features/search/components/NearbyProducts.tsx"
    input: "sin props; lee la cookie loc; se monta dentro de <Suspense fallback={<NearbyProductsSkeleton />}>"
    output: "sección 'Cerca de ti' (con ubicación) o 'Productos en {SITE_NAME}' (sin ella) con hasta 8 tarjetas en scroll horizontal (nombre primero en el DOM y la meta de tiendas y distancia arriba por `order-first`, USD y Bs) y 'Ver todo' a /buscar; sin productos o con la API caída no pinta nada"
    source: "listNearbyProducts() de lib/marketplace con geo de getEffectiveLocation() (cookie loc)"
    rules: []
---

# Módulo `search`

## 1. Propósito

La búsqueda de productos en `/buscar` y el buscador del inicio: lee `q`, `categoria`, `radio`, `orden`, `abierto` y
`pagina` de la URL, pide `searchProducts()` con la ubicación de la cookie y pinta cabecera de
resultados (migas, título y total), orden, chips de categoría y filtros, destacados, resultados, paginación y el estado vacío; la píldora
`SearchPill` y el carril `CategoryRail` arman el inicio. No calcula montos ni distancias ni ordena:
orden, horarios y montos los entrega la API; esto sólo los formatea.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-SEARCH-01` | Sin término ni categoría, `/buscar` no llama a la API y muestra la invitación a buscar. | `features/search/__tests__/SearchResults.test.tsx` ("sin q ni categoría pide escribir y no llama a searchProducts") |
| `RN-SEARCH-02` | Un radio fuera de 3, 10, 25, 50 o `pais` se toma como 10 km. | `features/search/__tests__/query.test.ts` ("lleva un radio que no está entre las opciones a 10", "sin radio usa 10") |
| `RN-SEARCH-03` | Un producto con `restriction` `recipe` muestra el aviso "Requiere récipe". | `features/search/__tests__/ProductCard.test.tsx` ("avisa que requiere récipe") |
| `RN-SEARCH-04` | "Desde" antecede al precio sólo si `offers_count` es mayor que 1. | `features/search/__tests__/ProductCard.test.tsx` ("con una sola oferta no antepone Desde", "con varias ofertas antepone Desde") |
| `RN-SEARCH-05` | Con menos de 2 caracteres el buscador no llama a `/api/suggestions`: sólo ofrece los recientes. | `features/search/__tests__/SearchBox.test.tsx` ("con una letra no llama a la API") |
| `RN-SEARCH-06` | `orden` acepta `precio` o `cercania`; otro valor se ignora; sin él, o con `cercania` y sin ubicación, no se envía `sort`, así que manda el orden por defecto de la API. | `features/search/__tests__/query.test.ts` ("lee orden=precio y orden=cercania como sort", "sin orden o con un valor desconocido no trae sort"), `features/search/__tests__/SearchResults.test.tsx` ("pasa el orden de la URL a searchProducts") |
| `RN-SEARCH-07` | `abierto=1` activa `openNow` y envía `open_now` a `/search`; la API decide qué tiendas están abiertas, el frontend no calcula horarios. Otro valor lo omite. | `features/search/__tests__/query.test.ts` ("abierto=1 activa openNow y otro valor o ausencia lo omite"), `features/search/__tests__/SearchResults.test.tsx` ("pasa open_now a searchProducts sólo con abierto=1") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| El orden de resultados | `SortLinks.tsx` (`optionsFor`) y `orden` en `query.ts` | el valor lo valida `parseSort`; el orden lo hace la API, nunca el frontend; sin ubicación se ofrece "Relevancia" en vez de "Más cercano" |
| Un parámetro nuevo de la URL o su valor por defecto | `SearchQuery`, `parseSearchQuery` y `searchHref` en `query.ts` | sus casos en `query.test.ts`; `searchHref` omite el valor por defecto |
| Qué se envía a la API | la llamada a `searchProducts` en `SearchResults.tsx` | las claves las fija `searchQuery` de `lib/marketplace/params.ts`, que no se cambia desde acá |
| Opciones del filtro de radio | `optionsFor` en `RadiusFilter.tsx` | las opciones salen de `RADIUS_OPTIONS`; `RadiusFilter.test.tsx` cuenta los enlaces |
| Sugerencias del estado vacío | `EmptyState.tsx` (`relatedCategories`, ampliar radio, todo el país, quitar Abierto ahora) y el bloque `nearby` que le pasa `SearchResults.tsx` | sus casos en `EmptyState.test.tsx` |
| Tinte de una categoría sin imagen | `TINTS` en `categoryTint.ts` | `categoryTint.test.ts`; los colores son los tokens `primary-soft`, `success-soft`, `warning-soft` y `muted` de `app/globals.css` |
| Píldora de búsqueda | `SearchPill.tsx` | el rol `combobox` con nombre "Buscar productos" y el botón "Buscar" que usa `e2e/search.spec.ts` (el botón de ubicación también empieza por "Buscar": se pulsa con `exact: true`) |
| Carril de categorías del inicio | `CategoryRail.tsx` | chips `rounded-full` de 44 px (`buttonVariants` outline, con `border-input-border` por ui.md §5: 3:1; el lienzo W01 usa `--border`, pero la regla manda) con "Todo" primero; los enlaces se arman con `searchHref` y el nombre accesible de cada chip es el de la categoría |
| Filtros en móvil | `FiltersSheet.tsx` (recibe distancia y disponibilidad como `children`) | los casos "elegir ciudad" y "abierto ahora" de `e2e/search.spec.ts` abren "Filtros" en móvil |
| Un filtro nuevo | `SearchQuery`/`parseSearchQuery`/`searchHref` en `query.ts`, su enlace en la columna y en la hoja de `SearchResults.tsx` y su chip en `chipsFor` de `ActiveFilters.tsx` | `ActiveFilters.test.tsx`; el valor por defecto no es chip y `Limpiar filtros` lo restablece |
| Panel de sugerencias (orden de secciones, enlaces) | `buildPanelItems` en `panelItems.ts` y `SuggestionsPanel.tsx` | `panelItems.test.ts`; los precios sólo por `formatUsd` y `formatVes` |
| Teclado, ARIA y recientes del buscador | `SearchBox.tsx` y `recents.ts` | `SearchBox.test.tsx`, `recents.test.ts` y el caso de sugerencias de `e2e/search.spec.ts` |
| Datos de la tarjeta de producto | `ProductCard.tsx` | `ProductCard.test.tsx`; los montos sólo por `formatUsd` y `formatVes` |
| El ícono de una categoría raíz | `ROOT_ICONS` en `categoryIcon.ts` | su caso en `categoryIcon.test.ts`; los íconos salen sólo de `lucide-react` |
| En qué rutas la cabecera muestra el buscador | `HeaderSearchSlot.tsx` | sus casos en `HeaderSearchSlot.test.tsx` |

## 4. API pública

URL de la búsqueda, `features/search/lib/query.ts`:

- `type SearchQuery = { q: string; categoria: string | null; radio: RadiusKm | null; pagina: number; sort?: OfferSort; openNow?: boolean }`
- `parseSearchQuery(raw: Record<string, string | string[] | undefined>): SearchQuery`: `q` recortado y cortado a 100 caracteres; `categoria` sólo si casa `^[a-z0-9-]+$`; `radio` `pais` es `null`, ausente o inválido es 10; `pagina` entero mayor o igual a 1, si no 1; `orden` `precio` es `price`, `cercania` es `distance` y cualquier otro valor deja `sort` ausente; `abierto` `1` pone `openNow` y otro valor lo deja ausente; de un arreglo toma el primer valor.
- `searchHref(query: SearchQuery): string`: `/buscar?...` sin `q` vacío, `categoria` null, `radio` 10 ni `pagina` 1; `radio` null se escribe `pais`; `sort` se escribe `orden=precio` u `orden=cercania`; `openNow` verdadero se escribe `abierto=1`.

Componentes:

- `SearchPill({ defaultQuery, compact = false }: { defaultQuery?: string; compact?: boolean })`, Client Component (`"use client"`), `features/search/components/SearchPill.tsx`: píldora `rounded-full` con el `Form` de `next/form` (`role="search"`, `onSubmit` que guarda la consulta en recientes) que contiene el `SearchBox`, y el botón "Buscar" fuera del `<form>` con `form={id}` para no anidar formularios; `compact` usa controles de 44 px en móvil y 36 px desde `md` (`h-11 md:h-9`, `/buscar`), si no 44 px (inicio); la ubicación no vive en la píldora: es el botón de la cabecera (`features/location/components/LocationBar.tsx`)
- `SearchBox({ defaultQuery, className }: { defaultQuery?: string; className?: string })`, `"use client"`, `features/search/components/SearchBox.tsx`: input `role="combobox"` ("Buscar productos", `aria-expanded`, `aria-controls`, `aria-activedescendant`) con el panel; las flechas mueven la opción activa (ArrowDown con el panel cerrado lo abre y deja activa la primera), Enter la abre, Escape y perder el foco cierran; el radio sale de la URL actual
- `SuggestionsPanel({ id, items, activeIndex, onPick, onClearRecents }: { id: string; items: PanelItem[]; activeIndex: number; onPick: (item: PanelItem) => void; onClearRecents?: () => void })`, `features/search/components/SuggestionsPanel.tsx`: `listbox` con grupos Sugerencias, Productos (miniatura, nombre, `formatUsd` y `formatVes` de `min_price_*`), Categorías y Recientes; cada opción es un `Link` con `role="option"`; con recientes y `onClearRecents`, el botón "Borrar historial" (44 px) cuelga bajo el `listbox`, no es opción y su `onMouseDown` evita robar el foco del input
- `CategoryRail({ categories }: { categories: CategoryNode[] })`, Server Component, `features/search/components/CategoryRail.tsx`: `<nav aria-label="Categorías">` con chips de ícono y nombre (más "Todo", sin categoría) a `searchHref({ q: "", categoria, radio: DEFAULT_RADIUS_KM, pagina: 1 })`, en scroll horizontal nativo; `null` sin categorías. Los chips llevan `border-input-border` (3:1, ui.md §5) y no `border-border` del lienzo. El chip "Todo" repite `bg-primary` bajo `dark:` porque el `dark:bg-transparent` de la variante `outline` lo anula.
- `NearbyProducts({ title, showAll = true }: { title?: string; showAll?: boolean } = {}): Promise<React.JSX.Element | null>`, Server Component (`title` cambia el encabezado; `showAll` falso oculta "Ver todo"), `features/search/components/NearbyProducts.tsx`: `listNearbyProducts({ geo, radiusKm: geo ? DEFAULT_RADIUS_KM : null, page: 1 })`, primeros 8 en `<ul>` de scroll horizontal nativo (`w-40` por tarjeta), con las tiendas, la distancia (`formatDistance`) y los montos que entrega la API; `null` sin productos o ante `MarketplaceUnavailableError`
- `NearbyProductsSkeleton()`, fallback de `NearbyProducts`, `features/search/components/NearbyProducts.tsx`
- `FiltersSheet({ children }: { children: ReactNode })`, `features/search/components/FiltersSheet.tsx` (`"use client"`): botón "Filtros" (sólo bajo `md`) que abre un `Sheet` inferior con los hijos (distancia y disponibilidad); los filtros siguen siendo de servidor
- `SearchResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<React.JSX.Element>`, Server Component, `features/search/components/SearchResults.tsx`
- `ProductCard({ item }: { item: SearchItem })`, `features/search/components/ProductCard.tsx`
- `FeaturedCard({ item }: { item: FeaturedProduct })`, `features/search/components/FeaturedCard.tsx`: tienda y distancia en `text-foreground` (`text-muted-foreground` no llega a AA sobre `bg-primary-soft`)
- `SortLinks({ query, hasLocation }: { query: SearchQuery; hasLocation: boolean })`, `features/search/components/SortLinks.tsx`: `<nav aria-label="Ordenar por">` con chips que cambian `orden` y vuelven a la página 1; con ubicación, "Más cercano" (el defecto) y "Menor precio"; sin ella, "Relevancia" y "Menor precio"
- `ResultsHeader({ query, categories, total, geoKind, locationName, showTotal })`, `features/search/components/ResultsHeader.tsx`: migas `Inicio › categoría padre › categoría › texto`, título `h2` (el texto o la categoría) y total ("N productos", más "en {ciudad}", "a menos de N km" o "en todo el país" con ubicación); el total no se pinta con `showTotal` falso
- `OpenNowFilter({ query }: { query: SearchQuery })`, `features/search/components/OpenNowFilter.tsx`: `<nav aria-label="Disponibilidad">` con el enlace "Abierto ahora" que alterna `abierto=1` y vuelve a la página 1; el estado lo anuncia un texto `sr-only` ("activado" o "desactivado") dentro del enlace, porque `aria-pressed` no es válido en el rol `link` y `role="switch"` cambiaría la semántica de navegación
- `ActiveFilters({ query, categories, hasLocation }: { query: SearchQuery; categories: CategoryNode[]; hasLocation: boolean })`, `features/search/components/ActiveFilters.tsx`: `<nav aria-label="Filtros activos">` con un chip enlace "Quitar filtro X" por categoría (sólo con texto de búsqueda), radio distinto de 10 (con ubicación) y "Abierto ahora", más "Limpiar filtros" que los restablece conservando texto y orden; nada si no hay filtros
- `findCategory(nodes: CategoryNode[], slug: string, parent?: CategoryNode | null): { node: CategoryNode; parent: CategoryNode | null } | null`, `features/search/components/ResultsHeader.tsx`: busca una categoría en el árbol y devuelve su padre
- `RadiusFilter({ query, geoKind, cityName }: { query: SearchQuery; geoKind: "coords" | "city"; cityName: string | null })`, `features/search/components/RadiusFilter.tsx`
- `Pagination({ query, meta }: { query: SearchQuery; meta: PageMeta })`, `features/search/components/Pagination.tsx`: Anterior, números (primera, última y vecinas de la actual con elipsis; la actual con `aria-current="page"`) y Siguiente, todos por `searchHref`
- `EmptyState({ query, geoKind, categories, nearby }: { query: SearchQuery; geoKind: "coords" | "city" | null; categories: CategoryNode[]; nearby?: ReactNode })`, `features/search/components/EmptyState.tsx`: título, con `q` una línea de consejo ("Prueba con menos palabras o revisa cómo está escrito."), enlaces de ampliar radio, todo el país y "Quitar «Abierto ahora»" (con `openNow`), el bloque `nearby`, categorías relacionadas y el enlace a `/comercios`; todos conservan `orden` por `searchHref`
- `CategoryLinks({ categories }: { categories: CategoryNode[] })`, `features/search/components/CategoryLinks.tsx`: chips de categoría como enlaces a `/buscar`, con `buttonVariants` outline `sm`, `rounded-full` y `shadow-card`
- `ProductThumb({ imageUrl, category, size, alt, preload, className }: { imageUrl: string | null; category: Category | null; size: "md" | "card" | "detail"; alt?: string; preload?: boolean; className?: string })`, Server Component, `features/search/components/ProductThumb.tsx`: la imagen (96 px en `md`; `card` llena un contenedor `aspect-[4/3]`; `detail`, el de la ficha, llena uno `aspect-square` con `object-contain p-6`, `sizes` a su columna (`(min-width: 1024px) 540px, (min-width: 768px) 50vw, 100vw`) e ícono `size-24` sin imagen) con `alt` (por defecto `""`) y `preload` (por defecto `false`), que sólo se aplican a `<Image>`, o, sin imagen, el ícono de `categoryIcon(category)` sobre el tinte de `categoryTint(category)`, con `aria-hidden`
- `HeaderSearchSlot({ children }: { children: ReactNode })`, `features/search/components/HeaderSearchSlot.tsx` (`"use client"`): `null` en `/` y en toda ruta que empieza por `/buscar`, que ya tienen su buscador; si no, sus hijos

Sugerencias, `features/search/lib/`:

- `buildPanelItems({ query, data, recents, radio }): PanelItem[]` (`panelItems.ts`): con 2 o más caracteres y datos, términos, productos y categorías; luego los recientes; los enlaces se arman con `searchHref` o `/p/{slug}`
- `useSuggestions(query: string, radio: RadiusKm | null): SuggestionsData | null` (`useSuggestions.ts`): pide `/api/suggestions` con 200 ms de espera y cancela la petición vigente; `null` con menos de 2 caracteres o si la API falla
- `readRecents(): string[]`, `addRecent(term: string): string[]` y `clearRecents(): void` (`recents.ts`): hasta 5 términos en `localStorage` (clave `recent-searches`), el más nuevo primero y sin repetir; si el almacenamiento está bloqueado o lleno, no lanza (`clearRecents` borra la clave)

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
| Cabecera y orden | `components/SearchResults.tsx` | `ResultsHeader` y `SortLinks` encabezan los resultados; el estado vacío sólo lleva el título |
| Filtros | `components/SearchResults.tsx` | columna lateral desde `md` (categorías, `RadiusFilter` con ubicación y `OpenNowFilter`); en móvil, chips de categoría raíz (`toggleVariants` sobre `<Link>`, el activo con `aria-current="true"` y `href` que la quita) y `FiltersSheet` con distancia y disponibilidad; `ActiveFilters` debajo del encabezado en ambos |
| Página | `app/buscar/page.tsx` | `metadata` estática con `robots` `noindex, follow`; `SearchPill compact` y resultados, cada uno en su `<Suspense>` |
| Inicio | `app/page.tsx` | héroe sobre `bg-primary` (insignia, `h1`, texto y `SearchPill`), `CategoryRail`, `NearbyProducts` y `NearbyStores`, cada bloque en su `<Suspense>`; los productos van en un riel, no en rejilla (spec §7); el `h1` lo comprueba `e2e/search.spec.ts` |

## 6. Dependencias

- `lib/marketplace/client.ts`: `searchProducts()` y `listCategories()` en `SearchResults.tsx`, `listNearbyProducts()` en `NearbyProducts.tsx`; `lib/marketplace/errors.ts` (`MarketplaceUnavailableError`) en `NearbyProducts.tsx`.
- `lib/marketplace/params.ts` (`RADIUS_OPTIONS`, `DEFAULT_RADIUS_KM`, `NATIONWIDE`, `RadiusKm`) y `lib/marketplace/schemas.ts` (`SearchItem`, `FeaturedProduct`, `PageMeta`, `CategoryNode`).
- `features/location/server/location.ts` (`getEffectiveLocation`) y `features/location/lib/cookie.ts` (`toGeoFilter`); `features/site/components/SiteHeader.tsx` monta `SearchPill` dentro de `HeaderSearchSlot`.
- `lib/format.ts` (`formatUsd`, `formatVes`, `formatRate`, `formatDistance`) y `lib/site.ts` (`SITE_NAME`).
- `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/badge.tsx`, `components/ui/card.tsx`, `components/ui/sheet.tsx`, `components/ui/toggle.tsx` (`toggleVariants` en `RadiusFilter` y los chips) y `components/ui/skeleton.tsx`.
- `next/form`, `next/link`, `next/image` y `next/navigation` (`usePathname` en `HeaderSearchSlot`).
- `app/api/suggestions/route.ts` (sólo por `fetch` desde `useSuggestions`; el navegador no llama a posveapi) y `next/navigation` (`useRouter` en `SearchBox`).
- `lucide-react`: íconos por nombre, decorativos con `aria-hidden`.
- `lib/utils.ts` (`cn`) en `SearchPill`, `ProductThumb`, `RadiusFilter`, `SearchResults`, `SortLinks` y `CategoryLinks`.

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
- `NearbyProducts` lee la cookie `loc`: va siempre dentro de un `<Suspense>` y nunca dentro de `'use cache'`; es un bloque secundario (el inicio y el "Quizás te sirve" del estado vacío de `SearchResults`, dentro de su `<Suspense>`; `/products/nearby` no admite `open_now`, así que con `abierto=1` el título lo aclara y el frontend no calcula horarios), así que atrapa `MarketplaceUnavailableError` y no se pinta (regla `app-router` 7).
- `SearchPill` no depende de la petición: la portada usa la píldora sin `defaultQuery`. No lee la cookie `loc`; el radio de las sugerencias sale de `window.location.search` al interactuar, así no exige `<Suspense>`.
- `localStorage` se toca sólo desde `recents.ts`, dentro de `try`, y sólo en el navegador tras interactuar: nunca durante el render del servidor.
- El panel no calcula montos: `min_price_usd` y `min_price_ves` van por `formatUsd` y `formatVes`.
- `buttonVariants` y `toggleVariants` sobre `<Link>` pasan por `cn` (`.claude/rules/ui.md` 3); los colores de los tintes son tokens, no clases de paleta.

## 9. Pruebas

- Comando: `npx vitest run features/search`
- `features/search/__tests__/query.test.ts`: radio inválido, `pais` y válido; página negativa; `q` largo y recortado; categoría inválida; `searchHref` con valores por defecto, `radio=pais` y `orden`.
- `features/search/__tests__/NearbyProducts.test.tsx`: tarjeta con enlace, tiendas y distancia, nombre accesible del enlace que empieza por el nombre del producto, "desde" sólo con varias ofertas, sin productos y API caída sin pintar nada.
- `features/search/__tests__/ProductCard.test.tsx`: aviso de récipe, "Desde" según `offers_count` y "Fuera de tu zona".
- `features/search/__tests__/EmptyState.test.tsx`: ampliar radio, todo el país según ubicación y radio, categorías hermanas y enlace a `/comercios`.
- `features/search/__tests__/RadiusFilter.test.tsx`: cinco enlaces con coordenadas y dos con ciudad.
- `features/search/__tests__/SearchResults.test.tsx`: sin `q` ni `categoria` no llama a `searchProducts`; pasa `sort` de `orden` a `searchProducts` (sin ubicación descarta `cercania`); evento `search` según página; con `abierto=1` sin resultados el bloque "Quizás te sirve" se rotula "(sin filtrar por horario)".
- `features/search/__tests__/ResultsHeader.test.tsx`: migas, título y total de `ResultsHeader`.
- `features/search/__tests__/SortLinks.test.tsx`: opción actual con y sin ubicación, y `orden=cercania` sin ubicación deja Relevancia como actual.
- `features/search/__tests__/Pagination.test.tsx`: ventana de páginas con elipsis, página actual y orden conservado en los enlaces.
- `e2e/search.spec.ts`: cambiar a "Menor precio" escribe `orden=precio` y ordena las tarjetas por precio.
- `features/search/__tests__/CategoryRail.test.tsx`: Todo primero y hacia `/buscar`, categorías con nombre accesible y enlace, y sin categorías no pinta.
- `features/search/__tests__/categoryTint.test.ts`: mismo slug, misma pareja; sin categoría, la primera pareja; las cuatro parejas son alcanzables.
- `features/search/__tests__/categoryIcon.test.ts`: hija por su raíz, raíz propia, `null` y raíz sin mapeo.
- `features/search/__tests__/SearchBox.test.tsx`: pide con 2 o más letras y muestra el precio, no llama con una, flechas, Enter y Escape, recientes sin texto, borrar recientes (fuera del listbox, foco en el input) y API caída.
- `features/search/__tests__/panelItems.test.ts`: orden de secciones, enlaces con radio y recientes sin término.
- `features/search/__tests__/recents.test.ts`: orden, tope de cinco, valor corrupto, almacenamiento bloqueado o lleno y borrado.
- `features/search/__tests__/HeaderSearchSlot.test.tsx`: oculto en `/` y `/buscar`, visible en la ficha de un producto.
