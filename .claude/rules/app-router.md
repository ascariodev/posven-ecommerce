---
paths:
  - "app/**"
  - "features/**"
---

# App Router

Rige al editar `app/` y `features/`.

1. **Guía antes que memoria.** Antes de usar una API de Next se lee su guía en
   `node_modules/next/dist/docs/` (`AGENTS.md`): esta versión cambia firmas y convenciones, como
   `retry()` en `error.tsx`, que la guía prefiere sobre `reset()`.
2. **`cacheComponents: true`** (`next.config.ts`): toda lectura de `cookies()`, `headers()` o
   `searchParams` va en un componente envuelto en `<Suspense>` con su fallback; si no, la ruta no
   se prerenderiza y bloquea la carga (aviso `blocking-route`, guía `08-caching.md`).
3. **`'use cache'` recibe los datos de la petición como argumento**: dentro no se llama a
   `cookies()`, `headers()` ni se lee `searchParams` (guía `use-cache`, error
   `next-request-in-use-cache`).
4. **Server Components por defecto.** `'use client'` sólo en lo interactivo y lo más abajo posible
   del árbol; `app/error.tsx` lo lleva porque Next lo exige.
5. **Nada de `lib/marketplace/client.ts` en un Client Component**: abre con `import "server-only"`
   y el build falla. Los datos llegan como props desde un Server Component.
6. **Montos sólo por `lib/format.ts`** (`formatUsd`, `formatVes`, `formatRate`,
   `formatDistance`): ni `Number()` ni `parseFloat` sobre un monto.
7. **Los errores de la API llegan a `app/error.tsx`**: `lib/marketplace/http.ts` lanza
   `MarketplaceUnavailableError` y no se atrapa en la página; la frontera muestra el reintento y
   `noindex`. Un recurso inexistente es `notFound()`, que pinta `app/not-found.tsx`. Excepción:
   lo que lee la API desde `app/layout.tsx` (la cabecera) atrapa `MarketplaceUnavailableError` y
   degrada, porque `app/error.tsx` no cubre el layout raíz (`LocationSummary`).
8. **Marca por `SITE_NAME`** (`lib/site.ts`): ningún texto visible ni metadato escribe la marca
   literal. El título de una página es su parte propia; la plantilla `%s | SITE_NAME` la pone
   `app/layout.tsx`.
