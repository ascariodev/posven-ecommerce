---
name: new-page
description: Crear una ruta indexable nueva en posven-ecommerce (página en app/, módulo en features/ con README, generateMetadata con canónica, JSON-LD, entrada de sitemap, prueba del builder y caso e2e). Úsala al crear sus primeros archivos: las reglas por ruta se disparan al leer un archivo existente, así que no ayudan antes de que exista.
argument-hint: "[ruta]"
model: sonnet
effort: medium
---

# Página indexable nueva en posven-ecommerce

**Existe porque las reglas de `posven-ecommerce/.claude/rules/` cargan al leer un archivo de su
glob, y crear la primera página de una ruta no casa nada.** Lo de abajo las cita; no las
reemplaza. Las rutas son relativas a `posven-ecommerce/`.

## 0. Antes de escribir

- Si existe la spec del rasgo en el espacio de quien coordina
  (`posven/.claude/docs/specs/2026-09-26-ecommerce-hiperlocal-design.md`), `spec-lookup` de la
  ruta en su §4.1: si es indexable, qué JSON-LD pide §4.2, qué umbral de `noindex` fija §4.3
  (landings de ciudad) y qué caché, §4.4. Si no existe, rigen sólo las reglas de abajo.
- Lee **ahora**, con Read, `.claude/rules/seo.md`, `app-router.md` y `tests.md`; también
  `contract.md` si la página necesita un endpoint, un campo o un `SitemapType` que
  `lib/marketplace/schemas.ts` no tiene.
- Toma como molde `app/p/[slug]/page.tsx` (slug, 404, 308, migas y parte dependiente de la
  cookie); `app/tienda/[slug]/page.tsx` es la variante sin 308. Léelos por rangos.
- Antes de usar una API de Next, su guía (regla `app-router`, ítem 1).

## 1. Piezas y rutas

| Pieza | Ruta | Molde |
|---|---|---|
| Página | `app/<ruta>/page.tsx` | `app/p/[slug]/page.tsx` |
| Módulo | `features/<dominio>/` con su `README.md` y las carpetas de `posven-ecommerce/docs/conventions/engineering.md` §4 (`components/`, `server/`, `lib/`, `__tests__/`) | `features/product/` |
| Lectura con 404 y 308 | `features/<dominio>/server/load.ts`, con `import "server-only"` | `loadProduct` en `features/product/server/load.ts` |
| Metadatos con lógica | `features/<dominio>/lib/metadata.ts` | `productMetadata` en `features/product/lib/metadata.ts` |
| JSON-LD | `features/<dominio>/lib/jsonld.ts`; migas con `breadcrumbListJsonLd` de `lib/jsonld.ts` | `productJsonLd`, `storeJsonLd` |
| Sitemap | `lib/sitemap.ts` | `PATH_PREFIX` y `STATIC_ID` |
| Pruebas | `features/<dominio>/__tests__/jsonld.test.ts` (y `metadata.test.ts` si hay `lib/metadata.ts`); `lib/__tests__/sitemap.test.ts` si cambió el sitemap | `features/product/__tests__/jsonld.test.ts` |
| e2e | un caso de canónica y JSON-LD en `e2e/product.spec.ts` o en un `e2e/<dominio>.spec.ts` | "la tienda tiene canónica sin parámetros..." en `e2e/product.spec.ts` |

Además:

- Agrega `app/<ruta>/**` al `paths:` de `.claude/rules/seo.md`: sin eso la regla no carga al
  editar la página.
- **Sitemap** (regla `seo`, ítem 8): una ruta con slug de la API necesita su tipo en
  `sitemapTypeSchema` (`lib/marketplace/schemas.ts`), que es contrato (regla `contract`, ítems 4
  y 5: spec §3 primero, después el simulado), y su prefijo en `PATH_PREFIX`, que `tsc` exige al
  ser `Record<SitemapType, string>`. Una página sin slug (`/comercios`) entra por la rama
  `STATIC_ID` de `sitemapEntries`. Lo que se sirve con `noindex` no entra al sitemap (spec §4.3
  y §6).
- Un archivo nuevo en `e2e/` se suma al e2e de cierre que lista la regla `tests`, ítem 7.

## 2. Con slug

La regla `seo`, ítem 7, y la `app-router`, ítems 2 y 3, rigen; en el molde se ven así:

- `generateStaticParams` desde `listSitemap` con al menos un slug, y `[{ slug: "__vacio" }]` si
  la API no trae ninguno (`app/p/[slug]/page.tsx`).
- La página y `generateMetadata` hacen `await params` y la misma lectura cacheada
  (`'use cache'` con `cacheTag` por slug en `lib/marketplace/client.ts`, regla `contract`,
  ítem 7) **fuera de `<Suspense>`**: `notFound()` y `permanentRedirect()` salen de ahí, como en
  `loadProduct`.
- Lo que lee la cookie (`getEffectiveLocation()` de `features/location/server/location.ts`) o
  `searchParams` va en su propio componente dentro de `<Suspense>` con su esqueleto; la página
  le pasa `searchParams` sin esperarla (`ProductOffers` y `ProductOffersSkeleton`,
  `StoreProducts` y `StoreProductsSkeleton`).
- Ni `loading.tsx` en la carpeta ni `<Suspense>` por encima de la página.

Sin slug: `export const metadata` estático (regla `seo`, ítem 4) y sin `generateStaticParams`.

## 3. Metadatos y JSON-LD

- Título: sólo su parte; la plantilla del layout pone la marca (regla `seo`, ítem 1).
- `generateMetadata` sólo si los metadatos salen de los datos (regla `seo`, ítem 4). La canónica
  es relativa y sin parámetros (ítem 2) y se arma con el slug que devuelve la API, no con el de
  `params` (`alternates.canonical` en `productMetadata` y en `app/tienda/[slug]/page.tsx`).
- `noindex` (`robots: { index: false, follow: true }`) sólo cuando la spec lo pide: producto sin
  ofertas en `productMetadata`, landing bajo el umbral de §4.3. Su caso va en `metadata.test.ts`.
- Open Graph: la imagen que traen los datos, sin generación dinámica (spec §4.2).
- JSON-LD según la regla `seo`, ítem 6: cada objeto en su `<script>` por `serializeJsonLd`, desde
  lo cacheado y nunca desde la cookie. `BreadcrumbList` en categoría y ciudad (spec §4.2).

## 4. README del módulo

`features/<dominio>/README.md` desde `docs/conventions/README.template.md`, con el contrato de
`.claude/docs/conventions/module-readme.md` y la regla `.claude/rules/module-readme.md`;
`verified_against` incluye `app/<ruta>/page.tsx`. Después,
`node .claude/scripts/generate-index.mjs posven-ecommerce` y `docs/CAPABILITIES.md` va en
el mismo commit.

## 5. Verificar y cerrar

- La de `posven-ecommerce/CLAUDE.md` (sección Verificación), con `npx next build` siempre porque
  se tocan rutas y metadatos, y `npx playwright test` con el caso nuevo (regla `tests`, ítem 7).
  Con `MARKETPLACE_MODE` sin definir o en `mock` (`usesMock` en `lib/marketplace/client.ts`).
- El e2e levanta `next dev`, que no da los códigos 404 y 308 (regla `seo`, ítem 7): se comprueban
  con `npx next start` y una petición a un slug inexistente y a uno viejo.
- `close-task`. Un commit por cambio lógico (`feat(<dominio>): ...`); el cambio de contrato, si
  hubo, con su spec antes.
