# Plan: pie del sitio y páginas de comercios y legales

modo: ligero

**Objetivo:** el pie en columnas de la dirección C en todas las páginas, y `/comercios`, `/terminos` y
`/privacidad` respondiendo 200 (las legales como borrador con `noindex`).
**Estado:** en curso · Fase actual: 5

## Contexto mínimo

- Spec: `docs/specs/2026-10-01-pie-y-paginas-design.md` (§2 pie, §3 comercios, §4 legales, §5
  verificación); base visual `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md`.
- Repos y ramas: `posven-ecommerce` en `C:\Users\Windows 11\Documents\Development\posven\posven-ecommerce`,
  rama `feat/pie-y-paginas` (desde `main` d7e2ed0; spec en b68dab3).
- Restricciones: L-02 y regla `app-router` 7 (lo que lee la API desde `app/layout.tsx` atrapa
  `MarketplaceUnavailableError` y degrada); `app-router` 8 (marca sólo por `SITE_NAME`); regla
  `tests` 5 (nada con `cacheLife` se ejecuta en vitest: se simula el módulo); `ui.md` (tokens,
  44 px en móvil, foco por outline); sin dependencias nuevas.
- Archivos principales: `app/layout.tsx`, `lib/site.ts`, `lib/sitemap.ts`, `features/site/`
  (módulo nuevo), `app/comercios/`, `app/terminos/`, `app/privacidad/`.
- Rutas nuevas con la skill `new-page`; README del módulo según `docs/conventions/README.template.md`
  y la regla `module-readme`.

## Fases

### [x] Fase 1: pie en columnas

- **Repo:** posven-ecommerce
- **Alcance:** módulo `features/site/` con `SiteFooter` (Server Component async) según spec §2. Lee
  `listCategories()`, atrapa `MarketplaceUnavailableError` y entrega las hasta 8 raíces a
  `FooterCategories`, un componente puro que se omite si la lista llega vacía. El año sale de
  `footerYear()` en `features/site/year.ts` (`'use cache'` y `cacheLife("days")`; leer antes la
  guía `08-caching.md`, "Random values and timestamps"). `app/layout.tsx` reemplaza su `<footer>`
  y `footerLinks` por `<SiteFooter />`. Los enlaces a `/comercios`, `/terminos` y `/privacidad`
  siguen dando 404 hasta las fases 2 a 4. README del módulo con su capacidad, y regenerar
  `docs/CAPABILITIES.md` (`node posven/.claude/scripts/generate-index.mjs <repo>`).
- **Archivos:** `features/site/SiteFooter.tsx`, `features/site/year.ts`, `features/site/README.md`,
  `app/layout.tsx`, `docs/CAPABILITIES.md`; prueba `features/site/SiteFooter.test.tsx` (simula
  `@/lib/marketplace/client` y `./year`: columna omitida si la API falla o no hay raíces, corte
  en 8, enlaces de comercios y legales presentes).
- **Terminado cuando:** pasan `<repo>/node_modules/.bin/tsc --noEmit -p <repo>/tsconfig.json`,
  `npx eslint features/site app/layout.tsx`, `npx vitest run features/site` y `npx next build`
  sin aviso `blocking-route` ni `blocking-prerender-current-time`.
- **Commit:** `feat(site): pie en columnas de la dirección C`

### [x] Fase 2: página `/comercios`

- **Repo:** posven-ecommerce
- **Alcance:** spec §3. Se agregan `POS_NAME` y los lectores de `MERCHANT_WHATSAPP` y
  `MERCHANT_EMAIL` en `lib/site.ts`. Página con la propuesta, tres pasos y `MerchantContact`
  (cada botón sólo con su variable, bloque omitido sin ninguna), `metadata` con canónica, la
  entrada en el grupo `static` de `lib/sitemap.ts` (actualizar `lib/sitemap.test.ts`) y las
  variables comentadas en `.env.example`.
- **Archivos:** `lib/site.ts`, `features/site/MerchantContact.tsx`, `app/comercios/page.tsx`,
  `lib/sitemap.ts`, `.env.example`, `features/site/README.md`.
- **Terminado cuando:** tsc, eslint, `npx vitest run features/site lib/sitemap.test.ts` y
  `npx next build` pasan.

### [x] Fase 3: borrador legal y `/terminos`

- **Repo:** posven-ecommerce
- **Alcance:** spec §4. `features/site/legal.ts` con `LEGAL_DRAFT`, los cinco marcadores y las
  rutas legales registradas; `LegalDocument` (prosa y aviso de borrador); el texto de términos;
  la página con `noindex, follow` mientras sea borrador; `lib/sitemap.ts` suma las legales sólo
  sin borrador. Prueba de la guarda de marcadores.
- **Terminado cuando:** tsc, eslint, `npx vitest run features/site lib/sitemap.test.ts` y
  `npx next build` pasan.

### [x] Fase 4: página `/privacidad`

- **Repo:** posven-ecommerce
- **Alcance:** texto de privacidad según spec §4 (datos, cookies `mp_session`, `mp_cart`, `loc` y
  `sid`, finalidades y derechos), comprobado contra el código que cita. Ruta registrada en
  `legal.ts` y montada sobre `LegalDocument`; README.
- **Terminado cuando:** tsc, eslint, `npx vitest run features/site` y `npx next build` pasan.

### [ ] Fase 5: e2e y reglas de SEO y pruebas

- **Repo:** posven-ecommerce
- **Alcance:** `e2e/site.spec.ts` según spec §5 (enlaces del pie en 200, canónica de
  `/comercios`, `noindex` de las legales, sitemap `static`). Las reglas `seo` 3 y 8 y `tests` 7
  se actualizan con las rutas nuevas y el spec nuevo. Cierre con `npx playwright test`, que corre
  el usuario con el puerto 3000 libre, y revisión visual del pie y de las tres páginas.
- **Terminado cuando:** `npx playwright test` pasa entero, o se declara sin correr.

## Decisiones

- 2026-10-01: legales como borrador con marcadores, aviso, `noindex` y fuera del sitemap hasta la
  aprobación legal; `/comercios` informativa sin backend; contacto por `MERCHANT_WHATSAPP` y
  `MERCHANT_EMAIL`; pie en columnas (usuario).
- 2026-10-01: `POS_NAME` aparte de `SITE_NAME`; las variables de contacto se leen al construir;
  rama `feat/pie-y-paginas` (spec aprobada por el usuario).
- 2026-10-01: el año del pie y la lectura de categorías van en módulos simulables, porque
  `cacheLife` no corre en vitest (regla `tests` 5).
- 2026-10-01 (fase 1): `FooterCategories` se exporta desde `SiteFooter.tsx` (puro, `categories:
  CategoryNode[]`, `null` con lista vacía); `SiteFooter` resuelve categorías y año con
  `Promise.all`; reglas `RN-SITE-01` (corte en 8) y `RN-SITE-02` (columna omitida sin API o sin
  raíces) en el README.
- 2026-10-01 (fase 2): `MerchantContact` es puro (`whatsapp` en dígitos y `email`, `string|null`);
  la página llama a `merchantWhatsapp()` y `merchantEmail()` de `lib/site.ts`. WhatsApp va a
  `https://wa.me/<dígitos>?text=` con mensaje que cita `SITE_NAME`. Se suman
  `MerchantContact.test.tsx` y `RN-SITE-03`, y `app/comercios/**` al `paths` de la regla `seo`.
- 2026-10-01 (fase 2): `.env.example` queda sin commit: los permisos bloquean leerlo y nadie pudo
  revisar las 4 líneas agregadas; lo revisa y commitea el usuario.
- 2026-10-01 (fase 3): el texto legal va como datos (`LegalDocumentContent`, leído por `legalText`
  para la guarda), no como TSX; `legalMetadata(args, draft = LEGAL_DRAFT)` y
  `legalSitemapPaths(draft = LEGAL_DRAFT)` reciben el interruptor para probar ambos estados; el
  grupo `static` es `/comercios` más `legalSitemapPaths()`; reglas `RN-SITE-04/05`.
- 2026-10-01 (fase 4): `privacy.ts` exporta `privacyDocument` (8 secciones) comprobado contra el
  código; `RN-SITE-06` exige las cuatro cookies y ninguna otra `mp_*`; no se afirma plazo de
  conservación (remite a `[CORREO LEGAL]`).

## Notas para la próxima sesión

- Fase 5: el e2e cubre `/comercios`, `/terminos` y `/privacidad`; las reglas `seo` 3 y 8 y `tests`
  7 todavía no las mencionan.
- `docs-check` marca RANCIO README de otros módulos por fecha de commit (no hay `verified_at`), y
  ERROR en RN de más de 240 caracteres en cart, checkout, product, purchases y marketplace: es
  anterior a este plan y queda fuera de alcance.
- Para el área legal: términos §3 (tasa) y §4 (reembolsos); privacidad §2 (IP reenviada), §5
  (terceros) y §6 (conservación). `mp_cart` puede sobrevivir al entrar si la API falla (caso
  transitorio que el texto no menciona).
- `.env.example` sigue sin commit desde la fase 2.
- Si tsc falla por `.next/types` viejos (`app/preview/page.js`), `npx next build` los regenera.
