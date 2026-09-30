---
module: "product"
path: "features/product"
type: "feature"
exports: ["loadProduct", "productMetadata", "productJsonLd", "PriceSummary", "SortLinks", "OfferCard", "ProductOffers", "ProductOffersSkeleton"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/site.ts", "features/location/cookie.ts", "features/location/server.ts", "features/events/ContactButtons.tsx", "features/events/ViewBeacon.tsx", "features/search/ProductThumb.tsx", "lib/jsonld.ts", "components/ui/badge.tsx", "components/ui/button.tsx", "components/ui/card.tsx", "components/ui/skeleton.tsx", "components/ui/toggle.tsx"]
tests: "features/product/*.test.{ts,tsx}"
verified_against: ["features/product/load.ts", "features/product/metadata.ts", "features/product/jsonld.ts", "features/product/PriceSummary.tsx", "features/product/SortLinks.tsx", "features/product/OfferCard.tsx", "features/product/ProductOffers.tsx", "app/p/[slug]/page.tsx", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/jsonld.ts", "lib/site.ts", "features/location/cookie.ts", "features/location/server.ts", "features/events/ContactButtons.tsx", "features/events/ViewBeacon.tsx", "features/search/ProductThumb.tsx", "components/ui/badge.tsx", "components/ui/button.tsx", "components/ui/card.tsx", "components/ui/skeleton.tsx", "components/ui/toggle.tsx"]
capabilities:
  - intent: "cargar un producto por slug con su 404 y su redirección"
    intent_aliases: ["producto por slug", "pagina de producto", "redireccion de producto", "producto no existe"]
    entrypoint: "loadProduct()"
    file: "features/product/load.ts"
    input: "slug: string"
    output: "ProductPage { data: ProductDetail, featured, offers, rate }; si la API da null, notFound() (404); si trae redirect_to, permanentRedirect('/p/{redirect_to}') (308)"
    source: "getProduct() de lib/marketplace (cacheado por slug, sin ubicación)"
    rules: ["RN-PRODUCT-02"]
  - intent: "armar los metadatos y el JSON-LD de un producto"
    intent_aliases: ["seo de producto", "canonica de producto", "json-ld producto", "aggregateoffer", "noindex producto"]
    entrypoint: "productMetadata()"
    file: "features/product/metadata.ts"
    input: "product: ProductDetail"
    output: "Metadata { title: name, description, alternates.canonical '/p/{slug}', openGraph.images si hay image_url, robots { index: false, follow: true } sin ofertas }; productJsonLd() da Product con AggregateOffer { lowPrice, highPrice, offerCount, priceCurrency: 'USD' } sólo si offer_count > 0"
    source: "ProductDetail de getProduct() (nacional)"
    rules: ["RN-PRODUCT-01", "RN-PRODUCT-02"]
  - intent: "mostrar dónde comprar un producto ordenado por precio o cercanía"
    intent_aliases: ["ofertas de producto", "donde comprar", "mas cerca", "menor precio", "fuera de tu zona"]
    entrypoint: "<ProductOffers />"
    file: "features/product/ProductOffers.tsx"
    input: "product: { slug, name, restriction }; searchParams con orden=cerca opcional; lee la cookie loc; se monta en <Suspense fallback={<ProductOffersSkeleton />}>"
    output: "sección 'Dónde comprarlo': tasa, SortLinks con ubicación, destacadas y ofertas del radio en un OfferCard cada una (con orden por precio, la primera oferta normal lleva 'Mejor precio'), las de outside_radius bajo 'Fuera de tu zona'; sin ofertas, 'No hay ofertas cerca. Prueba con otra ciudad.'"
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
| `RN-PRODUCT-01` | El `AggregateOffer` del JSON-LD sale de `offers_summary`, nacional: la cookie no lo cambia. | `features/product/jsonld.test.ts` ("con ofertas trae un AggregateOffer con los valores de offers_summary", "sin ofertas no trae offers") |
| `RN-PRODUCT-02` | Un producto sin ofertas en el país muestra "Sin disponibilidad ahora." y lleva `noindex`. | `features/product/metadata.test.ts` ("sin ofertas lleva noindex y la descripción de sin disponibilidad"); `e2e/product.spec.ts` ("un producto sin ofertas muestra sin disponibilidad y lleva noindex") |
| `RN-PRODUCT-03` | Las ofertas destacadas, dos como máximo, van primero y no se repiten; las de fuera del radio van bajo "Fuera de tu zona". | `features/product/ProductOffers.test.tsx` ("las destacadas van primero con Destacado y las de fuera del radio bajo Fuera de tu zona") |
| `RN-PRODUCT-04` | "Más cerca" sólo se ofrece con ubicación; sin ella el orden es por precio. | `features/product/ProductOffers.test.tsx` ("sin ubicación no ofrece Más cerca y pide sort price aunque venga orden=cerca", "con coordenadas y orden=cerca pide sort distance y radiusKm 10") |
| `RN-PRODUCT-05` | "Mejor precio" va sólo en la primera oferta normal (la primera de `offers` dentro del radio) y sólo con orden por precio; ni las destacadas, ni "Fuera de tu zona", ni la vista "Más cerca" la llevan. El frontend no compara precios: la marca sale del orden de la API. | `features/product/ProductOffers.test.tsx` ("con orden por precio marca Mejor precio una sola vez, en la primera oferta normal y no en una destacada", "con orden=cerca y ubicación no marca Mejor precio", "en Fuera de tu zona no marca Mejor precio") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Título, descripción, canónica o `noindex` del producto | `productMetadata` en `metadata.ts` | `metadata.test.ts`; la regla `seo` de `.claude/rules/seo.md` |
| Campos del JSON-LD de producto | `productJsonLd` en `jsonld.ts` | `jsonld.test.ts`; se serializa sólo con `serializeJsonLd` de `lib/jsonld.ts` |
| Qué se pide a la API para las ofertas u orden por defecto | la llamada a `getProductOffers` y `sort` en `ProductOffers.tsx` | `ProductOffers.test.tsx`; las claves las fija `productQuery` de `lib/marketplace/params.ts` |
| Datos o aspecto de una oferta | `OfferCard.tsx` | montos sólo por `formatUsd`/`formatVes`, distancia por `formatDistance`, fecha por `formatUpdatedAgo` |
| Opciones de orden | `SortLinks.tsx` | el valor `orden=cerca` que lee `ProductOffers.tsx` |
| Rango de precio del panel | `PriceSummary.tsx` | `PriceSummary.test.tsx`; sólo dólares y de `offers_summary`, sin cálculo |
| Migas de pan | `app/p/[slug]/page.tsx` | el `BreadcrumbList` lleva sólo Inicio y el producto; las categorías son texto (`/categoria/<slug>` no existe) |
| 404, 308 o slugs prerenderizados | `loadProduct` en `load.ts` y `generateStaticParams` en `app/p/[slug]/page.tsx` | comprobar con `next start` (no con `next dev`); nada de `loading.tsx` ni `<Suspense>` por encima de la página |

## 4. API pública

- `loadProduct(slug: string): Promise<ProductPage>`, `server-only`, `features/product/load.ts`
- `productMetadata(product: ProductDetail): Metadata`, `features/product/metadata.ts`
- `productJsonLd(product: ProductDetail): object`, `features/product/jsonld.ts`
- `PriceSummary({ summary }: { summary: OffersSummary }): React.JSX.Element | null`, Server Component puro, `features/product/PriceSummary.tsx`
- `SortLinks({ slug, sort }: { slug: string; sort: OfferSort })`, `features/product/SortLinks.tsx`
- `OfferCard({ offer, product, featured, best, now }: { offer: ProductOffer; product: { slug: string; name: string; restriction: Restriction }; featured: boolean; best: boolean; now: Date })`, `features/product/OfferCard.tsx`
- `ProductOffers({ product, searchParams }: { product: Pick<ProductDetail, "slug" | "name" | "restriction">; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<React.JSX.Element>`, Server Component, `features/product/ProductOffers.tsx`
- `ProductOffersSkeleton()`, fallback de `ProductOffers`, `features/product/ProductOffers.tsx`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Carga | `load.ts` | `getProduct`; `null` es `notFound()`, `redirect_to` es `permanentRedirect` a `/p/{redirect_to}` |
| Metadatos | `metadata.ts` | título, descripción según `offer_count`, canónica `/p/{slug}`, imagen OG, `noindex` sin ofertas |
| JSON-LD | `jsonld.ts` | `Product` con URL absoluta por `SITE_URL`, `Brand`, `gtin`, categoría y `AggregateOffer` |
| Resumen de precio | `PriceSummary.tsx` | "Desde $X", "hasta $Y" si la cadena del máximo difiere de la del mínimo, "en N tiendas" y "Precio en todo el país"; nada si `low_price_usd` es `null` |
| Orden | `SortLinks.tsx` | enlaces "Menor precio" y "Más cerca" con `toggleVariants` (`data-state`) y `aria-current="true"` en el activo |
| Oferta | `OfferCard.tsx` | fila con enlace a `/tienda/{slug}`, ciudad, distancia, precios, "Mejor precio" (`best`), "Destacado", "Pocas unidades", antigüedad y `ContactButtons` |
| Ofertas | `ProductOffers.tsx` | ubicación efectiva, `sort` y radio, la llamada a `getProductOffers`, el reparto en destacadas, radio y "Fuera de tu zona"; `best` sólo en la primera del radio con orden por precio |
| Página | `app/p/[slug]/page.tsx` | `generateStaticParams` (20 slugs o `__vacio`), `generateMetadata`, migas (sólo "Inicio" es enlace; `BreadcrumbList` Inicio y producto), ficha en dos columnas (imagen y panel fijo con `PriceSummary`), `ViewBeacon` y `ProductOffers` en `<Suspense>` |

## 6. Dependencias

- `lib/marketplace/client.ts` (`getProduct`, `getProductOffers`; la página usa además `listCategories` y `listSitemap`), `lib/marketplace/params.ts`, `lib/marketplace/schemas.ts`.
- `lib/format.ts`, `lib/jsonld.ts`, `lib/site.ts`.
- `features/location/server.ts` (`getEffectiveLocation`) y `features/location/cookie.ts` (`toGeoFilter`).
- `features/events/ContactButtons.tsx` y `features/events/ViewBeacon.tsx`.
- `features/search/ProductThumb.tsx` (imagen o ícono de categoría de la ficha).
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

- `loadProduct` corre fuera de `<Suspense>` en la página para que `notFound()` dé 404 y `permanentRedirect()` dé 308 antes del primer byte; `app/p/` no lleva `loading.tsx`.
- `generateStaticParams` devuelve al menos un slug: con Cache Components un arreglo vacío rompe el build.
- Metadatos y JSON-LD salen de `getProduct` sin ubicación: la cookie sólo cambia la lista de ofertas, que va en `<Suspense>`.
- `new Date()` en `ProductOffers` va después de leer la cookie y `searchParams`; si no, el prerender falla.
- Montos sólo por `formatUsd` y `formatVes`; el frontend no ordena ni filtra repetidas: la API ya quita la destacada de la lista orgánica.
- Los destacados son dos como máximo por el esquema (`featured` con `.max(2)` en `lib/marketplace/schemas.ts`).
- Una imagen de producto va por `next/image`: su dominio tiene que estar en `images.remotePatterns` de `next.config.ts`.

## 9. Pruebas

- Comando: `npx vitest run features/product`; los códigos 404 y 308, con `next build` y `next start`.
- `features/product/metadata.test.ts`: canónica, descripción en plural y singular, `noindex` sin ofertas.
- `features/product/jsonld.test.ts`: `AggregateOffer` desde `offers_summary`, sin `offers` ni `gtin` cuando faltan.
- `features/product/ProductOffers.test.tsx`: destacadas primero, "Fuera de tu zona", orden y radio según ubicación, respuesta `null` y "Mejor precio" (tres casos de RN-PRODUCT-05).
- `features/product/PriceSummary.test.tsx`: rango con y sin máximo distinto, "en 1 tienda" y "en N tiendas", sin precio mínimo no pinta nada.
