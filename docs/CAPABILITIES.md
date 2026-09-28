# Capacidades de posven-ecommerce

Generado por `node posven/.claude/scripts/generate-index.mjs posven-ecommerce`: no se edita a mano.
Se regenera y commitea junto con todo cambio al frontmatter `capabilities` de un README.

## marketplace

README: `lib/marketplace/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| buscar productos por texto, categoría y ubicación con su precio mínimo y los destacados | `searchProducts()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02, RN-MARKETPLACE-03 |
| listar las tiendas cercanas o de una ciudad con su distancia y las premium destacadas | `listNearbyStores()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02, RN-MARKETPLACE-03 |
| obtener el árbol de categorías globales | `listCategories()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02 |
| obtener estados, municipios y ciudades con tiendas | `listLocations()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02 |
