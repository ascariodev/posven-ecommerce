# Plan: endurecimiento del ecommerce

**Objetivo:** que un `.env` incompleto no llegue a producción, que `/api/events` y
`/api/suggestions` tengan límite por IP, que las respuestas lleven cabeceras de seguridad y que los
recomendados del producto no repitan el producto ni entre sí.
**Estado:** terminado

## Contexto mínimo
- Spec: sin spec; origen en `posven/.claude/docs/evaluaciones/2026-10-28-evaluacion-sistema.md` (P3 y paso 5).
- Repos y ramas: `posven-ecommerce` en
  `C:\Users\Windows 11\Documents\Development\posven\posven-ecommerce\.claude\worktrees\ecommerce-endurecimiento`,
  rama `fix/ecommerce-endurecimiento`, desde `main` local f808cc0.
- Restricciones: el push a `main` despliega solo (`.gitea/workflows/deploy.yaml` copia el `.env`
  del servidor, compila y reemplaza `current`; PM2 corre `server.js` standalone, un solo proceso).
  Los e2e corren `npm run dev` con `MARKETPLACE_MODE=mock` y `SITE_URL` (`playwright.config.ts:19`).
  Sin cambios de contrato con posveapi.
- Archivos principales: `lib/site.ts`, `lib/marketplace/client.ts` (`usesMock`), `next.config.ts`,
  `app/api/events/route.ts`, `app/api/suggestions/route.ts`, `app/p/[slug]/page.tsx` (`RelatedProducts`).

## Fases

### [x] Fase 1 [riesgo] — Fallar en producción sin MARKETPLACE_MODE o SITE_URL
- **Repo:** posven-ecommerce
- **Alcance:** hoy `usesMock()` (`lib/marketplace/client.ts:79-84`) toma el simulado si
  `MARKETPLACE_MODE` falta, y `SITE_URL` (`lib/site.ts:2`) cae a `http://localhost:3000`. Una
  función pura `assertProductionEnv(env)` en `lib/env.ts` lanza con mensaje claro cuando
  `NODE_ENV === "production"` y falta `MARKETPLACE_MODE` (o no es `mock`/`api`), o cuando el modo es
  `api` y falta `SITE_URL`. Se llama desde `next.config.ts` (falla `next build`, antes de que el
  workflow toque `current`) y desde `register()` de un `instrumentation.ts` nuevo (falla el arranque
  de `server.js` standalone, que no reevalúa `next.config.ts`); leer antes la guía de
  `instrumentation` en `node_modules/next/dist/docs/`. En desarrollo y en vitest no cambia nada.
  `.env.example` documenta que ambas son obligatorias en producción.
- **Archivos:** `lib/env.ts` (nuevo), `next.config.ts`, `instrumentation.ts` (nuevo), `.env.example`;
  prueba `lib/__tests__/env.test.ts`.
- **Terminado cuando:** `npx vitest run lib/__tests__/env.test.ts` cubre producción sin modo, con
  modo inválido, `api` sin `SITE_URL`, `mock` sin `SITE_URL` (pasa) y desarrollo sin nada (pasa);
  `npx next build` pasa con el `.env` local y falla con `MARKETPLACE_MODE` vacío en el entorno;
  tsc y eslint limpios.
- **Commit:** `fix(config): falla en producción sin MARKETPLACE_MODE o SITE_URL`

### [x] Fase 2 — Límite por IP en /api/events y /api/suggestions
- **Repo:** posven-ecommerce
- **Alcance:** limitador en memoria por ventana fija y por IP (`clientIpFrom` de
  `features/account/server/session.ts`), con mapa acotado como `createDeduper`
  (`features/events/lib/handle.ts`); las dos rutas responden 429 con `Retry-After` al pasarse. Sin
  IP no se limita. Comprobar que el buscador del cliente trata el 429 como el 503 (sin sugerencias).
- **Terminado cuando:** prueba del limitador y de cada ruta con `npx vitest run`; tsc y eslint limpios.
- **Commit:** `fix(api): limita por IP los eventos y las sugerencias`

### [x] Fase 3 — Cabeceras de seguridad
- **Repo:** posven-ecommerce
- **Alcance:** `headers()` en `next.config.ts` para todas las rutas: `X-Content-Type-Options:
  nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` y
  `Permissions-Policy` con `geolocation=(self)` y cámara y micrófono apagados. Sin CSP ni HSTS.
- **Terminado cuando:** prueba de `headers()` con vitest y `npx next build`; el e2e sigue en verde.
- **Commit:** `fix(config): cabeceras de seguridad en todas las respuestas`

### [x] Fase 4 — Recomendados sin el producto actual ni repetidos
- **Repo:** posven-ecommerce
- **Alcance:** `RelatedProducts` sale de `app/p/[slug]/page.tsx` a `features/product/` con una
  función pura que quita el producto actual de "Cómpralos juntos" (misma categoría) y, de "También
  vistos por otros clientes" (sin categoría), el actual y los ya mostrados arriba. README del módulo.
- **Terminado cuando:** prueba de la función con vitest; `npx next build`; tsc y eslint limpios.
- **Commit:** `fix(product): recomendados sin el producto actual ni repetidos`

## Decisiones
- 2026-10-30 — La guarda de host de `next/image` queda fuera: la validación que lanza sólo corre
  fuera de producción (`next/dist/shared/lib/image-loader.js`, bajo `NODE_ENV !== 'production'`) y
  todas las URLs de imagen salen de la media de Spatie en posveapi (`getFirstMedia()->getUrl()`),
  servida por `media.posven.io`.
- 2026-10-30 — Límite de la fase 2 en el ecommerce y no sólo en posveapi: `getSuggestions` va
  cacheada y no manda `X-Client-IP`, así que el límite `marketplace-suggestions` de posveapi cuenta
  la IP del servidor del ecommerce y un solo cliente con consultas al azar lo agota para todos.
- 2026-10-30 — Fase 1 marcada `[riesgo]`: un error en `register()` tumba el sitio tras el deploy.
- 2026-10-30 — Fase 1: `mock` declarado explícito vale en producción aunque falte `SITE_URL`.
  `register()` comprueba sólo en el runtime `nodejs`; si lanza, `server.js` sale con código 1 y
  PM2 reintenta en bucle (el build falla antes con el mismo `.env`, así que sólo pasa si se edita
  el `.env` del servidor tras el deploy). `next.config.ts` importa `./lib/env` relativo: `next
  build` se corre desde la raíz, como el workflow. `.env.example` no se tocó: la sesión no tiene
  permiso sobre `.env*`; lo documenta el usuario si quiere.
- 2026-10-30 — Fase 2: `createRateLimiter(limit, windowMs)` en `lib/rate-limit.ts`, ventana fija
  por IP con mapa acotado a 10 000 claves; `SUGGESTIONS_PER_MINUTE = 90` (el buscador pide cada
  200 ms al teclear) y `EVENTS_PER_MINUTE = 180`. 429 sin cuerpo con `Retry-After`; el chequeo va
  antes de leer cuerpo y cookie. `useSuggestions` ya trata cualquier no OK como sin sugerencias.
  Contadores por proceso: con más de una instancia de PM2 cada una cuenta aparte.
- 2026-10-30 — Fase 3: `securityHeaders` exportado desde `next.config.ts` y aplicado con
  `source: "/:path*"`. El sitio sólo usa `navigator.geolocation` (`LocationPicker`, `AddressForm`)
  y no tiene iframes propios, por eso `X-Frame-Options: DENY` y cámara y micrófono apagados. Si
  nginx o Cloudflare ya ponen alguna, sale duplicada con el mismo valor.
- 2026-10-30 — Fase 4: `relatedSections(currentSlug, together, alsoViewed)` en
  `features/product/lib/related.ts` (RN-PRODUCT-06) y `RelatedProducts` en
  `features/product/components/`. Se mantienen los dos `Suspense`: cada sección pide las dos listas
  con argumentos idénticos y comparte la caché de `searchProducts`, así deduplica igual sin
  peticiones de más. Sin categoría, la segunda sección muestra del 6.º al 10.º.

## Notas para la próxima sesión
- Plan terminado. Vitest completo en la rama: 120 archivos, 1008 tests en verde. El e2e no corre
  en el worktree (Turbopack rechaza la junction de `node_modules`); en `main` da 70 en verde y 1
  saltado. Falta correr `npx playwright test` y `npx next build` (Turbopack) en el checkout
  principal tras el merge, antes del push. El build del worktree sólo compila con `--webpack` (Turbopack rechaza la junction
  de `node_modules`); el build con Turbopack y el `.env` local se corre en el checkout principal
  tras el merge.
- `main` local va 2 commits por delante de `origin/main` (instalador del equipo sin push): al
  publicar este plan, esos commits salen también a producción.

## Mejoras propuestas
