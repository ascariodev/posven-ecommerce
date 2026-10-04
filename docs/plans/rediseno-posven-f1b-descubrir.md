# Plan: rediseño F1b · Descubrir (cabecera, barra inferior, inicio, búsqueda y resultados)

**Objetivo:** las pantallas de F1 del lienzo "E · PosVen" (Inicio, búsqueda con sugerencias,
resultados con filtros y orden, sin resultados) más la cabecera con ubicación y la barra inferior
en móvil, sobre los tokens y primitivas de F0 y el contrato de F1a.
**Estado:** en curso · Fase actual: 3

## Contexto mínimo
- Spec: `docs/specs/2026-10-03-rediseno-posven-design.md` §2 (decisiones), §4 (`ui.md`), §5 (mapa
  pantalla → ruta) y §6 (puerta: e2e en verde y revisión contra el lienzo). Referencia visual en
  `docs/design/2026-10-03-rediseno/` (sin commitear): `web/W01-Inicio`, `W02-Busqueda`,
  `P14-Resultados-Escritorio`, `W05-SinResultados` y `movil/P01` a `P05` (`.dc.html`; se copian en
  espíritu, todo con primitivas shadcn y tokens).
- Repo y rama: `posven-ecommerce` en
  `C:\Users\Windows 11\Documents\Development\posven\posven-ecommerce`, rama `main` (el usuario
  trabaja directo ahí; sin push salvo pedido).
- Estado de partida (exploración 2026-10-04): cabecera en `app/layout.tsx` (logo, `HeaderSearchSlot`
  con `SearchPill compact degradeLocation`, `CartLink`, `AccountSlot`); ubicación en la cookie
  `loc` (`features/location/`); sin barra inferior; inicio con `h1`, `SearchPill`, `CategoryRail`
  y `NearbyStores`; resultados en `features/search/components/SearchResults.tsx` con columna de
  categorías y `RadiusFilter` en escritorio y `FiltersSheet` en móvil; `EmptyState` con ampliar
  radio, país, categorías y `/comercios`.
- Restricciones: reglas `.claude/rules/ui.md` (tokens, sin literales de color, AA en claro y
  oscuro, 44 px, `text-primary-text`), sin dependencias nuevas (`sheet` y scroll nativo); el
  frontend no calcula montos ni horarios; el evento `search` de `SearchResults` se conserva (página
  1 con `q` o categoría); la línea base de eventos de dos semanas corre antes de publicar F1, así
  que este plan no se sube hasta que el usuario lo pida; los e2e rojos conocidos de "Comercio
  Aliado" son de F2.
- Archivos principales: `app/layout.tsx`, `app/page.tsx`, `app/buscar/page.tsx`,
  `features/search/components/*`, `features/location/components/*`, `features/store/components/*`,
  `e2e/search.spec.ts`.
- Verificación: `<repo>/node_modules/.bin/tsc --noEmit -p <repo>/tsconfig.json`, `npx eslint
  <archivos>`, vitest del área y Playwright desde el repo con `MARKETPLACE_MODE=mock` (script Node
  con `process.chdir`, nunca `cd`).

## Fases

### [x] Fase 1 — Cabecera con ubicación visible
- **Repo:** posven-ecommerce
- **Alcance:** cabecera del lienzo (`W01`, `P01`): logo, selector de ubicación como botón visible
  ("Buscar cerca de <lugar> · <radio>") que abre `LocationSheet`, buscador y accesos a favoritos,
  carrito y cuenta; en móvil, logo, ubicación y buscador (los accesos pasan a la barra inferior de
  la fase 2). Se extrae a un componente de cabecera propio; `HeaderSearchSlot` sigue ocultando el
  buscador donde el cuerpo ya lo tiene. Tokens de F0, sin literales.
- **Archivos:** `app/layout.tsx`, `features/site/components/SiteHeader.tsx` (nuevo),
  `features/location/components/LocationBar.tsx`, `features/search/components/SearchPill.tsx`,
  `features/search/components/HeaderSearchSlot.tsx`; README de los módulos tocados.
- **Terminado cuando:** tsc y eslint limpios, vitest de `features/search` y `features/location`
  en verde y `npx playwright test e2e/search.spec.ts e2e/site.spec.ts` sin fallos nuevos.
- **Commit:** `feat(site): cabecera con ubicación visible`

### [x] Fase 2 — Barra inferior en móvil
- **Repo:** posven-ecommerce
- **Alcance:** Inicio, Buscar, Favoritos, Carrito y Cuenta, con ruta activa y contador del
  carrito; sólo bajo `md`; espacio inferior en el layout para que no tape el pie; e2e móvil.

### [ ] Fase 3 — Panel de sugerencias en la búsqueda
- **Repo:** posven-ecommerce
- **Alcance:** panel de `W02`/`P02` sobre `SearchPill` (términos, productos con precio,
  categoría, recientes en el navegador), accesible por teclado; usa `/api/suggestions` de F1a.

### [ ] Fase 4 — Inicio: héroe y categorías
- **Repo:** posven-ecommerce
- **Alcance:** héroe "compara antes de salir" con buscador y chips de categoría del lienzo;
  `app/page.tsx` y `CategoryRail`.

### [ ] Fase 5 — Inicio: Cerca de ti, patrocinado y comercios
- **Repo:** posven-ecommerce
- **Alcance:** riel de productos cercanos (`listNearbyProducts` de F1a), tienda patrocinada
  (`featured` de `/stores`) y comercios cerca con `StoreCard` del lienzo.

### [ ] Fase 6 — Resultados: diseño y orden
- **Repo:** posven-ecommerce
- **Alcance:** cabecera de resultados (migas, título, total), orden por cercanía o precio
  (`sort` en `parseSearchQuery`/`searchHref`), tarjetas y paginación del lienzo.

### [ ] Fase 7 — Resultados: filtros
- **Repo:** posven-ecommerce
- **Alcance:** columna de filtros en escritorio y hoja en móvil con distancia, "abierto ahora"
  (`open_now`), categoría y chips de filtros activos con "Limpiar filtros".

### [ ] Fase 8 — Sin resultados
- **Repo:** posven-ecommerce
- **Alcance:** `EmptyState` de `W05`/`P05`: ampliar radio, todo el país, "Quizás te sirve" con
  productos cercanos y categorías.

### [ ] Fase 9 — Revisión contra el lienzo
- **Repo:** posven-ecommerce
- **Alcance:** puerta de la spec §6: e2e de búsqueda, inicio y sitio en verde (incluido el rojo
  conocido del `h1` de la portada), AA en claro y oscuro y capturas comparadas con el lienzo.

## Decisiones
- 2026-10-04 — Barra inferior con los cinco destinos del lienzo; Favoritos y Cuenta sin sesión
  llevan al ingreso — usuario.
- 2026-10-04 — Sin `vaul` ni `embla-carousel`: `sheet` y scroll horizontal nativo — usuario.
- 2026-10-04 — El contrato va antes en el plan F1a — usuario.
- 2026-10-04 — Los filtros "Acepta pedidos en línea", "Retiro en tienda" y "Entrega a domicilio"
  del lienzo no entran (no están en la §7 de la spec) — usuario, al aprobar el plan.
- 2026-10-04 — Fase 1: la ubicación sale de `SearchPill` a un botón de dos líneas en `SiteHeader`
  con nombre accesible "Buscar cerca de <lugar>" (los e2e que pulsan "Buscar" usan `exact: true`);
  `SearchPill` pierde `degradeLocation` y `LocationBar`/`LocationSheet` pierden `compact`; el radio
  se lee de `radio` en la URL ("· N km", 10 por defecto, "· Todo el país", ciudad sin detalle);
  cabecera pasa de `sm` a `md`; carrito y cuenta siguen visibles en móvil hasta la fase 2.
- 2026-10-04 — Fase 2: `MobileNav` (servidor, en Suspense tras el pie de `app/layout.tsx`) y
  `MobileNavLinks` (cliente); sesión por `accountContext()` (cookie, sin `getMe`) y contador por
  `cartCount()`, ahora exportado; Carrito sólo con `cartEnabled()`; la cabecera oculta carrito,
  cuenta y favoritos bajo `md`; "Salir" pasa al final de las pestañas móviles de `AccountNav`;
  el botón de ubicación es `flex-1 basis-0` bajo `md`; RN-SITE-07. 7 archivos de código, aceptado
  por el revisor por ser un solo cambio.

## Notas para la próxima sesión
- Los cambios de la fase 2 en `e2e/cart.spec.ts` y `e2e/checkout.spec.ts` no se ejecutaron: caen
  antes en el rojo de "Comercio Aliado" (F2). Volver a correrlos cuando se levante. Fase 9: revisar
  que el toaster no quede tapado por la barra inferior.
- `e2e/product.spec.ts` líneas 19, 34 y 73 fallan desde antes de este plan (simulado de producto:
  "Destacado", WhatsApp, "Sin disponibilidad ahora."); no son de F1b.

## Mejoras propuestas
- [ ] M-1 — `LocationSheet` repite el literal `"pais"`, que ya existe como `NATIONWIDE` en
  `features/search/lib/query.ts`; exportarlo desde `lib/marketplace/params.ts` y usarlo en ambos.
  posven-ecommerce · baja · sonnet
- [ ] M-2 — Prueba de `radiusDetail` (coordenadas con y sin `radio`, `radio=pais`, ciudad sin
  detalle) mockeando `useSearchParams`, en `features/location/__tests__/`.
  posven-ecommerce · baja · sonnet
- [ ] M-3 — El comentario de `features/cart/components/CartLink.tsx` (l.12) dice "en la cabecera";
  `cartCount` ahora también lo usa la barra inferior.
  posven-ecommerce · baja · sonnet
- [ ] M-4 — `MobileNavLinks.tsx` usa `text-[10px]` en el contador: confirmar contra `ui.md` o
  subir a `text-xs`.
  posven-ecommerce · baja · sonnet
