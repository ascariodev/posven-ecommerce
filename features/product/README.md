---
module: "product"
path: "features/product"
type: "feature"
exports: ["loadProduct", "productMetadata", "productJsonLd", "PriceSummary", "SortLinks", "OfferCard", "OfferSelectionProvider", "OfferSelectButton", "PurchaseBar", "ProductOffers", "ProductOffersSkeleton", "ProductDetails", "ProductGallery", "ShareButton"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/site.ts", "features/location/lib/cookie.ts", "features/location/server/location.ts", "features/events/components/ContactButtons.tsx", "features/events/components/ViewBeacon.tsx", "features/search/components/ProductCard.tsx", "lib/jsonld.ts", "components/ui/badge.tsx", "components/ui/button.tsx", "components/ui/card.tsx", "components/ui/skeleton.tsx", "components/ui/toggle.tsx", "features/cart/components/AddToCartButton.tsx", "features/cart/lib/flag.ts", "components/EmptyState.tsx"]
tests: "features/product/__tests__/*.test.{ts,tsx}"
verified_against: ["e2e/product.spec.ts", "features/product/server/load.ts", "features/product/lib/metadata.ts", "features/product/lib/jsonld.ts", "features/product/components/PriceSummary.tsx", "features/product/components/SortLinks.tsx", "features/product/components/OfferCard.tsx", "features/product/components/OfferSelection.tsx", "features/product/components/ProductOffers.tsx", "features/product/components/ProductDetails.tsx", "features/product/components/ProductGallery.tsx", "features/product/components/ShareButton.tsx", "app/globals.css", "app/p/[slug]/page.tsx", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/jsonld.ts", "lib/site.ts", "features/location/lib/cookie.ts", "features/location/server/location.ts", "features/events/components/ContactButtons.tsx", "features/events/components/ViewBeacon.tsx", "features/search/components/ProductCard.tsx", "components/ui/badge.tsx", "components/ui/button.tsx", "components/ui/card.tsx", "components/ui/skeleton.tsx", "components/ui/toggle.tsx", "components/EmptyState.tsx"]
capabilities:
  - intent: "cargar un producto por slug con su 404 y su redirección"
    intent_aliases: ["producto por slug", "pagina de producto", "redireccion de producto", "producto no existe"]
    entrypoint: "loadProduct()"
    file: "features/product/server/load.ts"
    input: "slug: string"
    output: "ProductPage { data: ProductDetail, featured, offers, rate }; si la API da null, notFound() (404); si trae redirect_to, permanentRedirect('/p/{redirect_to}') (308)"
    source: "getProduct() de lib/marketplace (cacheado por slug, sin ubicación)"
    rules: ["RN-PRODUCT-02"]
  - intent: "armar los metadatos y el JSON-LD de un producto"
    intent_aliases: ["seo de producto", "canonica de producto", "json-ld producto", "aggregateoffer", "noindex producto"]
    entrypoint: "productMetadata()"
    file: "features/product/lib/metadata.ts"
    input: "product: ProductDetail"
    output: "Metadata { title: name, description, alternates.canonical '/p/{slug}', openGraph.images si hay image_url, robots { index: false, follow: true } sin ofertas }; productJsonLd() da Product con AggregateOffer { lowPrice, highPrice, offerCount, priceCurrency: 'USD' } sólo si offer_count > 0"
    source: "ProductDetail de getProduct() (nacional)"
    rules: ["RN-PRODUCT-01", "RN-PRODUCT-02"]
  - intent: "mostrar dónde comprar un producto ordenado por precio o cercanía"
    intent_aliases: ["ofertas de producto", "donde comprar", "mas cerca", "menor precio", "fuera de tu zona"]
    entrypoint: "<ProductOffers />"
    file: "features/product/components/ProductOffers.tsx"
    input: "product: { slug, name, restriction }; searchParams con orden=cerca opcional; lee la cookie loc; se monta en <Suspense fallback={<ProductOffersSkeleton />}>"
    output: "sección 'Dónde comprarlo': tasa, SortLinks con ubicación, destacadas y las tres primeras ofertas del radio en una fila OfferCard cada una, las demás del radio tras 'Ver N tiendas más' (details nativo; su summary sigue visible al abrir y pasa a decir 'Ver menos', así el foco no se pierde; cada una lleva 'Mejor precio' sólo si la API manda is_best_price), las de outside_radius bajo 'Fuera de tu zona'; con el carrito encendido y producto sin restricción, una barra de compra con la tienda elegida (por defecto la primera servida con is_best_price que reciba pedidos; si ninguna, la primera servida que los reciba; si ninguna recibe, la de is_best_price o la primera servida), su precio y 'Agregar al carrito': fija sobre la barra inferior en móvil y pegada abajo en la columna desde md; sin ofertas, un EmptyState (components/EmptyState.tsx) con 'No hay ofertas cerca.' y 'Prueba con otra ciudad.'"
    source: "getProductOffers() de lib/marketplace con geo de getEffectiveLocation() y DEFAULT_RADIUS_KM"
    rules: ["RN-PRODUCT-03", "RN-PRODUCT-04", "RN-PRODUCT-05"]
---

# Módulo `product`

## 1. Propósito

La página de producto (`/p/[slug]`): carga el producto con su 404 y su 308, sus metadatos y su
JSON-LD nacionales, y las ofertas por tienda según la ubicación de la cookie `loc`. No ordena ni
calcula precios (la API entrega el orden, los destacados y `offers_summary`).

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-PRODUCT-01` | El `AggregateOffer` del JSON-LD sale de `offers_summary`, nacional: la cookie no lo cambia. | `features/product/__tests__/jsonld.test.ts` ("con ofertas trae un AggregateOffer con los valores de offers_summary", "sin ofertas no trae offers") |
| `RN-PRODUCT-02` | Un producto sin ofertas en el país muestra "Sin disponibilidad ahora." y lleva `noindex`. | `features/product/__tests__/metadata.test.ts` ("sin ofertas lleva noindex y la descripción de sin disponibilidad"); `e2e/product.spec.ts` ("un producto sin ofertas muestra sin disponibilidad y lleva noindex") |
| `RN-PRODUCT-03` | Las ofertas destacadas, dos como máximo, van primero y no se repiten; del radio se ven las tres primeras y las demás tras "Ver N tiendas más"; las de fuera del radio van bajo "Fuera de tu zona". | `features/product/__tests__/ProductOffers.test.tsx` ("las destacadas van primero con Destacado y las de fuera del radio bajo Fuera de tu zona", "muestra tres ofertas del radio y deja las demás tras Ver N tiendas más") |
| `RN-PRODUCT-04` | "Más cerca" sólo se ofrece con ubicación; sin ella el orden es por precio. | `features/product/__tests__/ProductOffers.test.tsx` ("sin ubicación no ofrece Más cerca y pide sort price aunque venga orden=cerca", "con coordenadas y orden=cerca pide sort distance y radiusKm 10") |
| `RN-PRODUCT-05` | "Mejor precio" sale de `is_best_price` de la oferta, que la API calcula; sin el campo no se marca. No depende de la posición, del orden ni de la lista. | `features/product/__tests__/OfferCard.test.tsx` ("Mejor precio sale de is_best_price y no de la posición"); `features/product/__tests__/ProductOffers.test.tsx` ("marca Mejor precio sólo donde la API manda is_best_price, sea cual sea la posición", "una destacada con is_best_price lleva Mejor precio y sin el campo nadie lo lleva", "sin is_best_price en la respuesta no marca Mejor precio, ni en el orden Más cerca") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Título, descripción, canónica o `noindex` del producto | `productMetadata` en `lib/metadata.ts` | `__tests__/metadata.test.ts`; la regla `seo` de `.claude/rules/seo.md` |
| Campos del JSON-LD de producto | `productJsonLd` en `lib/jsonld.ts` | `__tests__/jsonld.test.ts`; se serializa sólo con `serializeJsonLd` de `lib/jsonld.ts` |
| Qué se pide a la API para las ofertas u orden por defecto | la llamada a `getProductOffers` y `sort` en `components/ProductOffers.tsx` | `__tests__/ProductOffers.test.tsx`; las claves las fija `productQuery` de `lib/marketplace/params.ts` |
| Datos o aspecto de una oferta | `components/OfferCard.tsx` | `__tests__/OfferCard.test.tsx`; montos sólo por `formatUsd`/`formatVes`, distancia por `formatDistance`, fecha por `formatUpdatedAgo`; mejor precio y horario vienen de la API |
| Opciones de orden | `components/SortLinks.tsx` | el valor `orden=cerca` que lee `components/ProductOffers.tsx` |
| Datos plegables de la ficha (marca, categoría, EAN, venta, atributos) | `components/ProductDetails.tsx` | `__tests__/ProductDetails.test.tsx`; sólo lo que trae `productSchema`, sin inventar descripción |
| Rango de precio del panel | `components/PriceSummary.tsx` | `__tests__/PriceSummary.test.tsx`; sólo dólares y de `offers_summary`, sin cálculo |
| Migas de pan | `app/p/[slug]/page.tsx` | el `BreadcrumbList` lleva sólo Inicio y el producto; las categorías son texto (`/categoria/<slug>` no existe) |
| 404, 308 o slugs prerenderizados | `loadProduct` en `server/load.ts` y `generateStaticParams` en `app/p/[slug]/page.tsx` | comprobar con `next start` (no con `next dev`); nada de `loading.tsx` ni `<Suspense>` por encima de la página |

## 4. API pública

- `loadProduct(slug: string): Promise<ProductPage>`, `server-only`, `features/product/server/load.ts`
- `productMetadata(product: ProductDetail): Metadata`, `features/product/lib/metadata.ts`
- `productJsonLd(product: ProductDetail): object`, `features/product/lib/jsonld.ts`
- `PriceSummary({ summary }: { summary: OffersSummary }): React.JSX.Element | null`, Server Component puro, `features/product/components/PriceSummary.tsx`
- `SortLinks({ slug, sort }: { slug: string; sort: OfferSort })`, `features/product/components/SortLinks.tsx`
- `OfferCard({ offer, product, featured, now }: { offer: ProductOffer; product: { slug: string; name: string; restriction: Restriction }; featured: boolean; now: Date })`, `features/product/components/OfferCard.tsx`
- `ProductOffers({ product, searchParams }: { product: Pick<ProductDetail, "slug" | "name" | "restriction">; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<React.JSX.Element>`, Server Component, `features/product/components/ProductOffers.tsx`
- `OfferSelectionProvider({ offers: SelectableOffer[]; defaultSlug: string; children })`, `OfferSelectButton({ storeSlug, storeName, priceUsd })` y `PurchaseBar({ product: { slug, name } })`, Client Components, `features/product/components/OfferSelection.tsx`
- `ProductDetails({ product }: { product: ProductDetail }): React.JSX.Element`, Server Component, `features/product/components/ProductDetails.tsx`
- `ProductOffersSkeleton()`, fallback de `ProductOffers`, `features/product/components/ProductOffers.tsx`
- `ProductGallery({ images, alt }: { images: string[]; alt: string })`, Client Component, `features/product/components/ProductGallery.tsx`
- `ShareButton({ title, text }: { title: string; text?: string })`, Client Component, `features/product/components/ShareButton.tsx`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Carga | `server/load.ts` | `getProduct`; `null` es `notFound()`, `redirect_to` es `permanentRedirect` a `/p/{redirect_to}` |
| Metadatos | `lib/metadata.ts` | título, descripción según `offer_count`, canónica `/p/{slug}`, imagen OG, `noindex` sin ofertas |
| JSON-LD | `lib/jsonld.ts` | `Product` con URL absoluta por `SITE_URL`, `Brand`, `gtin`, categoría y `AggregateOffer` |
| Resumen de precio | `components/PriceSummary.tsx` | "Desde $X", "hasta $Y" si la cadena del máximo difiere de la del mínimo, "en N tiendas" y "Precio en todo el país"; nada si `low_price_usd` es `null` |
| Orden | `components/SortLinks.tsx` | enlaces "Menor precio" y "Más cerca" con `toggleVariants` (`data-state`) y `aria-current="true"` en el activo |
| Oferta | `components/OfferCard.tsx` | fila con enlace a `/tienda/{slug}` (zona táctil de 44 px), ciudad, distancia, precios, "Mejor precio" (`offer.is_best_price`), "Destacado", "Abierto · cierra HH:MM", "Abierto" o "Cerrado" (`is_open` y `closes_at`; nada si `is_open` falta), "Pocas unidades", antigüedad, y `ContactButtons`; fila compacta con el precio a la derecha y sin botón de agregar propio: con el carrito encendido, tienda con `accepts_orders` y producto sin restricción (`RN-CART-03`), un control redondo a la izquierda (`aria-pressed`, nombre "Elegir tienda: {tienda}, {precio}" o "Tienda elegida: …") fija la tienda de la barra de compra, y la fila elegida se resalta con `has-[[aria-pressed=true]]`; sin esas condiciones la fila no se puede elegir. El enlace y el contacto no cambian |
| Tienda elegida y barra de compra | `components/OfferSelection.tsx` | contexto de selección (`OfferSelectionProvider`, `OfferSelectButton`, `PurchaseBar`); la barra muestra sólo los montos de la oferta con `formatUsd`/`formatVes`, y sin `accepts_orders` dice que no recibe pedidos; su botón lleva el nombre "Agregar al carrito de la tienda elegida: …" para distinguirlo de los controles de elección de cada fila, y es el único "Agregar" de la ficha; el `scroll-padding` de `app/globals.css` (`[data-purchase-bar]`) evita que tape el foco; bajo `md` la barra ocupa `--toast-bottom` y el `Toaster` sube por `--toast-offset` para no taparla |
| Ofertas | `components/ProductOffers.tsx` | ubicación efectiva, `sort` y radio, la llamada a `getProductOffers`, la tienda por defecto de la barra (`is_best_price` y `accepts_orders` en el orden servido, sin comparar montos), el reparto en destacadas, radio (tres visibles, el resto en un `<details>` "Ver N tiendas más" cuyo `summary` queda visible y dice "Ver menos" abierto (`group-open:`), lista "Más ofertas") y "Fuera de tu zona"; sin marcas propias: `OfferCard` lee `is_best_price` |
| Detalles | `components/ProductDetails.tsx` | dos `<details>` nativos en una `Card`: "Detalles del producto" (abierto: marca, categoría, EAN y venta desde `restriction`) y "Descripción y presentación" (plegado: `attributes`, sólo si hay); `summary` de 44 px con foco `outline-foreground`; el texto de récipe de la ficha no vive aquí |
| Galería | `components/ProductGallery.tsx` | imagen principal en `next/image` (`priority`) y, con más de una imagen válida, una miniatura por imagen que la selecciona; sin imágenes, un marcador `role="img"` con ícono `Pill`; filtra las cadenas vacías |
| Compartir | `components/ShareButton.tsx` | botón "Compartir": con `navigator.share` abre la hoja nativa (ignora la cancelación) y sin ella copia `window.location.href` y dice "Enlace copiado" 2 s |
| Página | `app/p/[slug]/page.tsx` | `generateStaticParams` (20 slugs o `__vacio`), `generateMetadata`, migas (sólo "Inicio" es enlace; `BreadcrumbList` Inicio y producto), ficha en dos columnas (rejilla con columna móvil `minmax(0,1fr)`, L-08; `ProductGallery`, que recibe sólo `image_url` (la API no trae más imágenes): una imagen sin miniaturas y sin imagen un marcador con ícono; fija con `sticky` sólo desde `md` para no tapar las ofertas en móvil, y al lado, el panel con título, acciones (favorito y compartir) en una fila bajo la categoría, `PriceSummary`, `ProductOffers` en `<Suspense>` o "Sin disponibilidad ahora." si `offer_count` es 0, y `ProductDetails`), `ViewBeacon` y dos bloques de productos relacionados en `<Suspense>` |

## 6. Dependencias

- `lib/marketplace/client.ts` (`getProduct`, `getProductOffers`; la página usa además `listCategories` y `listSitemap`), `lib/marketplace/params.ts`, `lib/marketplace/schemas.ts`.
- `lib/format.ts`, `lib/jsonld.ts`, `lib/site.ts`.
- `features/location/server/location.ts` (`getEffectiveLocation`) y `features/location/lib/cookie.ts` (`toGeoFilter`).
- `features/events/components/ContactButtons.tsx` y `features/events/components/ViewBeacon.tsx`.
- `features/search/components/ProductCard.tsx` (productos relacionados de la ficha).
- `components/ui/` (`Badge`, `buttonVariants`, `toggleVariants`, `Card`, `Skeleton`).
- `next/navigation`, `next/link`, `next/image`.

## 7. Ejemplo de uso

```tsx
const { slug } = await params;
const { data: product } = await loadProduct(slug);

<Suspense fallback={<ProductOffersSkeleton />}>
  <ProductOffers
    product={{ slug: product.slug, name: product.name, restriction: product.restriction }}
    searchParams={searchParams}
  />
</Suspense>
```

## 8. Restricciones

- "Mejor precio" (`RN-PRODUCT-05`) es el mínimo entre las ofertas servidas y lo decide la API
  (`is_best_price`): el frontend no compara precios ni infiere la marca por posición. Tampoco
  calcula horarios: `is_open` y `closes_at` se muestran tal cual.

- "Agregar al carrito" sale en las tres listas de ofertas (destacadas, del radio y "Fuera de tu zona") sólo si `cartEnabled()`, `store.accepts_orders` y `restriction` distinta de `recipe` (la API no restringe `controlled`); con el carrito encendido, el panel de la ficha muestra además "Requiere récipe, consúltalo en la tienda." con `restriction: "recipe"` (`RN-CART-03`); la insignia "Requiere récipe" sale siempre con `restriction: "recipe"`.

- `loadProduct` corre fuera de `<Suspense>` en la página para que `notFound()` dé 404 y `permanentRedirect()` dé 308 antes del primer byte; `app/p/` no lleva `loading.tsx`.
- `generateStaticParams` devuelve al menos un slug: con Cache Components un arreglo vacío rompe el build.
- Metadatos y JSON-LD salen de `getProduct` sin ubicación: la cookie sólo cambia la lista de ofertas, que va en `<Suspense>`.
- `new Date()` en `ProductOffers` va después de leer la cookie y `searchParams`; si no, el prerender falla.
- Montos sólo por `formatUsd` y `formatVes`; el frontend no ordena ni filtra repetidas: la API ya quita la destacada de la lista orgánica.
- Los destacados son dos como máximo por el esquema (`featured` con `.max(2)` en `lib/marketplace/schemas.ts`).
- Una imagen de producto va por `next/image`: su dominio tiene que estar en `images.remotePatterns` de `next.config.ts`.

## 9. Pruebas

- Comando: `npx vitest run features/product`; los códigos 404 y 308, con `next build` y `next start`.
- `features/product/__tests__/metadata.test.ts`: canónica, descripción en plural y singular, `noindex` sin ofertas.
- `features/product/__tests__/jsonld.test.ts`: `AggregateOffer` desde `offers_summary`, sin `offers` ni `gtin` cuando faltan.
- `features/product/__tests__/ProductOffers.test.tsx`: destacadas primero, tres del radio y "Ver N tiendas más" (al abrir, el summary conserva el foco y dice "Ver menos"), "Fuera de tu zona", orden y radio según ubicación, respuesta `null` y "Mejor precio" (tres casos de RN-PRODUCT-05).
- `features/product/__tests__/OfferSelection.test.tsx`: tienda por defecto en la barra, cambio de tienda, sin botón de agregar si no `accepts_orders` y sin proveedor no pinta.
- `features/product/__tests__/ProductOffers.test.tsx`: tienda por defecto de la barra (salta la de `is_best_price` sin pedidos, primera que acepta, y sin ninguna que acepte conserva `is_best_price`) y sin barra de compra con producto recipe o con el interruptor apagado.
- `features/product/__tests__/OfferCard.test.tsx`: tienda con enlace, control de elección con tienda y precio, sin elección con receta o sin `accepts_orders`, contacto, "Mejor precio" por `is_best_price` y estados de horario.
- `features/product/__tests__/ProductDetails.test.tsx`: sección de datos abierta, atributos plegados y sin atributos ni datos opcionales.
- `features/product/__tests__/ProductGallery.test.tsx`: una imagen sin miniaturas, varias con una miniatura por imagen y sin imágenes el marcador.
- `features/product/__tests__/PriceSummary.test.tsx`: rango con y sin máximo distinto, "en 1 tienda" y "en N tiendas", sin precio mínimo no pinta nada.
