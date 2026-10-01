# Plan 3 de shadcn Mercado: ficha de producto en dirección C

modo: ligero

## Contexto

Fila 3 de la §6 de la spec `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md` (aprobada):
la ficha `/p/[slug]` pasa a la dirección C "Mercado" (Trivago para comparar) sobre shadcn/ui. Parte
del plan 2 cerrado y desplegado
(`docs/plans/2026-09-30-shadcn-mercado-plan-2-inicio-busqueda-resultado.md`): escala de radios,
tintes, `Sheet`, `Select`, `toggleVariants`, `ProductThumb` con tamaño `card`.

Queda afuera: la página de tienda (`/tienda/[slug]`, sin cambio de diseño), la cabecera con su
buscador compacto, varias imágenes por producto y `carousel`, las páginas del pie (`/comercios`,
`/terminos`, `/privacidad`, que no existen), y todo campo nuevo del contrato.

## Spec

`docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md`: §2 (decisiones), §3 (tema, 44 px, foco),
§4 fila "Ficha" y su párrafo de "Mejor precio", §6 fila 3, §7 (una sola imagen, rango sólo en USD).

### Decisiones tomadas al planificar (quien coordina, 2026-09-30)

Difieren o precisan la §4 de la spec y la Task 3 las escribe en ella:

1. **Panel fijo sólo con el resumen.** Imagen a la izquierda; a la derecha, fijo en escritorio, el
   resumen del producto (categoría, nombre, marca, récipe, rango de precio, favoritos, atributos).
   La lista completa de tiendas va debajo, a todo el ancho, con el orden, las destacadas y "Fuera
   de tu zona". En móvil todo se apila.
2. **"Mejor precio" sólo con orden por precio, en la primera oferta normal** (la primera de
   `offers` dentro del radio). Ni las destacadas ni la vista "Más cerca" la llevan. El frontend no
   compara precios: la marca sale del orden de la API.
3. **Rango del panel sólo en dólares**, de `offers_summary`: "Desde $X", "hasta $Y" cuando la
   cadena del máximo es distinta de la del mínimo, "en N tiendas" y la aclaración "Precio en todo
   el país". Los bolívares aparecen en cada tienda de la lista.
4. **Migas de pan con las categorías como texto.** Sólo "Inicio" es enlace; `/categoria/<slug>`
   no existe (hoy da 404). El JSON-LD `BreadcrumbList` lleva sólo Inicio y el producto.

## Restricciones globales

1. **shadcn es la base.** Toda pieza de UI sale de `components/ui/` (`Card`, `Badge`, `Button`,
   `buttonVariants`, `toggleVariants`, `Skeleton`).
2. **Colores sólo por tokens** de `app/globals.css` (`ui.md` 4); los únicos tokens nuevos son los
   de la Task 2.
3. **Foco visible por outline en `--foreground`** (`focus-visible:outline-2
   focus-visible:outline-offset-2 focus-visible:outline-foreground`), sin `outline-none` ni ring;
   controles principales de al menos 44 px (`ui.md` 5).
4. **`buttonVariants` y `toggleVariants` sobre `<Link>` o `<a>` pasan por `cn`**, con las clases
   extra fuera de la llamada.
5. **El frontend no calcula montos, no compara precios ni convierte moneda**: muestra
   `formatUsd`/`formatVes` de las cadenas de la API. La única comparación permitida es la igualdad
   de cadenas de la decisión 3. **El navegador nunca llama a posveapi.**
6. **Sin cambio de contrato**: `lib/marketplace/` no cambia.
7. **Metadatos, canónica, JSON-LD `Product`, redirección de slug viejo y `noindex` sin ofertas no
   cambian** (`features/product/{metadata,jsonld,load}.ts`). Lo que lee `searchParams` sigue dentro
   de `<Suspense>`; nada de `<Suspense>` por encima de la página (`seo.md` 7).
8. **Textos que el e2e y las pruebas usan y se conservan**: lista "Ofertas" con "Destacado" en las
   destacadas y los precios en su orden, lista y `h3` "Fuera de tu zona", nav "Orden de las
   ofertas" con "Menor precio" y "Más cerca" (`aria-current`), enlaces "WhatsApp de <tienda>",
   "Llamar a <tienda>" y "Ver ruta a <tienda>", "Sin disponibilidad ahora.", "No hay ofertas cerca.
   Prueba con otra ciudad.", "Dónde comprarlo", `Tasa BCV del ...`, "Pocas unidades", "Requiere
   récipe" y el botón de favoritos.
9. **Pruebas**: las existentes siguen pasando; una consulta que cambie por el rediseño se ajusta y
   se reporta. Nuevas, sólo las que pide cada tarea.
10. Commit por tarea con el `commit:` de su cabecera, sin firma ni atribución de ningún tipo. Push
    de la rama al terminar cada tarea (pedido de quien coordina); nunca a `main`. Nunca `cd`:
    rutas absolutas y `git -C`.

## Repos y ramas

Todo en `posven-ecommerce` (`<repo>` = `C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce`
en local; en la nube, la raíz del checkout), rama `feat/ui-shadcn-mercado-ficha`, creada desde
`143ed46` (el cierre del plan 2 sobre `main` `31cbe8b`).

## Identificadores que estrena

- Tokens: `--best` y `--best-foreground` (verde de "Mejor precio").
- Variante `best` de `Badge`.
- Componente `features/product/PriceSummary.tsx`; tamaño `detail` de `ProductThumb`.

## Mapa de archivos

- Task 1 (≈5): `app/p/[slug]/page.tsx`, `features/product/PriceSummary.tsx` (nuevo),
  `features/product/PriceSummary.test.tsx` (nuevo), `features/search/ProductThumb.tsx`,
  `e2e/product.spec.ts` (sólo si una consulta cambia).
- Task 2 (≈7): `app/globals.css`, `components/ui/badge.tsx`, `.claude/rules/ui.md`,
  `features/product/{OfferCard,ProductOffers,SortLinks}.tsx`, `features/product/ProductOffers.test.tsx`.
- Task 3 (≈5): `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md`,
  `features/product/README.md`, `features/search/README.md` (tamaño `detail`), `docs/CAPABILITIES.md`,
  `docs/plans/2026-09-30-shadcn-mercado-plan-3-ficha-resultado.md` (nuevo).

## Composición

- Task 1, cabecera de la ficha (`opus`, `review: yes`): composición en dos columnas, panel fijo con
  el resumen y migas corregidas (toca SEO: JSON-LD de migas).
- Task 2, lista de tiendas (`sonnet`, `review: yes`): tarjetas de oferta en filas tipo comparador,
  "Mejor precio", orden con `toggleVariants`. Revisión porque decide qué oferta se marca.
- Task 3, cierre (`sonnet`): spec, README, índice, build, standalone y resultado.

Costura: la Task 1 no toca `ProductOffers`; la Task 2 no toca `page.tsx` salvo que la prop nueva
lo exija (no debería: "Mejor precio" se decide dentro de `ProductOffers`).

### Task 1: Cabecera de la ficha con panel fijo

repo: posven-ecommerce
model: opus
mechanical: no
review: yes
commit: feat(ui): ficha en dirección Mercado con imagen y panel fijo de resumen

Lee antes `.claude/rules/{ui,app-router,seo,tests}.md`, `docs/conventions/lessons.md`,
`features/product/README.md`, `lib/jsonld.ts` y las Restricciones globales. Esta versión de Next
difiere de tu entrenamiento: lee en `node_modules/next/dist/docs/` lo que toques (`next/image`
con `fill`, `sizes` y `preload`).

**Produce**

- `features/search/ProductThumb.tsx`: tamaño nuevo `detail`: contenedor `relative aspect-square
  w-full rounded-lg bg-muted overflow-hidden` con `Image` `fill`,
  `sizes="(min-width: 768px) 50vw, 100vw"`, `object-contain p-6` y `preload` si se pide; sin
  imagen, el tinte de `categoryTint` con el ícono `size-24`. `md`, `lg` y `card` no cambian.
- `features/product/PriceSummary.tsx` (Server Component, puro):
  `PriceSummary({ summary }: { summary: OffersSummary })`. Si `low_price_usd` es `null`, no pinta
  nada. Si no: línea con "Desde" (`text-sm text-muted-foreground`) y `formatUsd(low)` en
  `text-3xl font-extrabold`; "hasta `formatUsd(high)`" (`text-sm text-muted-foreground`) sólo si
  `high !== null && high !== low` (igualdad de cadenas); debajo "en 1 tienda" o "en N tiendas"
  según `offer_count` y "Precio en todo el país" (`text-sm text-muted-foreground`).
- `app/p/[slug]/page.tsx`:
  - Migas: `Inicio` como `<Link href="/">` con el foco de la Restricción 3; cada categoría (padre
    y propia, como hoy) como `<span>` de texto, con el separador `›` `aria-hidden`. El JSON-LD
    `BreadcrumbList` recibe `[{ name: "Inicio", path: "/" }, { name: product.name, path:
    "/p/<slug>" }]`. Se elimina la construcción de `/categoria/<slug>`; `listCategories` sigue
    haciendo falta sólo para el nombre de la categoría padre.
  - Cuerpo: `grid items-start gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]`. Izquierda:
    `ProductThumb size="detail"` con `alt={product.name}` y `preload`. Derecha: `Card` con
    `md:sticky md:top-24` y `CardContent` en columna con, en orden: `Badge variant="secondary"`
    con el nombre de la categoría (si hay), `h1` (`text-2xl sm:text-3xl font-extrabold
    tracking-tight text-balance`), la marca, "Requiere récipe" (`Badge variant="warning"`, si
    aplica), `PriceSummary`, `FavoriteButton` en su `Suspense` (como hoy) y los atributos en su
    `dl` (sin `Card` propio, separado por `border-t border-border pt-4`).
  - Debajo del grid, a todo el ancho y sin cambios: "Sin disponibilidad ahora." o `ProductOffers`
    en su `Suspense`.

**Tests**

- Nuevo `features/product/PriceSummary.test.tsx`: con `low` y `high` distintos pinta "Desde",
  el mínimo, "hasta" y el máximo; con `high` igual a `low` no pinta "hasta"; `offer_count` 1 da
  "en 1 tienda" y 3 "en 3 tiendas"; con `low_price_usd` `null` no pinta nada. `cleanup()` en
  `afterEach` (`tests.md` 8).
- Siguen pasando `features/product` y `features/search`.

**Verificación**: `tsc`, `eslint` sobre `app/p`, `features/product` y `features/search`,
`vitest run features/product features/search`, y `next build` en simulado con exit 0, sin aviso
`blocking-route`, y `/p/[slug]` en `◐`. Playwright lo corre quien coordina.

**Terminada cuando** lo anterior pasa, no queda ningún `/categoria/` en `app/`, y el commit
contiene sólo los archivos de esta tarea.

### Task 2: Lista de tiendas con "Mejor precio"

repo: posven-ecommerce
model: sonnet
mechanical: no
review: yes
commit: feat(ui): tiendas de la ficha en filas con mejor precio y orden como toggle

Lee antes `.claude/rules/{ui,tests}.md`, `features/product/README.md`,
`features/events/ContactButtons.tsx` (no cambia) y las Restricciones globales.

**Produce**

- `app/globals.css`: en `:root`, `--best: #d1fae5` y `--best-foreground: #065f46` (contraste
  6,78:1); en `@theme inline`, `--color-best` y `--color-best-foreground`.
- `components/ui/badge.tsx`: variante `best`: `bg-best text-best-foreground`.
- `.claude/rules/ui.md` regla 4: suma `bg-best`, `text-best-foreground` y `border-best-foreground`.
- `features/product/OfferCard.tsx`: prop nueva `best: boolean`. Tarjeta en fila (`Card` con
  `CardContent`): a la izquierda el enlace a la tienda (nombre `font-semibold`), `ciudad ·
  distancia` y las insignias ("Mejor precio" con `variant="best"`, "Destacado", "Pocas
  unidades"); a la derecha, alineados al final, `formatUsd` en `text-xl font-bold` y `formatVes`
  debajo; abajo, a todo el ancho, `formatUpdatedAgo` y `ContactButtons`. Desde `sm`, precio y
  tienda en la misma fila; en móvil, apilados. Con `best`, el `Card` lleva `border-best-foreground`
  y `ring-1 ring-best-foreground`.
- `features/product/ProductOffers.tsx`: `best` es `true` sólo en la primera de `inside` y sólo si
  `sort === "price"`; las destacadas y las de "Fuera de tu zona" van con `false`. Las listas
  pasan a una columna (`flex flex-col gap-3`) y conservan sus `aria-label`, su orden y el `h3`.
- `features/product/SortLinks.tsx`: cada opción usa `cn(toggleVariants({ variant: "outline",
  size: "sm" }), "rounded-full")` con `data-state={actual ? "on" : "off"}` y `aria-current` como
  hoy; la nav y los textos no cambian.

**Tests**

- `features/product/ProductOffers.test.tsx`: casos nuevos: con orden por precio, "Mejor precio"
  aparece una sola vez y en la primera oferta normal (no en una destacada); con `orden=cerca` y
  ubicación no aparece; en "Fuera de tu zona" no aparece. Los casos actuales se conservan.

**Verificación**: `tsc`, `eslint` sobre `features/product` y `components/ui`,
`vitest run features/product`, `grep -rn "emerald\|green-" "<repo>/features"
"<repo>/components/ui"` sin salida, y `next build` en simulado con exit 0 y sin `blocking-route`.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los archivos de esta tarea.

### Task 3: Cierre del plan 3

repo: posven-ecommerce
model: sonnet
mechanical: no
commit: docs(ui): cierre del plan 3 de shadcn Mercado

Lee antes la spec, el resultado del plan 2 (formato) y `docs/conventions/README.template.md`.

**Produce**

- Spec: §4, las decisiones 1 a 4 de este plan como precisiones de la ficha; §6, el plan 3 como
  cerrado.
- `features/product/README.md`: `PriceSummary`, "Mejor precio" (regla nueva `RN-PRODUCT-05`: la
  marca va sólo en la primera oferta normal con orden por precio, con su prueba), migas sin
  enlaces de categoría; `features/search/README.md`: tamaño `detail` de `ProductThumb`.
- `docs/CAPABILITIES.md` regenerado con `generate-index.mjs`; si no está disponible, con la
  reproducción `gen-capabilities.mjs` del scratchpad de la sesión (validada contra el script real
  en el plan 2), y se declara cuál se usó.
- `docs/plans/2026-09-30-shadcn-mercado-plan-3-ficha-resultado.md`, con el formato del resultado
  del plan 2.

**Verificación**: `tsc`, `eslint` de `app`, `features` y `components`, `vitest run` entero, `next
build` en simulado sin `blocking-route`, y el standalone en el puerto 3100 con 200 en
`/p/<slug con ofertas>`, `/p/<slug sin ofertas>` y `/p/<slug>?orden=cerca`, detenido al terminar.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los documentos de esta tarea.

## Cierre

### Pendientes del cierre

- Destino ejecución local de quien coordina: `npx playwright test` y revisión visual de
  `/p/<slug>` (con y sin ofertas, con y sin ubicación, móvil y escritorio).
- Destino plan propio: la cabecera sigue con el buscador compacto anterior (`SearchForm size="sm"`)
  en ficha, tienda y cuenta.
- Destino plan propio: páginas `/comercios`, `/terminos` y `/privacidad` del pie (hoy 404).
- Destino plan propio o spec §7: páginas de categoría indexables (`/categoria/<slug>`).
- Destino posveapi: `/categories` vacío en producción (sin carril ni chips ni migas de categoría).
