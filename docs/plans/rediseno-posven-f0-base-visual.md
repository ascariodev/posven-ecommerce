# Plan: rediseño posven, F0 base visual

**Objetivo:** el ecommerce queda sobre shadcn `radix-luma`, los tokens claro y oscuro de la spec
§3, Poppins y Public Sans, sin la capa Farmatodo ni colores literales, con `ui.md` reescrita y los
tokens aprobados en `/preview`.
**Estado:** en curso · Fase actual: 2

## Contexto mínimo
- Spec: `posven-ecommerce/docs/specs/2026-10-03-rediseno-posven-design.md` (§3 tokens, §4 `ui.md`,
  §6 reinstalación de primitivas, §9 `/preview`). Referencia visual en
  `docs/design/2026-10-03-rediseno/`: se copia en espíritu, no el markup.
- Repos y ramas: `posven-ecommerce` en `C:\Users\Windows 11\Documents\Development\posven\posven-ecommerce`,
  rama `main` (el usuario trabaja directo sobre `main`; sin push salvo pedido).
- Restricciones: el frontend no calcula montos; colores sólo por tokens (`ui.md` ítem 4); L-03
  (pila `motion-reduce` en `sheet`, `select`, `dropdown-menu`); `shadcn add` no debe pisar
  `lib/utils.ts` ni `app/globals.css`; `OfferCard` sólo cambia tokens (su contenido es de F2);
  sin modo oscuro expuesto al usuario (el selector es de F4).
- e2e conocidos en rojo antes de empezar (rediseño de Jose): carrito y checkout por "Comercio
  Aliado" en `OfferCard`, `ContactButtons`, "Sin disponibilidad ahora." y el conteo de destacadas
  en la ficha, y el h1 de la portada. F0 arregla los de la portada (fase 9); el resto es de F2 y no
  cuenta como regresión.
- Archivos principales: `app/globals.css`, `app/layout.tsx`, `components.json`, `components/ui/*`,
  `app/page.tsx`, `app/p/[slug]/page.tsx`, `.claude/rules/ui.md`.
- Verificación (con rutas absolutas, sin `cd`): `<repo>/node_modules/.bin/tsc --noEmit -p
  <repo>/tsconfig.json`, `npx eslint <archivos>`, `npx vitest run <área>`, `npx next build` si se
  tocan rutas o el layout. Revisión visual en `/preview` desde la fase 2. Al cerrar el plan,
  `npx playwright test` en un subagente.

## Fases

### [x] Fase 1 — Tema de la spec §3
- **Repo:** posven-ecommerce
- **Alcance:**
  - `app/globals.css`: valores nuevos de los tokens de §3 en `:root` y un bloque `.dark` con
    todos ellos; tokens nuevos `--primary-text`, `--ink`/`--ink-foreground`,
    `--buy-deep`/`--buy-deep-foreground`, `--success`/`--success-soft`, `--warning-soft`,
    `--destructive-text`, `--tile`/`--tile-foreground`, con su `--color-*` en `@theme inline`;
    `--secondary` y `--accent` a su uso de shadcn (`= --muted`); `--ring` a `--foreground`;
    `--glass`, `--glass-border`, `--overlay` y las sombras con su valor oscuro; escala de radios
    explícita (`lg` 12, `xl` 14, `2xl` 20, `3xl` 24, `4xl` 28 px) y `--radius` 12 px. Los tokens
    heredados (`--brand-navy*`, `--primary-hover`, `--best*`, `--featured`, `--surface`,
    `--warning-foreground`, `--tint-N`) quedan intactos hasta la fase 12.
  - `app/layout.tsx`: Poppins (pesos 500, 600, 700) como `--font-heading` y Public Sans como
    `--font-sans`, en lugar de Outfit e Inter; `themeColor` a `#ffffff`; la marca del encabezado
    pasa de `text-primary` a `text-primary-text`.
  - Transitorio aceptado: hasta su fase, la portada vieja se ve con fondo gris (`bg-secondary`) y
    la insignia del carrito en gris (`bg-accent`).
- **Archivos:** `app/globals.css`, `app/layout.tsx`
- **Terminado cuando:** `tsc` y `eslint app/layout.tsx` sin errores, `npx vitest run` en verde y
  `npx next build` compila con las fuentes nuevas; `grep -n "Outfit\|Inter\|#4f46e5" app/layout.tsx`
  no devuelve nada.
- **Commit:** `feat(ui): tokens claro y oscuro, radios y tipografía del rediseño posven`

### [ ] Fase 2 — Ruta `/preview`
- **Repo:** posven-ecommerce
- **Alcance:** página sin datos de la API con los tokens en claro y oscuro lado a lado (contenedor
  `.dark`), la escala tipográfica y las 12 primitivas en sus variantes y tamaños (§9); `noindex,
  nofollow`, `Disallow: /preview` en robots, fuera del sitemap; `seo.md` (ítems 3 y 8) la nombra.
- **Archivos:** `app/preview/page.tsx`, `app/robots.ts`, `.claude/rules/seo.md` (más la
  afirmación en `e2e/product.spec.ts`)
- **Terminado cuando:** `next build` compila y `/preview` se ve en el navegador; `npx playwright
  test e2e/product.spec.ts -g robots` en verde.
- **Commit:** `feat(preview): ruta desechable con tokens y primitivas del rediseño`

### [ ] Fase 3 — [riesgo] luma: primitivas estáticas
- **Repo:** posven-ecommerce
- **Alcance:** `components.json` a `radix-luma`; `shadcn add --overwrite` de `button`, `badge`,
  `card`, `input` y `skeleton`, una a una, reaplicando `ui.md` (44 px, `h-11 md:h-9` en `sm`,
  `type="button"`, outline de foco, `aria-invalid`, botón en `rounded-lg`, enlace con
  `text-primary-text`, campos `text-base` en móvil). `Badge` conserva los nombres de variante
  (`best`, `warning`) con las clases nuevas (`success-soft`, `warning-soft`).
- **Terminado cuando:** `tsc`, `vitest` y revisión en `/preview` contra el lienzo; `git diff
  lib/utils.ts app/globals.css` vacío.
- **Commit:** `feat(ui): primitivas estáticas en estilo radix-luma`

### [ ] Fase 4 — [riesgo] luma: `toggle`, `toggle-group` y `radio-group`
- **Repo:** posven-ecommerce
- **Alcance:** reinstalación con las mismas reglas; `Toggle` sin `'use client'` para que
  `toggleVariants` sirva en el servidor (`RadiusFilter`).
- **Terminado cuando:** `tsc`, `vitest` de `features/search` y `features/account`, revisión en `/preview`.
- **Commit:** `feat(ui): toggle y radio en estilo radix-luma`

### [ ] Fase 5 — [riesgo] luma: `select`, `sheet`, `dropdown-menu` y `sonner`
- **Repo:** posven-ecommerce
- **Alcance:** reinstalación conservando L-03, L-04 (el `key` vive en `AddressForm`, no se toca) y
  L-05; fondo de `Sheet` en `bg-overlay`.
- **Terminado cuando:** `tsc`, `vitest` y `npx playwright test e2e/account.spec.ts` (menú de
  cuenta y direcciones) sin fallos nuevos.
- **Commit:** `feat(ui): primitivas interactivas en estilo radix-luma`

### [ ] Fase 6 — Estados: `best` a `success` y `featured` a `primary-soft`
- **Repo:** posven-ecommerce
- **Alcance:** variante `best` de `Badge` renombrada a `success` y sus usos; "Destacado" a
  `bg-primary-soft text-primary-text`; en `OfferCard` y en la ficha sólo la línea del badge y el
  naranja como texto.
- **Archivos:** `components/ui/badge.tsx`, `features/product/components/OfferCard.tsx`,
  `features/checkout/components/CheckoutForm.tsx`, `features/search/components/FeaturedCard.tsx`,
  `features/store/components/StoreCard.tsx`, `app/p/[slug]/page.tsx` (en el límite: 6)
- **Terminado cuando:** `tsc`, `vitest` de `features/product`, `features/store` y
  `features/checkout`; `grep -rnE "(bg|text|border|ring)-(best|featured)|variant=\"best\"" app features components`
  vacío.
- **Commit:** `refactor(ui): estados con tokens success y primary-soft`

### [ ] Fase 7 — Superficies: `surface` a `card`
- **Repo:** posven-ecommerce
- **Archivos:** `app/error.tsx`, `app/not-found.tsx`, `features/search/components/EmptyState.tsx`,
  `features/site/components/LegalDocument.tsx`, `features/site/components/SiteFooter.tsx`
- **Terminado cuando:** `tsc`, `vitest` de `features/site` y `features/search`; sin `bg-surface`.
- **Commit:** `refactor(ui): superficies con el token card`

### [ ] Fase 8 — Naranja como texto y avatar
- **Repo:** posven-ecommerce
- **Alcance:** `text-primary` a `text-primary-text`, insignia del carrito a `bg-primary
  text-primary-foreground`, avatar de `tint-N` a `primary-soft`/`primary-text`.
- **Archivos:** `features/account/components/AccountIdentity.tsx`,
  `features/cart/components/CartLink.tsx`, `features/account/components/AccountMenu.tsx`,
  `features/search/components/SearchResults.tsx`
- **Terminado cuando:** `tsc`, `vitest` de `features/account`, `features/cart` y `features/search`.
- **Commit:** `refactor(ui): naranja como texto con primary-text`

### [ ] Fase 9 — Portada sin la capa Farmatodo
- **Repo:** posven-ecommerce
- **Alcance:** `app/page.tsx` vuelve a la estructura previa al cambio de Jose (h1 "Encuentra lo que
  buscas en tiendas cerca de ti", subtítulo, `SearchPill`, `CategoryRail`, `NearbyStores`) con los
  tokens nuevos; salen héroe, tarjetas de valor, banner, `FeaturedProducts` (la búsqueda con
  `q: ""` que la spec §7.2 rechaza) y las imágenes `public/hero_shopping.jpg` y
  `public/promo_banner.jpg`. El inicio nuevo es de F1.
- **Terminado cuando:** `next build` y `npx playwright test e2e/search.spec.ts` en verde.
- **Commit:** `refactor(home): portada sin la capa estilo Farmatodo`

### [ ] Fase 10 — Ficha sin reseñas inventadas (decisión del usuario)
- **Repo:** posven-ecommerce
- **Alcance:** quitar `CustomerReviews` de `app/p/[slug]/page.tsx` (calificación 4.8, "124
  opiniones" y dos "Comprador verificado" fijos en toda ficha; el contrato no trae reseñas). Si el
  usuario decide conservarla, la fase se borra y la 11 pasa sus estrellas a un token.
- **Terminado cuando:** `tsc` y `npx playwright test e2e/product.spec.ts` sin fallos nuevos.
- **Commit:** `fix(product): quita reseñas fijas de la ficha`

### [ ] Fase 11 — Literales de la ficha y la tarjeta
- **Repo:** posven-ecommerce
- **Alcance:** `bg-white`, `slate-*`, `black/50` y `text-primary` a tokens (`bg-card`,
  `border-border`, `text-muted-foreground`, `bg-overlay`, `text-primary-text`, imagen sobre
  `bg-tile`). Sin rediseñar: la ficha nueva es de F2.
- **Archivos:** `features/search/components/ProductCard.tsx`,
  `features/product/components/ProductGallery.tsx`,
  `features/product/components/MarketPricesModal.tsx`, `app/p/[slug]/page.tsx`
- **Terminado cuando:** `tsc`, `vitest` de `features/search` y `features/product`; el grep de
  literales de la spec §2 no devuelve nada en `app features components`.
- **Commit:** `refactor(ui): ficha y tarjeta de producto sin colores literales`

### [ ] Fase 12 — Retiro de tokens heredados
- **Repo:** posven-ecommerce
- **Alcance:** borrar de `app/globals.css` `--brand-navy*`, `--primary-hover`, `--best*`,
  `--featured`, `--surface`, `--warning-foreground` y `--tint-N` con su `--color-*`, tras
  comprobar con grep que no queda ningún uso.
- **Terminado cuando:** grep de esos nombres vacío en `app features components`, `next build` y `vitest` en verde.
- **Commit:** `chore(ui): retira tokens anteriores al rediseño`

### [ ] Fase 13 — `ui.md` y cierre documental
- **Repo:** posven-ecommerce
- **Alcance:** reescribir `.claude/rules/ui.md` según la spec §4 sin renumerar; en
  `2026-09-29-ecommerce-shadcn-mercado-design.md`, una línea que la declara reemplazada en lo
  visual por la spec nueva.
- **Terminado cuando:** `node "C:/Users/Windows 11/Documents/Development/posven/.claude/scripts/docs-check.mjs"`
  sin avisos nuevos y cada token citado en `ui.md` existe en `globals.css`; puerta de F0: quien
  coordina aprueba tokens y primitivas en `/preview`.
- **Commit:** `docs(rules): ui.md para radix-luma, tokens posven y modo oscuro`

## Decisiones
- 2026-10-03 — Poppins + Public Sans; selector de modo oscuro en F4; eventos en un plan aparte
  antes de F1; la capa de Jose se limpia en F0 y `OfferCard` se resuelve en F2 — respuestas del
  usuario al escribir la spec.
- 2026-10-03 — Plan aprobado con la fase 10: las reseñas fijas de la ficha se quitan en F0 — aprobación del usuario.
- 2026-10-03 — Los tokens heredados conviven hasta la fase 12 para que cada fase deje el repo
  funcionando — al planificar.
- 2026-10-03 — Fase 1: radios `sm` 8 px y `md` 10 px (la spec no los define); `.dark` incluye
  `--surface`, `--glass*` y sombras; `--warning` ya es `#7a4a00`, así que `bg-warning` cambia
  hasta las fases 6 y 8 — implementador, revisión LISTO.

## Notas para la próxima sesión
- Fase 1 hecha; sigue la fase 2 (`/preview`). Transitorio vigente: fondo gris de la portada y
  la insignia del carrito en gris.

## Mejoras propuestas
