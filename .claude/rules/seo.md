---
paths:
  - "app/page.tsx"
  - "app/layout.tsx"
  - "app/buscar/**"
  - "app/p/**"
  - "app/tienda/**"
  - "lib/jsonld.ts"
  - "features/*/jsonld.ts"
  - "app/sitemap.ts"
  - "app/robots.ts"
  - "lib/sitemap.ts"
---

# Metadatos y SEO

Rige al editar los metadatos de una ruta. Qué rutas se indexan lo fija la spec §4.1
(`posven/.claude/docs/specs/2026-09-26-ecommerce-hiperlocal-design.md`).

1. **El título lo arma la plantilla del layout.** `app/layout.tsx` fija `title.default` y
   `title.template` (`%s | SITE_NAME`); una página exporta sólo su parte (`title: "Buscar"` en
   `app/buscar/page.tsx`) o nada, como `/`. La marca sale de `SITE_NAME` (`lib/site.ts`), nunca
   escrita a mano.
2. **La canónica es relativa y sin parámetros.** `metadataBase` (`SITE_URL`, en el layout) la
   vuelve absoluta; `/` exporta `alternates: { canonical: "/" }` y Next la emite sin barra final
   (`http://localhost:3000`). Nunca lleva parámetros de ubicación ni de búsqueda (`q`,
   `categoria`, `radio`, `pagina`).
3. **Lo que no se indexa lleva `noindex`.** `/buscar` exporta
   `robots: { index: false, follow: true }`; `app/error.tsx` pinta
   `<meta name="robots" content="noindex" />` porque es Client Component y `metadata` sólo se exporta desde Server Components (guía
   `generate-metadata`).
4. **Metadatos estáticos (`export const metadata`) por defecto.** `generateMetadata` sólo cuando
   la ruta los saca de sus datos (el nombre del producto o de la tienda), y nunca de la cookie de
   ubicación: `productMetadata` en `features/product/metadata.ts`, que usa `app/p/[slug]/page.tsx`.
5. **El e2e comprueba la canónica de `/` y el `noindex` de `/buscar`** (`e2e/search.spec.ts`),
   y la canónica, el JSON-LD y el `noindex` de producto y tienda, `robots.txt` y el sitemap
   (`e2e/product.spec.ts`): quien cambia esos metadatos corre `npx playwright test`.
6. **JSON-LD por `serializeJsonLd`** (`lib/jsonld.ts`, que escapa `<` como `\u003c`, guía
   `json-ld`) en un `<script type="application/ld+json">`, y sin datos de la cookie de ubicación:
   sale de lo cacheado por slug (`productJsonLd` en `features/product/jsonld.ts`). Cada objeto
   trae su `@context` y va en su propio `<script>`.
7. **Una página con slug resuelve el 404 y el 308 fuera de `<Suspense>`**: `await params` y la
   lectura cacheada en la página misma (`loadProduct` en `app/p/[slug]/page.tsx`, `getStore`
   en `app/tienda/[slug]/page.tsx`), con
   `generateStaticParams` de al menos un slug (`[{ slug: "__vacio" }]` si la API no trae
   ninguno, porque un arreglo vacío rompe el build con Cache Components). Sin `loading.tsx` ni
   `<Suspense>` por encima de la página: convertirían el 404 en un 200. Sólo se comprueba con
   `next start`; `next dev` no corre el modo de respaldo bloqueante.
8. **Una ruta indexable nueva entra al sitemap por `lib/sitemap.ts`**: `sitemapIds` parte cada
   `SitemapType` en `{tipo}-{n}` según `meta.total` y `meta.per_page` de `listSitemap`, y
   `sitemapEntries` arma las URLs absolutas con `SITE_URL`; `app/sitemap.ts` sirve
   `/sitemap/{id}.xml`. `app/robots.ts` excluye `/buscar` y `/api/` y lista cada sitemap.
