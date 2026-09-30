---
module: "store"
path: "features/store"
type: "feature"
exports: ["StoreCard", "NearbyStores", "NearbyStoresSkeleton", "storeInitials", "formatSchedule", "openingHoursJsonLd", "storeJsonLd", "StoreHeader", "StoreProducts", "StoreProductsSkeleton"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/jsonld.ts", "lib/site.ts", "features/location/cookie.ts", "features/location/server.ts", "features/events/ContactButtons.tsx", "features/events/ViewBeacon.tsx", "components/ui/badge.tsx", "components/ui/button.tsx", "components/ui/card.tsx", "lib/utils.ts", "components/ui/skeleton.tsx"]
tests: "features/store/*.test.{ts,tsx}"
verified_against: ["features/store/StoreCard.tsx", "features/store/NearbyStores.tsx", "features/store/initials.ts", "features/store/schedule.ts", "features/store/jsonld.ts", "features/store/StoreHeader.tsx", "features/store/StoreProducts.tsx", "app/page.tsx", "app/tienda/[slug]/page.tsx", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/jsonld.ts", "lib/site.ts", "features/location/cookie.ts", "features/location/server.ts", "features/events/ContactButtons.tsx", "features/events/ViewBeacon.tsx", "components/ui/badge.tsx", "components/ui/button.tsx", "components/ui/card.tsx", "lib/utils.ts", "components/ui/skeleton.tsx"]
capabilities:
  - intent: "mostrar las tiendas cercanas en la portada"
    intent_aliases: ["tiendas cercanas", "tiendas cerca de mi", "comercios cercanos", "tiendas destacadas"]
    entrypoint: "<NearbyStores />"
    file: "features/store/NearbyStores.tsx"
    input: "sin props; lee la cookie loc; se monta dentro de <Suspense fallback={<NearbyStoresSkeleton />}>"
    output: "sección 'Tiendas cercanas' (con ubicación) o 'Tiendas en {SITE_NAME}' (sin ella): destacados primero y un StoreCard por tienda en rejilla sm:2 lg:3; sin tiendas, un aviso que invita a probar otra ciudad"
    source: "listNearbyStores() de lib/marketplace con geo de getEffectiveLocation() (cookie loc)"
    rules: ["RN-STORE-02"]
  - intent: "mostrar la tarjeta de una tienda"
    intent_aliases: ["tarjeta de tienda", "logo de tienda", "iniciales de tienda", "fuera de tu zona"]
    entrypoint: "<StoreCard />"
    file: "features/store/StoreCard.tsx"
    input: "store: NearbyStore; featured?: boolean"
    output: "Card entera como enlace a /tienda/{slug}: banda de color por token (bg-featured si featured), logo o iniciales encima, nombre, city.name, distancia si no es null, 'Destacado' si featured y 'Fuera de tu zona' si outside_radius"
    source: "props"
    rules: ["RN-STORE-01", "RN-STORE-03"]
  - intent: "mostrar la cabecera de la página de una tienda con su horario y contacto"
    intent_aliases: ["pagina de tienda", "datos de la tienda", "horario de tienda", "portada de tienda", "contacto de tienda"]
    entrypoint: "<StoreHeader />"
    file: "features/store/StoreHeader.tsx"
    input: "store: Store"
    output: "portada y logo si es premium (si no, iniciales), h1 con el nombre, company_name, dirección y ciudad, h2 'Horario' con las líneas de formatSchedule() y ContactButtons sin producto"
    source: "Store de getStore() (cacheado por slug, sin ubicación)"
    rules: ["RN-STORE-01", "RN-STORE-04"]
  - intent: "listar los productos de una tienda con paginación"
    intent_aliases: ["productos de la tienda", "catalogo de tienda", "precios de una tienda"]
    entrypoint: "<StoreProducts />"
    file: "features/store/StoreProducts.tsx"
    input: "slug: string; searchParams con pagina opcional (entero >= 1, si no 1); se monta en <Suspense fallback={<StoreProductsSkeleton />}>"
    output: "sección 'Productos': tasa, una tarjeta por producto con enlace a /p/{slug}, USD, Bs, 'Pocas unidades', 'Requiere récipe' y antigüedad; 'Anterior' y 'Siguiente' a /tienda/{slug}?pagina={n}; sin productos (meta.total 0), el aviso de tienda sin productos publicados"
    source: "getStore({ slug, page }) de lib/marketplace"
    rules: []
  - intent: "armar el JSON-LD de una tienda"
    intent_aliases: ["json-ld tienda", "seo de tienda", "openinghoursspecification", "schema.org store"]
    entrypoint: "storeJsonLd()"
    file: "features/store/jsonld.ts"
    input: "store: Store"
    output: "Store con name, url absoluta, PostalAddress, GeoCoordinates, telephone si hay, openingHoursSpecification si hay tramos e image con logo_url sólo si es premium"
    source: "Store de getStore()"
    rules: ["RN-STORE-04"]
---

# Módulo `store`

## 1. Propósito

Las tiendas: la lista "Tiendas cercanas" de la portada según la cookie `loc`, la tarjeta de cada
tienda y la página `/tienda/[slug]` con su cabecera (portada, logo, datos, horario y contacto), sus
productos paginados, sus metadatos y su JSON-LD. No ordena ni calcula distancias ni precios: la API
entrega el orden, `distance_km`, `outside_radius` y los montos.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-STORE-01` | El logo se muestra sólo si la tienda es premium y tiene `logo_url`; si no, un círculo con la inicial en mayúscula de cada una de las dos primeras palabras del nombre. | `features/store/StoreCard.test.tsx` ("toma las iniciales de las dos primeras palabras del nombre", "premium sin logo muestra las iniciales", "no premium con logo_url muestra las iniciales y no el logo"); el logo y las iniciales de StoreHeader.tsx aplican la misma regla, pendiente: sin prueba |
| `RN-STORE-02` | Los destacados (hasta dos, con "Destacado") van primero y una tienda destacada que también viene en `data` no se repite. | `features/store/NearbyStores.test.tsx` ("un destacado que también viene en data aparece una sola vez y primero") |
| `RN-STORE-03` | Una tienda fuera del radio lleva la etiqueta "Fuera de tu zona". | `features/store/StoreCard.test.tsx` ("una tienda con outside_radius muestra Fuera de tu zona") |
| `RN-STORE-04` | La portada, la imagen Open Graph y la imagen del JSON-LD de una tienda salen sólo si es premium. | `features/store/jsonld.test.ts` ("una tienda premium con logo trae image", "una tienda sin premium no trae image aunque tenga logo_url"); la portada de `StoreHeader.tsx` y la imagen Open Graph de `app/tienda/[slug]/page.tsx`, pendiente: sin prueba |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Datos o aspecto de la tarjeta | `StoreCard.tsx` | `StoreCard.test.tsx`; la distancia sólo por `formatDistance`; los colores de la banda son tokens |
| Cuándo se muestra el logo o cómo salen las iniciales | `logoUrl` en `StoreCard.tsx` y `StoreHeader.tsx`; `storeInitials` en `initials.ts` | los casos de RN-STORE-01 en `StoreCard.test.tsx` |
| Qué se pide a la API o cuántos destacados | la llamada a `listNearbyStores` y `MAX_FEATURED_STORES` en `NearbyStores.tsx` | `NearbyStores.test.tsx`; las claves de la consulta las fija `storesQuery` de `lib/marketplace/params.ts` |
| Títulos o aviso sin tiendas | `NearbyStores.tsx` | el `getByRole("heading")` de `e2e/search.spec.ts` |
| Texto del horario o días en el JSON-LD | `formatSchedule` y `openingHoursJsonLd` en `schedule.ts` | `schedule.test.ts` |
| Campos del JSON-LD de tienda | `storeJsonLd` en `jsonld.ts` | `jsonld.test.ts`; se serializa sólo con `serializeJsonLd` de `lib/jsonld.ts` |
| Tarjeta de producto, paginación o `pagina` | `StoreProducts.tsx` | `StoreProducts.test.tsx`; montos sólo por `formatUsd`/`formatVes` |
| Título, descripción, canónica, imagen OG, 404 o slugs prerenderizados | `generateMetadata` y `generateStaticParams` en `app/tienda/[slug]/page.tsx` | la regla `.claude/rules/seo.md`; comprobar el 404 con `next start` (no con `next dev`) |

## 4. API pública

- `StoreCard({ store, featured }: { store: NearbyStore; featured?: boolean })`, `features/store/StoreCard.tsx`
- `NearbyStores(): Promise<React.JSX.Element>`, Server Component sin props, `features/store/NearbyStores.tsx`
- `NearbyStoresSkeleton()`, fallback de `NearbyStores`, `features/store/NearbyStores.tsx`
- `storeInitials(name: string): string`, `features/store/initials.ts`
- `formatSchedule(entries: ScheduleEntry[]): string[]`, `features/store/schedule.ts`
- `openingHoursJsonLd(entries: ScheduleEntry[]): object[]`, `features/store/schedule.ts`
- `storeJsonLd(store: Store): object`, `features/store/jsonld.ts`
- `StoreHeader({ store }: { store: Store })`, `features/store/StoreHeader.tsx`
- `StoreProducts({ slug, searchParams }: { slug: string; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<React.JSX.Element>`, Server Component, `features/store/StoreProducts.tsx`
- `StoreProductsSkeleton()`, fallback de `StoreProducts`, `features/store/StoreProducts.tsx`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Tarjeta | `StoreCard.tsx` | `Card` dentro de un `<Link>` (foco en `--foreground`, `hover:shadow-raised`); banda `h-16` `bg-primary-soft` (`bg-featured` si `featured`) y el logo o las iniciales (`size-14`, `border-4 border-card`) montados sobre su borde; la portada real espera `cover_url` en `NearbyStore` (spec §7) |
| Iniciales | `initials.ts` | primeras letras de las dos primeras palabras del nombre, en mayúscula |
| Consulta de cercanas | `NearbyStores.tsx` | `listNearbyStores({ geo, radiusKm: geo ? DEFAULT_RADIUS_KM : null, page: 1 })` |
| Orden de pintado | `NearbyStores.tsx` | `featured` (hasta `MAX_FEATURED_STORES`, 2) y después `data` sin los slugs destacados |
| Horario | `schedule.ts` | `Lun`...`Dom`; tres o más días seguidos como `Lun a Sáb`, el resto separados por `, `; sin tramos, "Horario no informado"; días en inglés para `OpeningHoursSpecification` |
| JSON-LD | `jsonld.ts` | `Store` con URL absoluta por `SITE_URL`, `PostalAddress` con `addressCountry: "VE"` y `GeoCoordinates` |
| Cabecera | `StoreHeader.tsx` | portada y logo sólo para premium, `h1`, razón social, dirección, `h2` "Horario" y `ContactButtons` con `product: null` |
| Productos | `StoreProducts.tsx` | `pagina` a entero, `getStore({ slug, page })`, tasa, tarjetas, "Anterior" y "Siguiente" |
| Página | `app/tienda/[slug]/page.tsx` | `generateStaticParams` (20 slugs de `listSitemap` o `__vacio`), `generateMetadata`, JSON-LD, `StoreHeader`, `ViewBeacon` con `store_view` y `StoreProducts` en `<Suspense>` |

## 6. Dependencias

- `lib/marketplace/client.ts`: `listNearbyStores()` en `NearbyStores.tsx`, `getStore()` en `StoreProducts.tsx` y en la página, que usa además `listSitemap()`.
- `lib/marketplace/params.ts` (`DEFAULT_RADIUS_KM`) y `lib/marketplace/schemas.ts` (`NearbyStore`, `Store`, `StoreProduct`, `ScheduleEntry`).
- `features/location/server.ts` (`getEffectiveLocation`) y `features/location/cookie.ts` (`toGeoFilter`).
- `features/events/ContactButtons.tsx` en `StoreHeader.tsx` y `features/events/ViewBeacon.tsx` en la página.
- `lib/format.ts` (`formatDistance`, `formatRate`, `formatUsd`, `formatVes`, `formatUpdatedAgo`), `lib/jsonld.ts` (`serializeJsonLd`, en la página) y `lib/site.ts` (`SITE_NAME`, `SITE_URL`).
- `components/ui/badge.tsx`, `components/ui/button.tsx`, `components/ui/card.tsx` y `components/ui/skeleton.tsx`; `lib/utils.ts` (`cn`) en `StoreCard`.
- `next/link`, `next/image` y `next/navigation`.

## 7. Ejemplo de uso

```tsx
const { slug } = await params;
const response = await getStore({ slug, page: 1 });
if (response === null) notFound();

<StoreHeader store={response.data} />
<Suspense fallback={<StoreProductsSkeleton />}>
  <StoreProducts slug={slug} searchParams={searchParams} />
</Suspense>
```

## 8. Restricciones

- `NearbyStores` lee la cookie `loc`: va siempre dentro de un `<Suspense>` (`cacheComponents: true`) y nunca dentro de `'use cache'`.
- La ubicación sale de `getEffectiveLocation`: una ciudad que no reconoce llega como sin ubicación (RN-LOCATION-04), así que se pide sin `geo` ni radio y el título es el nacional.
- El orden de las tiendas, `distance_km` y `outside_radius` los entrega la API; aquí sólo se quitan los destacados repetidos y se formatea la distancia.
- La tarjeta del inicio no muestra portada: `NearbyStore` no trae `cover_url` (spec §7), así que la banda es un color de token y no una imagen.
- Logo y portada sólo para premium porque es parte de lo que la tienda premium recibe (spec §5.4); `logo_url` y `cover_url` de una tienda sin premium se ignoran.
- Logo y portada van por `next/image`: su dominio tiene que estar en `images.remotePatterns` de `next.config.ts` (spec §4.5).
- La página hace `await params` y `getStore({ slug, page: 1 })` fuera de `<Suspense>` para que `notFound()` dé 404 antes del primer byte; `app/tienda/` no lleva `loading.tsx`. `generateStaticParams` devuelve al menos un slug porque con Cache Components un arreglo vacío rompe el build.
- Metadatos, cabecera y JSON-LD no dependen de la cookie ni de `pagina`: la canónica es `/tienda/{slug}` también en `?pagina=2`.
- `new Date()` en `StoreProducts` va después de leer `searchParams`; si no, el prerender falla.

## 9. Pruebas

- Comando: `npx vitest run features/store`; el 404, con `next build` y `next start`.
- `features/store/StoreCard.test.tsx`: iniciales "FS", premium sin logo y no premium con `logo_url` muestran iniciales, "Destacado" con `featured` y "Fuera de tu zona" con `outside_radius`.
- `features/store/NearbyStores.test.tsx`: destacado repetido en `data` aparece una vez y primero.
- `features/store/schedule.test.ts`: `Lun a Sáb`, `Sáb, Dom`, "Horario no informado" y los días en inglés.
- `features/store/jsonld.test.ts`: `image` sólo premium con logo, sin `telephone` cuando falta.
- `features/store/StoreProducts.test.tsx`: productos con sus precios, "Siguiente" sin "Anterior" en la página 1 de 2, `pagina=abc` pide la página 1.
- `e2e/search.spec.ts` (`npx playwright test`): la portada muestra el bloque de tiendas.
