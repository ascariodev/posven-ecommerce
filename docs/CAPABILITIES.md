# Capacidades de posven-ecommerce

Generado por `node posven/.claude/scripts/generate-index.mjs posven-ecommerce`: no se edita a mano.
Se regenera y commitea junto con todo cambio al frontmatter `capabilities` de un README.

## location

README: `features/location/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| leer la ubicación del usuario para filtrar por cercanía | `getUserLocation()` | `features/location/server.ts` | RN-LOCATION-01, RN-LOCATION-02 |
| guardar la ubicación del usuario por geolocalización o ciudad elegida | `setLocationFromCoords() / setLocationCity() / clearLocation()` | `features/location/actions.ts` | RN-LOCATION-01, RN-LOCATION-03 |
| mostrar y cambiar la ubicación en pantalla | `<LocationBar />` | `features/location/LocationBar.tsx` | RN-LOCATION-02, RN-LOCATION-03 |

## search

README: `features/search/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| buscar productos por texto o categoría cerca del usuario | `<SearchResults />` | `features/search/SearchResults.tsx` | RN-SEARCH-01, RN-SEARCH-03, RN-SEARCH-04 |
| leer y escribir los parámetros de la URL de /buscar | `parseSearchQuery() / searchHref()` | `features/search/query.ts` | RN-SEARCH-02 |
| mostrar el formulario de búsqueda | `<SearchForm />` | `features/search/SearchForm.tsx` |  |

## marketplace

README: `lib/marketplace/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| buscar productos por texto, categoría y ubicación con su precio mínimo y los destacados | `searchProducts()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02, RN-MARKETPLACE-03 |
| listar las tiendas cercanas o de una ciudad con su distancia y las premium destacadas | `listNearbyStores()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02, RN-MARKETPLACE-03 |
| obtener el árbol de categorías globales | `listCategories()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02 |
| obtener estados, municipios y ciudades con tiendas | `listLocations()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02 |
