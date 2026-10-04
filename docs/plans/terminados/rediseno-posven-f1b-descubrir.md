# Plan: rediseño F1b · Descubrir (cabecera, barra inferior, inicio, búsqueda y resultados)

**Objetivo:** las pantallas de F1 del lienzo "E · PosVen" (Inicio, búsqueda con sugerencias,
resultados con filtros y orden, sin resultados) más la cabecera con ubicación y la barra inferior
en móvil, sobre los tokens y primitivas de F0 y el contrato de F1a.
**Estado:** terminado

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

### [x] Fase 3 — Panel de sugerencias en la búsqueda
- **Repo:** posven-ecommerce
- **Alcance:** panel de `W02`/`P02` sobre `SearchPill` (términos, productos con precio,
  categoría, recientes en el navegador), accesible por teclado; usa `/api/suggestions` de F1a.

### [x] Fase 4 — Inicio: héroe y categorías
- **Repo:** posven-ecommerce
- **Alcance:** héroe "compara antes de salir" con buscador y chips de categoría del lienzo;
  `app/page.tsx` y `CategoryRail`.

### [x] Fase 5 — Inicio: Cerca de ti, patrocinado y comercios
- **Repo:** posven-ecommerce
- **Alcance:** riel de productos cercanos (`listNearbyProducts` de F1a), tienda patrocinada
  (`featured` de `/stores`) y comercios cerca con `StoreCard` del lienzo.

### [x] Fase 6 — Resultados: diseño y orden
- **Repo:** posven-ecommerce
- **Alcance:** cabecera de resultados (migas, título, total), orden por cercanía o precio
  (`sort` en `parseSearchQuery`/`searchHref`), tarjetas y paginación del lienzo.

### [x] Fase 7 — Resultados: filtros
- **Repo:** posven-ecommerce
- **Alcance:** columna de filtros en escritorio y hoja en móvil con distancia, "abierto ahora"
  (`open_now`), categoría y chips de filtros activos con "Limpiar filtros".

### [x] Fase 8 — Sin resultados
- **Repo:** posven-ecommerce
- **Alcance:** `EmptyState` de `W05`/`P05`: ampliar radio, todo el país, "Quizás te sirve" con
  productos cercanos y categorías.

### [x] Fase 9 — Revisión contra el lienzo
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
- 2026-10-04 — Fase 3: `SearchBox` (combobox ARIA) y `SuggestionsPanel` (listbox) en
  `features/search/components/`, con `useSuggestions` (200 ms, `AbortController`), `panelItems` y
  `recents` (`localStorage` clave `recent-searches`, máx. 5, en `try`); `SearchPill` pasa a cliente
  con `onSubmit` que guarda recientes; el radio de las sugerencias se lee de
  `window.location.search` al interactuar; RN-SEARCH-05 (menos de 2 caracteres no llama a la API).
  El input es `role="combobox"`: los e2e usan `getByRole("combobox", { name: "Buscar productos" })`.
- 2026-10-04 — Fase 4: héroe en `app/page.tsx` sobre `bg-primary` con el `h1` "Encuentra lo que
  necesitas al mejor precio cerca de ti" (también en móvil; no se copia "¿Qué necesitas hoy?" de
  P01); `CategoryRail` pasa a chips de 44 px con `buttonVariants` y chip "Todo" hacia `/buscar`.
  Fuera del héroe: las tarjetas "Paga aquí y retira hoy", "Entrega de comercios de tu zona" y el
  botón "Cómo funciona", porque prometen funciones o rutas que no existen.
- 2026-10-04 — Fase 5: `NearbyProducts` (riel `<ul>` hasta 8, "Ver todo" a `/buscar`, nada si
  vacío) y `SponsoredStore` (`featured[0]` como PATROCINADO); `NearbyStores` lista el resto de
  destacados y `data` sin repetir, tope 6, "Ver todos" a `/comercios`; `StoreCard` pasa a la fila
  del lienzo con "Abierto · hasta HH:MM"/"Cerrado" tal como vienen `is_open` y `closes_at` (sin
  "Cierra pronto", que exigiría calcular); ambos bloques atrapan sólo `MarketplaceUnavailableError`
  y no se pintan (excepción anotada en `.claude/rules/app-router.md` regla 7); RN-STORE-05.
- 2026-10-04 — Fase 6: `SearchQuery.sort?: OfferSort` con `orden=precio|cercania` en la URL
  (desconocido se ignora; `cercania` sin ubicación no se envía a la API); `SortLinks` ofrece "Más
  cercano" (defecto) y "Menor precio" con ubicación, "Relevancia" y "Menor precio" sin ella;
  `ResultsHeader` con migas, título `h2` (el `h1` sr-only de `app/buscar/page.tsx` se queda) y
  total con ubicación; `Pagination` con números y elipsis, sin "Página X de Y"; `ProductCard` y
  `FeaturedCard` sin cambios; RN-SEARCH-06. Los enlaces de filtros conservan `orden` porque
  extienden `query`.
- 2026-10-04 — Fase 7: `SearchQuery.openNow?: boolean` con `abierto=1` (sólo si verdadero), que
  viaja como `openNow` a `searchProducts`; columna de filtros desde `md` y `FiltersSheet` siempre
  visible en móvil (Disponibilidad y Distancia sólo con ubicación); `OpenNowFilter` y
  `ActiveFilters` (chips: categoría sólo con texto, radio distinto de 10 con ubicación, "Abierto
  ahora"); "Limpiar filtros" conserva `q` y `orden`; `findCategory` exportado desde
  `ResultsHeader`; RN-SEARCH-07.
- 2026-10-04 — Fase 8: `EmptyState` sigue síncrono y recibe `nearby?: ReactNode`; ofrece quitar
  "Abierto ahora"; `NearbyProducts` gana `title?` y `showAll` y `SearchResults` lo monta como
  "Quizás te sirve" (radio por defecto, no el de la consulta: son productos generales cercanos);
  no se copia el texto largo de W05 (el título actual lo usa el e2e).
- 2026-10-04 — Fase 9: e2e search y site 17/17 sin aviso de hidratación (el rojo del `h1` ya no
  existía); axe `color-contrast` sin violaciones en escritorio y Pixel 7, claro y oscuro. Ajustes:
  `MobileNavLinks` marca la ruta activa sólo tras hidratar (`useSyncExternalStore`), porque el HTML
  prerenderizado del layout puede ser de otra ruta; `Toaster` sube sobre la barra inferior;
  chip "Todo" en oscuro; `FeaturedCard` a `text-foreground` (4,49:1); el recorte del héroe pasa al
  círculo para no cortar el panel de sugerencias; `ProductCard` sin la "a" duplicada; consejo en
  `EmptyState` con `q`. Quedan como diferencias con el lienzo: la frase explicativa de W05/P05,
  "Explora por categoría" con íconos y "Quizás te sirve" en riel y no en rejilla.

## Notas para la próxima sesión
- Mejoras aplicadas el 2026-10-04 en `main` sin push: todas las bajas (M-1..M-5, M-7..M-20;
  M-21 cubierta por la M-4 de F0). M-6 y M-22 aplicadas después, a pedido. Pendientes: M-23 (alta, plan
  nuevo que cruza posveapi).
- Fase 9: comparar copia y orden de bloques de `EmptyState` contra W05/P05.
- Los cambios de la fase 2 en `e2e/cart.spec.ts` y `e2e/checkout.spec.ts` no se ejecutaron: caen
  antes en el rojo de "Comercio Aliado" (F2). Volver a correrlos cuando se levante. Fase 9: revisar
  que el toaster no quede tapado por la barra inferior, y el aviso de hidratación en `MobileNav`
  visto en la salida del servidor durante la fase 5 (causa probable: `usePathname()` en
  `MobileNavLinks` distinto entre servidor y cliente; sin reproducir).
- `e2e/product.spec.ts` líneas 19, 34 y 73 fallan desde antes de este plan (simulado de producto:
  "Destacado", WhatsApp, "Sin disponibilidad ahora."); no son de F1b.

## Mejoras propuestas
- [x] M-1 — `LocationSheet` repite el literal `"pais"`, que ya existe como `NATIONWIDE` en
  `features/search/lib/query.ts`; exportarlo desde `lib/marketplace/params.ts` y usarlo en ambos.
  posven-ecommerce · baja · sonnet
- [x] M-2 — Prueba de `radiusDetail` (coordenadas con y sin `radio`, `radio=pais`, ciudad sin
  detalle) mockeando `useSearchParams`, en `features/location/__tests__/`.
  posven-ecommerce · baja · sonnet
- [x] M-3 — El comentario de `features/cart/components/CartLink.tsx` (l.12) dice "en la cabecera";
  `cartCount` ahora también lo usa la barra inferior.
  posven-ecommerce · baja · sonnet
- [x] M-4 — `MobileNavLinks.tsx` usa `text-[10px]` en el contador: confirmar contra `ui.md` o
  subir a `text-xs`.
  posven-ecommerce · baja · sonnet
- [x] M-5 — `SearchBox`: `ArrowDown` con el panel cerrado lo abre pero no mueve la opción activa.
  posven-ecommerce · baja · sonnet
- [x] M-6 — Mover el `Form` con `onSubmit` de `SearchPill` dentro de `SearchBox` para que
  `SearchPill` vuelva a ser de servidor (regla `app-router` 4).
  posven-ecommerce · media · sonnet
- [x] M-7 — Botón para borrar las búsquedas recientes del panel (no estaba en el alcance).
  posven-ecommerce · baja · sonnet
- [x] M-8 — Chips de `CategoryRail` con `border-input-border` (ui.md §5, 3:1) en vez de
  `border-border`; confirmar antes contra el lienzo.
  posven-ecommerce · baja · sonnet
- [x] M-9 — Prueba unitaria del chip "Todo" de `CategoryRail` (primero, hacia `/buscar`).
  posven-ecommerce · baja · sonnet
- [x] M-10 — `NearbyProducts`: el nombre accesible del enlace empieza por "N tiendas · km"; poner
  el nombre del producto primero en el DOM o usar `aria-label`.
  posven-ecommerce · baja · sonnet
- [x] M-11 — Prueba directa de `SponsoredStore` (sin `is_open`, `outside_radius`).
  posven-ecommerce · baja · sonnet
- [x] M-12 — Mover `StoreLogo` de `StoreCard.tsx` a su propio archivo si crece.
  posven-ecommerce · baja · sonnet
- [x] M-13 — Prueba de que el evento `search` no se re-dispara al cambiar `orden` en la página 1
  (`SearchResults.test.tsx` o `ViewBeacon`).
  posven-ecommerce · baja · sonnet
- [x] M-14 — `OpenNowFilter` es un enlace con `aria-current`; un lector no lo anuncia como
  interruptor. Valorar `aria-pressed` o `role="switch"`.
  posven-ecommerce · baja · sonnet
- [x] M-15 — Con `openNow` activo, "Quizás te sirve" puede mostrar productos de tiendas cerradas:
  pasar el filtro a `NearbyProducts` o rotularlo.
  posven-ecommerce · baja · sonnet
- [x] M-16 — `NearbyProducts` usa el id fijo `nearby-products-title`; usar `useId`.
  posven-ecommerce · baja · sonnet
- [x] M-17 — `.claude/rules/app-router.md` regla 7 nombra `NearbyProducts` sólo "de la portada";
  ahora también degrada en el estado vacío de `/buscar`.
  posven-ecommerce · baja · sonnet
- [x] M-18 — Chip "Todo" de `CategoryRail` usa `dark:`, que `ui.md` regla 4 prohíbe fuera de
  shadcn: documentar la excepción o resolverlo en la variante de `Button`.
  posven-ecommerce · baja · sonnet
- [x] M-19 — `Toaster` en `app/layout.tsx`: offset 0 desde `md`, donde no hay barra inferior.
  posven-ecommerce · baja · sonnet
- [x] M-20 — Prueba del consejo "Prueba con menos palabras..." de `EmptyState` con y sin `q`.
  posven-ecommerce · baja · sonnet
- [x] M-21 — `Toaster` con `theme="light"` fijo: revisar el tema de sonner en oscuro.
  posven-ecommerce · baja · sonnet · sin cambios: es la M-4 del plan F0, que va con el selector de
  tema de F4
- [x] M-22 — `SearchBox`: con la lista vacía, `ArrowUp` no limpia la marca de "activar la primera"
  que dejó un `ArrowDown` previo (inocuo; se limpia al teclear o cerrar).
  posven-ecommerce · baja · sonnet
- [ ] M-23 — `open_now` en `/products/nearby` (posveapi) y `listNearbyProducts`, para que "Quizás te
  sirve" filtre de verdad con "Abierto ahora" (hoy sólo lo rotula). Cruza el contrato.
  posveapi + posven-ecommerce · alta · plan nuevo
- [ ] M-24 — `SearchBox.test.tsx`: un caso con `fireEvent.submit` del `Form` que compruebe que el
  envío guarda el reciente (`readRecents`); hoy no hay prueba de ese camino.
  posven-ecommerce · baja · sonnet
