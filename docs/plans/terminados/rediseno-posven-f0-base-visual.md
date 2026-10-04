# Plan: rediseño posven, F0 base visual

**Objetivo:** el ecommerce queda sobre shadcn `radix-luma`, los tokens claro y oscuro de la spec
§3, Poppins y Public Sans, sin la capa Farmatodo ni colores literales, con `ui.md` reescrita y los
tokens aprobados en `/preview`.
**Estado:** terminado

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

### [x] Fase 2 — Ruta `/preview`
- **Repo:** posven-ecommerce
- **Alcance:** página sin datos de la API con los tokens en claro y oscuro lado a lado (contenedor
  `.dark`), la escala tipográfica y las 12 primitivas en sus variantes y tamaños (§9); `noindex,
  nofollow`, `Disallow: /preview` en robots, fuera del sitemap; `seo.md` (ítems 3 y 8) la nombra.
- **Archivos:** `app/preview/page.tsx`, `app/robots.ts`, `.claude/rules/seo.md` (más la
  afirmación en `e2e/product.spec.ts`)
- **Terminado cuando:** `next build` compila y `/preview` se ve en el navegador; `npx playwright
  test e2e/product.spec.ts -g robots` en verde.
- **Commit:** `feat(preview): ruta desechable con tokens y primitivas del rediseño`

### [x] Fase 3 — [riesgo] luma: primitivas estáticas
- **Repo:** posven-ecommerce
- **Alcance:** `components.json` a `radix-luma`; `shadcn add --overwrite` de `button`, `badge`,
  `card`, `input` y `skeleton`, una a una, reaplicando `ui.md` (44 px, `h-11 md:h-9` en `sm`,
  `type="button"`, outline de foco, `aria-invalid`, botón en `rounded-lg`, enlace con
  `text-primary-text`, campos `text-base` en móvil). `Badge` conserva los nombres de variante
  (`best`, `warning`) con las clases nuevas (`success-soft`, `warning-soft`).
- **Terminado cuando:** `tsc`, `vitest` y revisión en `/preview` contra el lienzo; `git diff
  lib/utils.ts app/globals.css` vacío.
- **Commit:** `feat(ui): primitivas estáticas en estilo radix-luma`

### [x] Fase 4 — [riesgo] luma: `toggle`, `toggle-group` y `radio-group`
- **Repo:** posven-ecommerce
- **Alcance:** reinstalación con las mismas reglas; `Toggle` sin `'use client'` para que
  `toggleVariants` sirva en el servidor (`RadiusFilter`).
- **Terminado cuando:** `tsc`, `vitest` de `features/search` y `features/account`, revisión en `/preview`.
- **Commit:** `feat(ui): toggle y radio en estilo radix-luma`

### [x] Fase 5 — [riesgo] luma: `select`, `sheet`, `dropdown-menu` y `sonner`
- **Repo:** posven-ecommerce
- **Alcance:** reinstalación conservando L-03, L-04 (el `key` vive en `AddressForm`, no se toca) y
  L-05; fondo de `Sheet` en `bg-overlay`.
- **Terminado cuando:** `tsc`, `vitest` y `npx playwright test e2e/account.spec.ts` (menú de
  cuenta y direcciones) sin fallos nuevos.
- **Commit:** `feat(ui): primitivas interactivas en estilo radix-luma`

### [x] Fase 6 — Estados: `best` a `success` y `featured` a `primary-soft`
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

### [x] Fase 7 — Superficies: `surface` a `card`
- **Repo:** posven-ecommerce
- **Archivos:** `app/error.tsx`, `app/not-found.tsx`, `features/search/components/EmptyState.tsx`,
  `features/site/components/LegalDocument.tsx`, `features/site/components/SiteFooter.tsx`
- **Terminado cuando:** `tsc`, `vitest` de `features/site` y `features/search`; sin `bg-surface`.
- **Commit:** `refactor(ui): superficies con el token card`

### [x] Fase 8 — Naranja como texto y avatar
- **Repo:** posven-ecommerce
- **Alcance:** `text-primary` a `text-primary-text`, insignia del carrito a `bg-primary
  text-primary-foreground`, avatar de `tint-N` a `primary-soft`/`primary-text`.
- **Archivos:** `features/account/components/AccountIdentity.tsx`,
  `features/cart/components/CartLink.tsx`, `features/account/components/AccountMenu.tsx`,
  `features/search/components/SearchResults.tsx`
- **Terminado cuando:** `tsc`, `vitest` de `features/account`, `features/cart` y `features/search`.
- **Commit:** `refactor(ui): naranja como texto con primary-text`

### [x] Fase 9 — Portada sin la capa Farmatodo
- **Repo:** posven-ecommerce
- **Alcance:** `app/page.tsx` vuelve a la estructura previa al cambio de Jose (h1 "Encuentra lo que
  buscas en tiendas cerca de ti", subtítulo, `SearchPill`, `CategoryRail`, `NearbyStores`) con los
  tokens nuevos; salen héroe, tarjetas de valor, banner, `FeaturedProducts` (la búsqueda con
  `q: ""` que la spec §7.2 rechaza) y las imágenes `public/hero_shopping.jpg` y
  `public/promo_banner.jpg`. El inicio nuevo es de F1.
- **Terminado cuando:** `next build` y `npx playwright test e2e/search.spec.ts` en verde.
- **Commit:** `refactor(home): portada sin la capa estilo Farmatodo`

### [x] Fase 10 — Ficha sin reseñas inventadas (decisión del usuario)
- **Repo:** posven-ecommerce
- **Alcance:** quitar `CustomerReviews` de `app/p/[slug]/page.tsx` (calificación 4.8, "124
  opiniones" y dos "Comprador verificado" fijos en toda ficha; el contrato no trae reseñas). Si el
  usuario decide conservarla, la fase se borra y la 11 pasa sus estrellas a un token.
- **Terminado cuando:** `tsc` y `npx playwright test e2e/product.spec.ts` sin fallos nuevos.
- **Commit:** `fix(product): quita reseñas fijas de la ficha`

### [x] Fase 11 — Literales de la ficha y la tarjeta
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

### [x] Fase 12 — Retiro de tokens heredados
- **Repo:** posven-ecommerce
- **Alcance:** borrar de `app/globals.css` `--brand-navy*`, `--primary-hover`, `--best*`,
  `--featured`, `--surface`, `--warning-foreground` y `--tint-N` con su `--color-*`, tras
  comprobar con grep que no queda ningún uso.
- **Terminado cuando:** grep de esos nombres vacío en `app features components`, `next build` y `vitest` en verde.
- **Commit:** `chore(ui): retira tokens anteriores al rediseño`

### [x] Fase 13 — `ui.md` y cierre documental
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
- 2026-10-03 — Fase 2: quinto archivo `app/preview/ToastButton.tsx` (cliente, por `toast()`). Los
  portales de Radix (Select, DropdownMenu, Sheet) abren fuera del contenedor `.dark` de
  `/preview` y se ven en claro: no es defecto de las primitivas — implementador, revisión LISTO.
- 2026-10-03 — Fase 3: `shadcn add` escribe `import { cn } from "cn"`; se corrige a `@/lib/utils`
  en cada primitiva (vigilar en fases 4 y 5). Sin tamaños de botón bajo 44 px (`xs`, `icon-xs`,
  `icon-sm`, `icon-lg`); botón `rounded-lg` 600 a 14 px (spec §3); `Badge` gana `ghost` y `link`
  de luma; `Card` con `rounded-2xl` y relleno 24/16 px — implementador, revisión LISTO.
- 2026-10-03 — Fase 4: `shadcn add --overwrite` pisa ediciones previas; se reinstala una a una y
  se ajusta después. Activo en `data-[state=on]:bg-primary` (los `<Link>` lo marcan con
  `data-state`), sin el `aria-pressed:bg-muted` de luma; hover activo `bg-primary/80` mientras
  `--primary-hover` sea el azul heredado (fase 12); radio `size-4` con borde `input-border` y
  área de toque por `after:` — implementador, revisión LISTO.
- 2026-10-03 — Fase 5: `sonner.tsx` queda sin cambios: la versión luma trae `next-themes`
  (dependencia nueva) y una clase `cn-toast` sin definir, y el `Toaster` actual ya usa tokens; se
  retoma en F4 con el selector de tema (M-4). `shadcn add sheet --overwrite` pisó `button.tsx` y se
  restauró. Select con el disparador de `Input`; paneles `rounded-2xl shadow-raised`; Sheet sobre
  `bg-popover` con `bg-overlay`. e2e de cuenta, búsqueda y checkout: 14 en verde y sólo los 2 rojos
  conocidos (h1 de la portada, compra por "Comercio Aliado") — implementador, revisión LISTO.
- 2026-10-03 — Fase 6: 9 archivos (se suman `app/page.tsx:106`, `BADGES` de `app/preview/page.tsx`
  y `features/store/README.md`, necesarios para `tsc` y el grep). `Badge` `best` pasa a `success`;
  "Destacado" es `Badge` por defecto con `bg-primary-soft text-primary-text`; pagar va en
  `bg-success text-background` porque no hay `--success-foreground`; la banda de `StoreCard` ya no
  distingue destacada — implementador, revisión LISTO.
- 2026-10-03 — Fase 8: los `Badge` `tint-1` y `tint-3` de `AccountIdentity.tsx:39-40` se quedan
  (la fase sólo nombra el avatar); la fase 12 tiene que reemplazarlos para dejar vacío el grep de
  `tint-N`. `ProductCard.tsx` conserva `text-primary` hasta la fase 11 — implementador, revisión LISTO.
- 2026-10-03 — Fase 9: la portada vuelve a la de `28757e9` con el h1 en `font-heading font-bold`;
  salen `FeaturedProducts` y su `searchProducts({ q: "" })`, y `public/hero_shopping.jpg` y
  `public/promo_banner.jpg`. `e2e/search.spec.ts` 4/4 — implementador, revisión LISTO.
- 2026-10-03 — Fase 11: imagen de tarjeta y galería sobre `bg-tile` (sustituye el degradado);
  sombras a `shadow-card`/`shadow-raised`; `outline-primary` y `bg-primary/10` se quedan; las URLs
  `placehold.co` con hex no se tocan — implementador, revisión LISTO.
- 2026-10-03 — Fase 12: también `features/search/lib/categoryTint.ts` (con su test y README) usaba
  `tint-1..4`; pasa a `primary-soft`, `success-soft`, `warning-soft` y `muted`: el cuarto tinte,
  antes rosa, queda gris (no hay `destructive-soft`). Badges de `AccountIdentity` a `success-soft` y
  `warning-soft` — implementador, revisión LISTO.
- 2026-10-03 — Fase 13: `ui.md` reescrita (ítems 1-7 sin renumerar, ítem 8 de tipografía, 59
  líneas); la cabecera recoge el `import { cn } from "cn"` de `shadcn add`. La spec
  `2026-09-29-ecommerce-shadcn-mercado-design.md` queda reemplazada en lo visual. Suite e2e
  completa: 26 en verde, 1 omitido y sólo los 5 rojos conocidos de F2 — implementador, revisión
  LISTO, doc-verifier cumple.

## Notas para la próxima sesión
- Plan cerrado. Revisión visual de quien coordina en `/preview` y la portada: tokens claro y oscuro
  y primitivas correctos; la aprobación final de la puerta de F0 queda al usuario. Lecciones sin
  poda: L-03 a L-06 sólo viven en el código que las aplica, y L-03 sostuvo esta reinstalación.

## Mejoras propuestas
- [x] M-1 — Errata del `aria-label` "Opciónes de ejemplo" en `app/preview/page.tsx:180` (posven-ecommerce · baja · haiku)
- [x] M-2 — Quitar el `pb-4` sobrante del `CardFooter` en `app/preview/page.tsx:139` (posven-ecommerce · baja · haiku)
- [ ] M-3 — Revisar en móvil la ficha (`app/p/[slug]/page.tsx:297,336`) y `OfferCard` con el relleno de 24 px de `Card` (posven-ecommerce · baja · sonnet)
- [ ] M-4 — `Toaster` luma con `next-themes` y la clase `cn-toast` definida, junto al selector de tema de F4 (posven-ecommerce · media · sonnet)
- [ ] M-5 — Fijar un estilo de `;` y comas finales en `components/ui/` (Prettier o regla de ESLint): el CLI de shadcn los quita (posven-ecommerce · baja · haiku)
- [ ] M-6 — Revisar la dependencia `cn` ^0.4.0 de `package.json`, que hace que `shadcn add` escriba `import { cn } from "cn"` (posven-ecommerce · baja · sonnet)
- [ ] M-7 — Quitar el `className="bg-warning/10 text-warning"` redundante del badge "Pocas unidades" en `OfferCard.tsx:37`, junto al contenido de F2 (posven-ecommerce · baja · haiku)
- [ ] M-8 — Quitar los imports y parámetros sin usar de `app/p/[slug]/page.tsx` (`Skeleton`, `PriceSummary`, `searchParams`), avisos de eslint previos al plan (posven-ecommerce · baja · haiku)
- [ ] M-9 — `text-muted-foreground` (#707075) sobre `bg-muted` en claro da ~4,46:1 a 11 px en `ProductCard.tsx`: oscurecer `--muted-foreground` o cambiar ese `<p>` (posven-ecommerce · media · sonnet)
- [ ] M-10 — Tokenizar las sombras sueltas (`shadow-sm/md/lg`) de `ProductCard.tsx:16`, `app/p/[slug]/page.tsx:132,242,281`, `MarketPricesModal.tsx:25` y `ProductGallery.tsx:46` (posven-ecommerce · baja · haiku)
