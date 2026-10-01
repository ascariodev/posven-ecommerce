# Plan 2 de shadcn Mercado: inicio y búsqueda en dirección C

modo: ligero

## Contexto

Fila 2 de la §6 de la spec `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md` (aprobada):
el inicio y `/buscar` pasan a la dirección C "Mercado" (referencias Airbnb para explorar y Trivago
para comparar) sobre shadcn/ui, que es la base de todo componente. Parte del plan 1 cerrado
(`docs/plans/terminados/2026-09-29-shadcn-mercado-plan-1-primitivas-resultado.md`): primitivas de shadcn en
`components/ui/`, `cn` y `buttonVariants` sobre `<Link>`.

Queda afuera: la ficha (plan 3), varias imágenes por producto y `carousel`, la pasarela, el
formulario de direcciones de la cuenta, y todo campo o parámetro nuevo del contrato (se declaran
en la spec §7, no se implementan).

## Spec

`docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md`: §2 (decisiones), §3 (tema, 44 px, foco),
§4 (composición de inicio y búsqueda), §6 fila 2, §7 (dependencias del contrato), §9 (`/preview` y
`components/preview-ui/` se borran en este plan).

### Decisiones tomadas al planificar (quien coordina, 2026-09-30)

Difieren de la §4 de la spec y la Task 4 las escribe en ella:

1. **Inicio sin rejilla "Cerca de ti" de productos.** El contrato no tiene un endpoint de productos
   destacados o cercanos (`/preview` lo simulaba con `q: "a"`). Se declara en §7 como dependencia.
2. **Búsqueda sin selector de orden.** `/search` no acepta `sort` (`searchQuery` en
   `lib/marketplace/params.ts`); ordenar en el navegador una página mentiría sobre el conjunto. Se
   declara en §7. `select` sólo se usa en el selector de ubicación.
3. **Inicio sin `tabs`.** No se instala. El carril de categorías son enlaces a `/buscar`.
4. **Filtro de distancia con la forma de `toggle-group`, hecho de enlaces.** Se instala
   `toggle-group` (trae `toggle`); `RadiusFilter` usa `toggleVariants` por `cn` sobre `<Link>`,
   conserva sus URL, `aria-current` y el funcionamiento sin JavaScript.
5. **Escala de radios de shadcn** derivada de `--radius`, y las pantallas pasan a esa escala.
6. **Tarjeta de tienda con banda de color por token** y el logo o las iniciales encima; la portada
   real exige `cover_url` en las tiendas cercanas, que se declara en §7.
7. **La app de Cashea** (inicio, búsqueda, catálogo por tienda y paso de compra) queda como estudio
   aparte, sin efecto en este plan.

## Restricciones globales

1. **shadcn es la base.** Toda pieza de UI nueva sale de `components/ui/` (generada con el CLI de
   shadcn y ajustada a los tokens). Nada de `components/preview-ui/` fuera de `app/preview/`.
2. **Colores sólo por tokens** de `app/globals.css` (`ui.md` 4). Ni hex, ni `black`/`white`, ni
   escalas de Tailwind (`amber-*`, `emerald-*`, `orange-*`...) en clases. Los tokens nuevos de este
   plan son sólo los de la Task 1.
3. **Foco visible por outline en `--foreground`** (`focus-visible:outline-2
   focus-visible:outline-offset-2 focus-visible:outline-foreground`), sin `outline-none` ni el ring
   de shadcn en controles y enlaces (`ui.md` 5). Controles principales de al menos 44 px (`h-11`).
4. **`buttonVariants` y `toggleVariants` sobre `<Link>` pasan por `cn`**
   (`className={cn(buttonVariants({...}), "extra")}`), nunca con `className` dentro de la llamada.
5. **El frontend no calcula montos ni convierte moneda**: muestra `formatUsd`/`formatVes` de lo que
   entrega la API. **El navegador nunca llama a posveapi**: los componentes cliente reciben datos
   por props o llaman Server Actions existentes.
6. **Sin cambio de contrato**: nada en `lib/marketplace/` cambia.
7. **Las rutas y sus metadatos no cambian** (`/`, `/buscar` con `noindex`, canónicas); lo que lee
   `searchParams` sigue dentro de `<Suspense>`.
8. **Textos exactos** de cada tarea, en español neutro sin voseo. Nombres accesibles que el e2e
   usa y se conservan: searchbox "Buscar productos", botón "Buscar", lista "Resultados", lista
   "Destacados", enlaces de categoría con su nombre, encabezado `Tiendas en <SITE_NAME>` o
   "Tiendas cercanas", nav "Distancia" con "Sólo <ciudad>", "<n> km" y "Todo el país", texto
   `Tasa BCV del ...`, y los de `EmptyState`.
9. **Pruebas**: las existentes siguen pasando; una prueba cuya consulta cambia por el rediseño se
   ajusta y se reporta. Pruebas nuevas, sólo las que pide cada tarea (`tests.md` 6).
10. Commit por tarea con el `commit:` de su cabecera, sin firma ni atribución de ningún tipo, sin
    push. Nunca `cd`: rutas absolutas y `git -C`.

## Repos y ramas

Todo en `posven-ecommerce` (`<repo>` = `C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce`
en local; en la nube, la raíz del checkout), rama `feat/ui-shadcn-mercado` (HEAD `a637321` antes del
commit de este plan). Sin push ni merge. Si `node_modules` no trae `radix-ui` ni `shadcn`, se corre
`npm ci` antes de la Task 1.

## Identificadores que estrena

- Tokens: `--radius-sm` a `--radius-4xl` (escala), `--tint-1` a `--tint-4` con su
  `--tint-N-foreground`, y `--overlay`.
- Componentes: `components/ui/{sheet,select,toggle,toggle-group}.tsx`,
  `features/search/{SearchPill,CategoryRail}.tsx`, `features/location/LocationSheet.tsx`,
  `features/search/categoryTint.ts`.

## Mapa de archivos

- Task 1 (≈24): `app/globals.css`; `components/ui/{sheet,select,toggle,toggle-group}.tsx` (nuevos);
  radios en `components/ui/{button,card,input,skeleton}.tsx`, `app/cuenta/page.tsx`, `app/error.tsx`,
  `app/not-found.tsx`, `features/account/{AccountMenu,AddressForm}.tsx`,
  `features/location/LocationPicker.tsx`,
  `features/search/{EmptyState,FeaturedCard,ProductCard,ProductThumb,SearchForm}.tsx`,
  `features/store/{StoreCard,StoreHeader}.tsx`; `.claude/rules/ui.md`.
- Task 2 (≈9): `features/search/SearchPill.tsx` (nuevo), `features/location/LocationSheet.tsx`
  (nuevo), `features/location/{LocationBar,LocationPicker}.tsx`,
  `features/location/LocationPicker.test.tsx`, `features/search/CategoryRail.tsx` (nuevo),
  `features/store/{StoreCard,NearbyStores}.tsx`, `app/page.tsx`, `e2e/search.spec.ts`.
- Task 3 (≈10): `features/search/{categoryTint.ts,categoryTint.test.ts}` (nuevos),
  `features/search/{ProductThumb,ProductCard,FeaturedCard,RadiusFilter,SearchResults}.tsx`,
  `app/buscar/page.tsx`, `e2e/search.spec.ts`.
- Task 4 (≈8 más los borrados): borra `app/preview/` y `components/preview-ui/`;
  `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md`, `.claude/rules/ui.md`,
  `features/search/README.md`, `features/location/README.md`, `features/store/README.md`,
  `docs/CAPABILITIES.md`, `docs/plans/terminados/2026-09-30-shadcn-mercado-plan-2-inicio-busqueda-resultado.md`
  (nuevo).

## Composición

- Task 1, tema, radios y piezas nuevas (`opus`, `review: yes`): define los tokens y las primitivas
  interactivas que consumen las demás. Razón 3 del modo ligero (define contrato). En advertencia de
  tamaño por el cambio de radios, que es de una clase por archivo.
- Task 2, inicio (`opus`, `review: yes`): píldora con segmento "dónde" en `Sheet`, selector de
  ubicación con `Select` de Radix (pruebas en jsdom y e2e cambian), carril de categorías y tarjeta
  de tienda. Juicio visual y de accesibilidad.
- Task 3, búsqueda (`sonnet`): tarjetas verticales con tinte, chips de categoría, filtros en `Sheet`
  en móvil y distancia con `toggleVariants`.
- Task 4, cierre (`sonnet`): borra la vista previa, actualiza spec, reglas y README, build y
  standalone, resultado del plan.

Costuras: la Task 1 deja `Sheet`, `Select`, `toggleVariants` y los tokens; la Task 2 deja
`SearchPill` (con prop `compact`) y `LocationBar` como segmento "dónde", que la Task 3 reutiliza en
`/buscar`; la Task 3 deja `ProductThumb` con tinte, que también ve la ficha.

### Task 1: Tema, escala de radios y piezas nuevas de shadcn

repo: posven-ecommerce
model: opus
mechanical: no
review: yes
commit: feat(ui): escala de radios, tintes y piezas sheet, select y toggle-group de shadcn

Lee antes `.claude/rules/ui.md`, `docs/conventions/lessons.md` y las Restricciones globales.

**Produce**

- `app/globals.css`:
  - En `@theme inline`, la escala de shadcn: `--radius-sm: calc(var(--radius) * 0.6)`,
    `--radius-md: calc(var(--radius) * 0.8)`, `--radius-lg: var(--radius)`,
    `--radius-xl: calc(var(--radius) * 1.4)`, `--radius-2xl: calc(var(--radius) * 1.8)`,
    `--radius-3xl: calc(var(--radius) * 2.2)`, `--radius-4xl: calc(var(--radius) * 2.6)`.
    `--radius` sigue en 1rem.
  - En `:root`, tintes de categoría (fondo y texto): `--tint-1: #fef3c7` / `--tint-1-foreground:
    #92400e`; `--tint-2: #e0f2fe` / `#075985`; `--tint-3: #d1fae5` / `#065f46`; `--tint-4: #ffe4e6`
    / `#9f1239`; y `--overlay: rgb(38 38 39 / 0.4)`. Con sus `--color-tint-N`,
    `--color-tint-N-foreground` y `--color-overlay` en `@theme inline`.
- Radios de las pantallas en la escala nueva, sin cambio de tamaño visible: `rounded-2xl` (16 px)
  pasa a `rounded-lg` (= `--radius`, 16 px) y `rounded-xl` (12 px) a `rounded-md` (12,8 px) en los
  17 archivos del mapa (incluidas las primitivas `button`, `card`, `input`, `skeleton`).
  `rounded-full` no cambia.
- `components/ui/sheet.tsx`, `select.tsx`, `toggle.tsx`, `toggle-group.tsx`, generados con
  `npx shadcn add sheet select toggle-group` (el CLI local de `package.json`; `toggle-group` trae
  `toggle`). Punto de comparación: `components/preview-ui/{sheet,select}.tsx`. Ajustes:
  - Importan `cn` de `@/lib/utils`; conservan su `'use client'` si lo traen.
  - Overlay de `Sheet` con `bg-overlay` (no `bg-black/*`); `SheetContent` con `bg-card`; el botón
    de cerrar con nombre accesible "Cerrar" y el foco de la Restricción 3.
  - `SelectTrigger`: `h-11` por defecto, `text-base`, `border-input-border`, `bg-card`, foco de la
    Restricción 3 (sin `outline-none` ni ring); `SelectContent` con `bg-popover`; `SelectItem` con
    alto mínimo de 44 px (`min-h-11`).
  - `toggle.tsx` exporta `Toggle` y `toggleVariants`: variantes `default` y `outline`
    (`border-input-border`), tamaños `default` `h-11 px-4 text-base` y `sm` `h-9 px-3 text-sm`;
    estado activo `data-[state=on]:bg-primary data-[state=on]:text-primary-foreground`; foco de la
    Restricción 3; `motion-reduce:transition-none`.
  - Se eliminan tamaños por debajo de `sm` y las clases de color literal que traiga la generación;
    las clases `dark:` inertes pueden quedar (no hay modo oscuro).
- `.claude/rules/ui.md`: suma a la regla 1 las interactivas `Sheet`, `Select`, `Toggle` y
  `ToggleGroup`; a la regla 3, "`toggleVariants` sobre `<Link>` igual que `buttonVariants`, por
  `cn`"; a la regla 4, los tokens `bg-tint-N`/`text-tint-N-foreground`, `bg-overlay`,
  `bg-popover`, y "los radios son la escala de shadcn (`rounded-md`, `rounded-lg`...), derivada de
  `--radius`". Sigue en unas 40 líneas.

**Consume**: `radix-ui`, `class-variance-authority`, `cn`.

**Tests**: ninguno nuevo; la suite entera sigue pasando.

**Verificación** (rutas absolutas, sin `cd`):

```bash
"<repo>/node_modules/.bin/tsc" --noEmit -p "<repo>/tsconfig.json"
npx eslint "<repo>/components/ui" "<repo>/app" "<repo>/features"
"<repo>/node_modules/.bin/vitest" run --root "<repo>"
grep -rnE "rounded-(xl|2xl)\b" "<repo>/app" "<repo>/features" "<repo>/components/ui"
grep -rnE "(bg|text|border|from|to|via)-(black|white|zinc|amber|orange|sky|emerald|rose|red|green)(-|/|\b)|outline-none" "<repo>/components/ui"
```

Esperado: `tsc`, `eslint` y `vitest` sin errores; los dos `grep` sin salida (fuera de
`app/preview/`, que no se busca).

**Terminada cuando** lo anterior da lo esperado, las cuatro piezas existen en `components/ui/`, el
commit contiene sólo los archivos del mapa de esta tarea y no toca `app/preview/` ni
`components/preview-ui/`.

### Task 2: Inicio en dirección C

repo: posven-ecommerce
model: opus
mechanical: no
review: yes
commit: feat(ui): inicio en dirección Mercado con píldora, carril de categorías y tiendas

Lee antes `.claude/rules/{ui,app-router,tests}.md`, `docs/conventions/lessons.md` (L-02),
`features/location/README.md`, `app/preview/_components/PreviewViews.tsx` (referencia visual
aprobada, no se importa) y las Restricciones globales.

**Produce**

- `features/search/SearchPill.tsx` (Server Component): `SearchPill({ defaultQuery, compact })`.
  Un contenedor `rounded-full border border-border bg-card shadow-raised p-1.5` con, en orden:
  - el `<Form action="/buscar" role="search" id={...}>` de `next/form` con el `Input` `name="q"`,
    `type="search"`, `aria-label="Buscar productos"`, placeholder "Producto, marca o código de
    barras", sin borde propio;
  - un separador vertical `aria-hidden` y el segmento "dónde": `<Suspense
    fallback={<LocationBarSkeleton />}><LocationBar /></Suspense>`;
  - el botón `type="submit"` con `form={id}` (fuera del `<form>` para no anidar formularios con
    el del selector de ubicación), `rounded-full`, ícono `Search`, texto "Buscar" visible desde
    `sm` y `aria-label="Buscar"` en todo tamaño.
  - `compact` (búsqueda) usa `h-9` en el input y el botón; sin `compact`, `h-11`.
  - A 412 px de ancho no desborda: el segmento "dónde" trunca su texto (`max-w-32 truncate`).
- `features/location/LocationSheet.tsx` (`'use client'`): `LocationSheet({ label, states })`.
  `Sheet` controlado (`open`/`onOpenChange`), `side="bottom"` en móvil y `side="right"` desde `sm`.
  Disparador: `Button variant="ghost"` con ícono `MapPin`, texto visible `label ?? "¿Dónde?"` y
  `aria-label={`Ubicación: ${label ?? "sin elegir"}`}`. Contenido: `SheetTitle` "Tu ubicación",
  `SheetDescription` "Buscamos tiendas cerca de este lugar." y `LocationPicker` con
  `onDone={() => setOpen(false)}`.
- `features/location/LocationBar.tsx`: `LocationBar` renderiza `LocationSheet` en lugar de
  `LocationPicker`; `LocationBarSkeleton` pasa a `h-11 w-28 rounded-full`. `LocationSummary` no
  cambia (la usa la cabecera).
- `features/location/LocationPicker.tsx`: los tres `<select>` nativos pasan a `Select` de
  `components/ui/select.tsx` con sus mismas etiquetas ("Estado", "Municipio", "Ciudad"), el mismo
  encadenamiento y `placeholder="Selecciona"` en `SelectValue`; la etiqueta se asocia al
  `SelectTrigger` por `id`. Prop nueva opcional `onDone?: () => void`, que se llama tras guardar
  ciudad, usar la ubicación con éxito o quitarla. Se elimina `selectClasses`.
- `features/search/CategoryRail.tsx` (Server Component): `CategoryRail({ categories })` con las
  categorías raíz de `listCategories()`: `<nav aria-label="Categorías">` con desplazamiento
  horizontal (`overflow-x-auto`, sin barra visible), cada enlace con su ícono (`categoryIcon`,
  `size-6`) arriba y el nombre abajo, `href` de `searchHref({ q: "", categoria, radio:
  DEFAULT_RADIUS_KM, pagina: 1 })`, subrayado inferior `border-b-2` en hover, foco de la
  Restricción 3. Sin categorías no pinta nada.
- `features/store/StoreCard.tsx`: `Card` de shadcn con, arriba, una banda `h-16 bg-primary-soft`
  (`bg-featured` si `featured`) y, encima de su borde inferior (`-mt-7`), el logo (sólo si
  `is_premium` y hay `logo_url`, como hoy) o las iniciales en un círculo `size-14` con
  `border-4 border-card`; debajo, las insignias "Destacado" y "Fuera de tu zona", el nombre (`h3`)
  y `ciudad · distancia`. Todo el `Card` es el enlace a `/tienda/<slug>`, con el foco de la
  Restricción 3 y `hover:shadow-raised`.
- `features/store/NearbyStores.tsx`: rejilla `sm:grid-cols-2 lg:grid-cols-3`; esqueleto a juego
  (`h-40`). Textos sin cambio.
- `app/page.tsx`: título `h1` "Encuentra lo que buscas en tiendas cerca de ti" (`text-3xl
  sm:text-4xl font-extrabold text-balance`), subtítulo "Compara precios en dólares y bolívares
  antes de salir.", `SearchPill`, `CategoryRail` y `NearbyStores`. Sin el `LocationBar` suelto
  (ya va en la píldora) ni `CategoryLinks`.

**Consume**: `Sheet*`, `Select*`, `Button`, `Input`, `Card`, `Badge`, `Skeleton` de
`components/ui/`; `listCategories`, `listLocations` y las Server Actions de `features/location`.

**Tests**

- `features/location/LocationPicker.test.tsx`: sus casos se conservan; se ajustan las consultas
  al `Select` de Radix (abrir el `combobox` por su etiqueta y elegir el `option`). En jsdom, Radix
  necesita `Element.prototype.hasPointerCapture`, `releasePointerCapture` y `scrollIntoView`:
  se simulan en el propio archivo y se restauran en `afterEach`. Se suma un caso: `onDone` se
  llama tras guardar la ciudad.
- `e2e/search.spec.ts`: "elegir ciudad" abre primero el segmento (`getByRole("button", { name:
  "Ubicación: sin elegir" })`), elige con `combobox` y `option`, guarda y comprueba
  `getByRole("button", { name: "Ubicación: Valencia" })`; "usar mi ubicación" comprueba
  `Ubicación: Tu ubicación actual`. El resto del archivo no cambia en esta tarea.

**Verificación**: `tsc`, `eslint` sobre `features/search`, `features/location`, `features/store` y
`app/page.tsx`, y `vitest run features/location features/store features/search`. Playwright lo
corre quien coordina (declarar "no corrido").

**Terminada cuando** lo anterior pasa, ningún `<select>` nativo queda en `features/location`, el
inicio no importa nada de `preview-ui`, y el commit contiene sólo los archivos de esta tarea.

### Task 3: Búsqueda en dirección C

repo: posven-ecommerce
model: sonnet
mechanical: no
commit: feat(ui): búsqueda en dirección Mercado con tarjetas, chips y filtros

Lee antes `.claude/rules/{ui,app-router,tests}.md`, `features/search/README.md`,
`app/preview/_components/{PreviewViews,PreviewCard,PreviewThumb}.tsx` (referencia, no se importan)
y las Restricciones globales.

**Produce**

- `features/search/categoryTint.ts` (puro): `categoryTint(category: Category | null):
  { bg: string; fg: string }` que devuelve una de las cuatro parejas `bg-tint-N` /
  `text-tint-N-foreground` según un hash estable del `slug` (el de `PreviewThumb`: `hash = (hash *
  31 + charCode) % 4`); sin categoría, `tint-1`.
- `features/search/ProductThumb.tsx`: sin imagen, fondo y color del ícono salen de
  `categoryTint` (sustituye `bg-primary-soft text-warning`). Tamaño nuevo `card`: contenedor
  `relative aspect-[4/3] w-full rounded-lg bg-muted overflow-hidden` con `Image` `fill`,
  `sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"` y `object-contain p-3`; sin
  imagen, el tinte con el ícono `size-12`. `md` y `lg` conservan sus medidas.
- `features/search/ProductCard.tsx`: tarjeta vertical: `ProductThumb size="card"` arriba y debajo
  el nombre (`h3`, `line-clamp-2`), la marca, las insignias actuales, el precio (`Desde` si
  `offers_count > 1`) en USD grande y VES al lado, y `En N tiendas · distancia`. Mismos textos
  que hoy. Todo es un enlace a `/p/<slug>` con el foco de la Restricción 3 y el hover sobre la
  imagen (`group-hover:shadow-raised`, `motion-reduce`).
- `features/search/FeaturedCard.tsx`: misma forma vertical, con la insignia "Destacado" sobre la
  imagen y el fondo `bg-featured` en la zona de texto; textos sin cambio.
- `features/search/RadiusFilter.tsx`: cada opción es un `<Link>` con
  `cn(toggleVariants({ variant: "outline", size: "sm" }), "rounded-full")`, `data-state={current ?
  "on" : "off"}` y `aria-current` como hoy; `<nav aria-label="Distancia">` y la lista se conservan.
- `features/search/SearchResults.tsx`:
  - Barra de filtros: chips de categoría (categorías raíz, `overflow-x-auto`) como `<Link>` con
    `cn(toggleVariants({ variant: "outline", size: "sm" }), "rounded-full")`; el chip de la
    categoría activa lleva `data-state="on"` y `aria-current="true"` y su `href` la quita; los
    demás la fijan con `searchHref({ ...query, categoria, pagina: 1 })`.
  - Distancia (si hay ubicación): desde `md`, `RadiusFilter` en línea; en móvil, un `Button
    variant="outline"` "Filtros" con ícono `SlidersHorizontal` abre un `Sheet` `side="bottom"`
    (`SheetTitle` "Filtros", `SheetDescription` "Distancia desde tu ubicación.") con el
    `RadiusFilter`. El `Sheet` va en un componente cliente pequeño que recibe el `RadiusFilter`
    como `children` (el filtro sigue siendo de servidor).
  - Encabezado con el total (`<n> productos`, `h2`) y `Tasa BCV del ...` a la derecha.
  - Rejillas `grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4` para "Destacados" y
    "Resultados" (mismos `aria-label`). `EmptyState` y `Pagination` como hoy (sólo radios nuevos).
  - El aviso sin consulta ("Escribe qué buscas o elige una categoría.") se conserva.
- `app/buscar/page.tsx`: `SearchPill compact` con `defaultQuery` (dentro de su `Suspense` como
  hoy) y sin el `LocationBar` suelto; el esqueleto de resultados en la rejilla nueva.

**Tests**

- Nuevo `features/search/categoryTint.test.ts`: el mismo slug da la misma pareja; sin categoría,
  `tint-1`; las cuatro parejas son alcanzables con slugs de prueba.
- Siguen pasando `ProductCard`, `RadiusFilter`, `SearchResults`, `EmptyState` y `StoreCard`;
  consulta que cambie se ajusta y se reporta.
- `e2e/search.spec.ts`, caso "elegir ciudad": en `/buscar?q=acetaminofen` (Pixel 7) primero se
  abre "Filtros" y luego se comprueban "Sólo Valencia" y "Todo el país".

**Verificación**: `tsc`, `eslint` sobre `features/search` y `app/buscar`, `vitest run
features/search features/store`, y `grep -rn "preview-ui" "<repo>/app" "<repo>/features"` sólo con
líneas de `app/preview/`. Playwright lo corre quien coordina.

**Terminada cuando** lo anterior pasa, `/buscar` no tiene selector de orden, y el commit contiene
sólo los archivos de esta tarea.

### Task 4: Borrado de la vista previa, documentación y build

repo: posven-ecommerce
model: sonnet
mechanical: no
commit: docs(ui): cierre del plan 2 de shadcn Mercado y retiro de /preview

Lee antes `docs/conventions/README.template.md`, la spec y el resultado del plan 1 (formato).

**Produce**

- Borra `app/preview/` y `components/preview-ui/` enteros; ningún archivo los importa
  (`grep -rn "preview" "<repo>/app" "<repo>/features" "<repo>/components" "<repo>/lib"` sin
  salida salvo textos no relacionados). Si `robots.ts`, `sitemap.ts` o una regla citan `/preview`,
  se quita.
- Spec `2026-09-29-ecommerce-shadcn-mercado-design.md`:
  - §4: las decisiones 1 a 6 de este plan como diferencias de inicio y búsqueda.
  - §7: tres dependencias nuevas del contrato: endpoint de productos destacados o cercanos para
    el inicio; `sort` en `/search`; `cover_url` en las tiendas cercanas.
  - §9: `/preview` retirada en el plan 2.
- `.claude/rules/ui.md` sólo si la Task 1 dejó algo desfasado.
- README de `features/search`, `features/location` y `features/store`: componentes nuevos
  (`SearchPill`, `CategoryRail`, `LocationSheet`, `categoryTint`) y retirados del inicio; luego
  `docs/CAPABILITIES.md` (con `generate-index.mjs` si está disponible; si no, a mano y se declara).
- `docs/plans/terminados/2026-09-30-shadcn-mercado-plan-2-inicio-busqueda-resultado.md` con el formato del
  resultado del plan 1: qué queda hecho, diferencias contra el diseño, verificación, deuda y cómo
  continuar.

**Verificación**: `tsc`, `eslint` de `app`, `features` y `components`, `vitest run` entero, y

```bash
MARKETPLACE_MODE=mock SITE_URL=http://localhost:3000 "<repo>/node_modules/.bin/next" build "<repo>"
```

sin errores ni aviso `blocking-route`; el standalone (`node .next/standalone/server.js` en un
puerto libre distinto del 3000) responde 200 en `/`, `/buscar?q=a` y `/buscar?categoria=<slug>`.
Playwright y la revisión visual los corre quien coordina.

**Terminada cuando** lo anterior pasa, `app/preview/` y `components/preview-ui/` no existen, y el
commit contiene sólo los borrados y los documentos de esta tarea.

## Cierre

### Pendientes del cierre

- Destino ejecución local de quien coordina: `npx playwright test` (puerto 3000 libre, modo
  simulado) y revisión visual de `/`, `/buscar` (con y sin ubicación, móvil y escritorio), y de
  las pantallas que cambian de radio (`/entrar`, `/cuenta`, `/tienda/<slug>`, `/p/<slug>`).
- Destino plan 3 (ficha): la ficha hereda el tinte de `ProductThumb` y la escala de radios; su
  rediseño queda en ese plan.
- Destino spec §7 y posveapi: endpoint de productos destacados o cercanos, `sort` en `/search` y
  `cover_url` en las tiendas cercanas.
- Destino plan de cuenta futuro: el `<select>` nativo de ciudad en `features/account/AddressForm.tsx`
  pasa a `Select` de shadcn.
- Estudio aparte: referencia de la app de Cashea (inicio, búsqueda, catálogo por tienda y paso de
  compra) para ver qué aplica a posven.
