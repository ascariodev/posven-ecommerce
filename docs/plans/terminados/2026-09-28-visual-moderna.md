# Plan: visual moderna del ecommerce

modo: ligero

## Contexto

El buscador funciona, pero se ve plano: cabecera de texto, tarjetas de borde fino y el naranja
sólo en botones. Este plan aplica la dirección "suave con vidrio" aprobada por el usuario a todo
lo que existe, sin tocar estructura, textos, metadatos ni contrato. Desbloquea que las landings
del plan D nazcan con el estilo final. Deja afuera el modo oscuro, las transiciones de vista y el
backoffice. El simulado ya usa la taxonomía real (`92ab22c`), así que los íconos por categoría se
ven en modo simulado.

## Spec

`docs/specs/2026-09-28-visual-moderna-design.md` (`fcd8e61`): §1 alcance, §3 tokens, §4 forma y
tipografía, §5 cabecera, §6 íconos y reemplazo de imagen, §7 movimiento, §8 reglas, §9
verificación, §10 descomposición.

Decisión del usuario al planificar, que completa §5: la ciudad de la cabecera compacta "Solo
mostrarla (Recomendado)": ícono `MapPin` y "Cerca de: <ciudad>", o "Sin ubicación", sin selector.

## Restricciones globales

1. **Nada cambia fuera de lo visual.** Textos visibles, jerarquía de encabezados, roles, nombres
   accesibles, `href`, metadatos, JSON-LD, `'use cache'`, `Suspense` existentes y contrato
   (`lib/marketplace/`) quedan como están. Los e2e (`e2e/search.spec.ts`, `e2e/product.spec.ts`)
   y los tests de componentes buscan textos y roles, y tienen que seguir pasando sin editarlos.
2. **Colores y sombras sólo por tokens** (`.claude/rules/ui.md` regla 4): nada de hex,
   `white`, `black`, `zinc-*` ni `rgb()` en clases. Los valores viven sólo en `app/globals.css`.
3. **Recetario de clases** (spec §4, §6 y §7), igual en todas las tareas:
   - Tarjeta: `rounded-2xl border border-border bg-surface p-4 shadow-card`.
   - Tarjeta destacada: la tarjeta con `bg-featured` en lugar de `bg-surface`.
   - Tarjeta enlazada (el `<Link>` es la tarjeta): la tarjeta más `transition duration-200
     ease-out hover:-translate-y-0.5 hover:shadow-raised motion-reduce:transition-none
     motion-reduce:hover:translate-y-0` y el foco `focus-visible:outline-2
     focus-visible:outline-offset-2 focus-visible:outline-foreground`.
   - Vidrio: `border border-glass-border bg-glass backdrop-blur-md`; sólo en la cabecera y en el
     buscador grande (`SearchForm` tamaño `"lg"`). Ninguna tarjeta lleva `backdrop-blur`.
   - Chip de categoría: `inline-flex h-9 items-center gap-1.5 rounded-full border border-border
     bg-surface px-3 text-sm font-medium text-foreground shadow-card transition-colors
     duration-150 hover:bg-muted motion-reduce:transition-none` más el foco.
   - Precio en USD: `text-xl font-bold text-foreground`; en Bs: `text-sm text-foreground`.
   - Títulos: `h1` `text-3xl font-bold tracking-tight` (el del inicio `text-3xl font-bold
     tracking-tight sm:text-5xl`); `h2` `text-xl font-bold tracking-tight`.
   - Imagen dentro de tarjeta: `rounded-xl`.
4. **Íconos sólo de `lucide-react`**, importados por nombre (`import { MapPin } from
   "lucide-react"`), tamaño por clase (`size-4`, `size-5`), con `aria-hidden="true"` explícito
   cuando son decorativos. Un control sólo con ícono lleva `aria-label`. Ningún `<svg>` a mano.
5. **Contraste AA y foco** (`ui.md` regla 5): texto sobre `bg-primary` es `text-primary-foreground`;
   foco en `outline-foreground`; controles de formulario con `border-input-border`.
6. **Primitivas sin estado** (`ui.md` regla 1) y **Server Components por defecto**
   (`.claude/rules/app-router.md` regla 4): el único Client Component nuevo es `HeaderSearchSlot`.
7. **Montos sólo por `lib/format.ts`** (`app-router.md` regla 6).
8. **Ningún `<Suspense>` ni `loading.tsx` envuelve `{children}` del layout** (`.claude/rules/seo.md`
   regla 7): el 404 de `/p` y `/tienda` se resuelve fuera de toda frontera.
9. **Movimiento**: 150 a 200 ms, `ease-out`, y todo con su variante `motion-reduce:` que lo quita.
10. **Commits en `main`**, conventional commit en español, sin atribución ni `Co-Authored-By`,
    sin push.

## Repos y ramas

Todo en `posven-ecommerce`, árbol `C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce`,
rama `main` (el usuario trabaja directo sobre `main`). Sin push.

## Identificadores que estrena

Ninguno.

## Mapa de archivos

| Archivo | Responde de | Tarea |
|---|---|---|
| `package.json`, `package-lock.json` | dependencia `lucide-react` | 1 |
| `app/globals.css` | tokens, degradado de fondo, sombra de cabecera al desplazar | 1 |
| `app/layout.tsx` | fuente Plus Jakarta Sans, cabecera fija de vidrio, pie | 1 |
| `components/ui/button.tsx`, `input.tsx`, `card.tsx`, `badge.tsx`, `skeleton.tsx` | primitivas con la forma nueva | 1 |
| `features/search/SearchForm.tsx` | tamaños `"lg"` (vidrio) y `"sm"` (cabecera) | 1 |
| `features/search/HeaderSearchSlot.tsx` (crea) | oculta el buscador compacto en `/` y `/buscar` | 1 |
| `features/search/HeaderSearchSlot.test.tsx` (crea) | sus casos | 1 |
| `features/search/categoryIcon.ts` (crea) | ícono por categoría raíz | 1 |
| `features/search/categoryIcon.test.ts` (crea) | sus casos | 1 |
| `features/search/ProductThumb.tsx` (crea) | imagen de producto o reemplazo con ícono | 1 |
| `features/search/README.md` | exports y §4 de lo nuevo | 1 |
| `features/location/LocationBar.tsx` | `LocationSummary` y su esqueleto | 1 |
| `features/location/README.md` | exports y §4 de lo nuevo | 1 |
| `docs/CAPABILITIES.md` | índice regenerado | 1 |
| `.claude/rules/ui.md` | reglas 4 y 7 (spec §8) | 1 |
| `app/page.tsx` | hero del inicio | 2 |
| `app/buscar/page.tsx` | página de búsqueda | 2 |
| `features/search/CategoryLinks.tsx`, `EmptyState.tsx`, `FeaturedCard.tsx`, `Pagination.tsx`, `ProductCard.tsx`, `RadiusFilter.tsx`, `SearchResults.tsx` | vistas de búsqueda | 2 |
| `features/location/LocationPicker.tsx` | selector de ubicación | 2 |
| `app/p/[slug]/page.tsx` | ficha de producto | 3 |
| `app/tienda/[slug]/page.tsx` | página de tienda | 3 |
| `features/product/OfferCard.tsx`, `ProductOffers.tsx`, `SortLinks.tsx` | ofertas del producto | 3 |
| `features/store/NearbyStores.tsx`, `StoreCard.tsx`, `StoreHeader.tsx`, `StoreProducts.tsx` | tiendas | 3 |
| `features/events/ContactButtons.tsx` | íconos de contacto | 3 |
| `app/error.tsx`, `app/not-found.tsx` | páginas de error | 3 |

## Composición

- Task 1, base y cabecera: define los tokens, el recetario y las piezas compartidas
  (`categoryIcon`, `ProductThumb`, `HeaderSearchSlot`, `LocationSummary`) que las otras dos
  consumen, y resuelve la cabecera con `usePathname` bajo Cache Components. Va en `opus` con
  `review: yes` (define la interfaz que las vistas consumen). ~17 archivos.
- Task 2, inicio y búsqueda: razón 5, un diff de vistas que no se revisa junto con la base en una
  pasada. `sonnet`. ~10 archivos.
- Task 3, producto, tienda y errores: razón 5, junto a la 2 serían ~23 archivos de vistas en un
  solo diff, cerca del tope de la razón 7 en ligero, y ninguna necesita el diff de la otra.
  `sonnet`. ~13 archivos.

La verificación visual con capturas (spec §9) la hace quien coordina al cerrar, con el panel del
navegador.

### Task 1: Base visual, primitivas y cabecera fija

repo: posven-ecommerce
model: opus
mechanical: no
review: yes
commit: feat(ui): base visual suave con vidrio, primitivas y cabecera fija

Lee antes `.claude/rules/ui.md`, `.claude/rules/app-router.md`, `.claude/rules/seo.md`,
`.claude/rules/tests.md` y `posven/.claude/rules/module-readme.md` (los READMEs de módulo que
tocas). Guía de Next: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-pathname.md`
("Cache Components") y la de `next/font`.

**Produce**

- `categoryIcon(category: Category | null): LucideIcon` en `features/search/categoryIcon.ts`
  (`Category` de `lib/marketplace/schemas.ts`, `LucideIcon` de `lucide-react`). Toma la raíz como
  `category.parent_slug ?? category.slug` y devuelve el ícono del mapa; `Package` para `null` o
  raíz sin mapeo. Mapa exacto: `salud-y-medicamentos` `Pill`, `cuidado-personal` `Sparkles`,
  `bebes-y-maternidad` `Baby`, `alimentos` `ShoppingBasket`, `bebidas` `CupSoda`,
  `hogar-y-limpieza` `SprayCan`, `mascotas` `PawPrint`, `ferreteria` `Wrench`, `tecnologia`
  `Smartphone`, `papeleria` `Pencil`, `otros` `Package`.
- `ProductThumb({ imageUrl, category, size }: { imageUrl: string | null; category: Category |
  null; size: "md" | "lg" })` en `features/search/ProductThumb.tsx`, Server Component sin estado.
  Con `imageUrl`: `next/image` con `alt=""`, `object-contain rounded-xl`; `"md"` 96x96 (`size-24`),
  `"lg"` 320x320 (`size-64 sm:size-80`). Sin `imageUrl`: `<div aria-hidden="true">` con
  `flex shrink-0 items-center justify-center rounded-xl bg-primary-soft text-warning` y el ícono de
  `categoryIcon(category)` en `size-10` (`"md"`) o `size-20` (`"lg"`), del mismo tamaño de caja.
- `SearchForm({ defaultQuery, size = "lg" }: { defaultQuery?: string; size?: "lg" | "sm" })`.
  Mismo `<Form action="/buscar" role="search">`, mismo `Input name="q" type="search"
  aria-label="Buscar productos"`, mismo placeholder y botón de texto "Buscar" con el ícono
  `Search` (`size-4`, `aria-hidden`) delante. `"lg"`: el formulario es vidrio (Restricción 3) con
  `rounded-2xl p-2 shadow-card`. `"sm"`: sin vidrio propio (la cabecera ya lo es), input y botón
  de 36 px (`h-9 text-sm` en el input, `size="sm"` en el botón).
- `HeaderSearchSlot({ children }: { children: React.ReactNode })` en
  `features/search/HeaderSearchSlot.tsx`, `"use client"`, lee `usePathname()` y devuelve `null`
  si la ruta es `/` o empieza por `/buscar`; si no, `<div className="flex w-full items-center
  gap-3 sm:w-auto sm:flex-1">{children}</div>`.
- `LocationSummary(): Promise<React.JSX.Element>` y `LocationSummarySkeleton()` en
  `features/location/LocationBar.tsx`. `LocationSummary` usa `getEffectiveLocation()` y pinta
  `<p className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">` con `MapPin`
  (`size-4`, `aria-hidden`) y "Cerca de: {name}", o "Sin ubicación" si `name` es `null`. El
  esqueleto es `<Skeleton className="h-5 w-32" />`.

**Consume**: `getEffectiveLocation()` (`features/location/server.ts:11`), `Category`
(`lib/marketplace/schemas.ts`), `SITE_NAME` (`lib/site.ts`).

**Archivos**

- modifica: `package.json`, `package-lock.json` con
  `npm --prefix "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce" install lucide-react@^1.48.0`
  (aprobada por el usuario; ninguna otra dependencia).
- modifica: `app/globals.css:1-35`
- modifica: `app/layout.tsx:1-62`
- modifica: `components/ui/button.tsx:1-35`, `input.tsx:1-17`, `card.tsx:1-11`, `badge.tsx:1-25`,
  `skeleton.tsx:1-8`
- modifica: `features/search/SearchForm.tsx:1-18`
- crea: `features/search/HeaderSearchSlot.tsx`, `features/search/categoryIcon.ts`,
  `features/search/ProductThumb.tsx`
- modifica: `features/location/LocationBar.tsx:1-13`
- modifica: `features/search/README.md` (`exports`, §4, capacidad de `SearchForm` con su `input`
  nuevo, `verified_against`) y `features/location/README.md` (`exports`, §4, `verified_against`);
  después `node "C:/Users/Windows 11/Documents/Development/posven/.claude/scripts/generate-index.mjs" "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce"`
  y `docs/CAPABILITIES.md` en el mismo commit.
- modifica: `.claude/rules/ui.md` reglas 4 y 7.
- test: `features/search/categoryIcon.test.ts`, `features/search/HeaderSearchSlot.test.tsx`

**Valores exactos**

- `app/globals.css`, `:root` (se conservan `--primary` `#f7900a`, `--primary-hover` `#db820e`,
  `--primary-foreground` `#262627`, `--foreground` `#262627`, `--muted-foreground` `#595959`,
  `--input-border` `#8c8c8c`, `--featured` `#fff4e5`, `--warning` `#8a4b00`): `--background`
  `#fffaf3`, `--muted` `#f7efe4`, `--border` `#efe3d3`, `--surface` `rgb(255 255 255 / 0.92)`,
  `--glass` `rgb(255 255 255 / 0.72)`, `--glass-border` `rgb(255 255 255 / 0.9)`,
  `--primary-soft` `#fde3c0`, `--elevation-card` `0 1px 2px rgb(38 38 39 / 0.04), 0 8px 24px
  rgb(138 75 0 / 0.08)`, `--elevation-raised` `0 2px 4px rgb(38 38 39 / 0.05), 0 16px 32px
  rgb(138 75 0 / 0.12)`. Las sombras se llaman `--elevation-*` en `:root` porque en `@theme
  inline` `--shadow-card: var(--shadow-card)` sería circular.
- `@theme inline`: `--color-surface`, `--color-glass`, `--color-glass-border`,
  `--color-primary-soft` desde sus variables; `--shadow-card: var(--elevation-card)`,
  `--shadow-raised: var(--elevation-raised)`; `--font-sans: var(--font-sans-brand)` en lugar de
  `var(--font-geist-sans)`.
- Degradado: `body::before` con `content: ""`, `position: fixed`, `inset: 0`, `z-index: -1`,
  `pointer-events: none`, `background: radial-gradient(60% 50% at 0% 0%, #ffe6c7, transparent),
  radial-gradient(50% 40% at 100% 0%, #ffe4dc, transparent), var(--background)`. `body` conserva
  `background: var(--background)` y suma `isolation: isolate` para que la capa quede detrás.
- Sombra de la cabecera al desplazar (spec §3, `--shadow-raised`): clase `header-elevate` en
  `globals.css` con `@keyframes header-elevate { to { box-shadow: var(--elevation-raised); } }`,
  `animation: header-elevate linear both`, `animation-timeline: scroll()`, `animation-range: 0
  64px`, dentro de `@supports (animation-timeline: scroll())`. Sin JavaScript; sin soporte, la
  cabecera queda sin sombra.
- Fuente: `Plus_Jakarta_Sans` de `next/font/google`, `variable: "--font-sans-brand"`,
  `subsets: ["latin"]`, en la clase de `<html>` en lugar de Geist.
- Cabecera en `app/layout.tsx`: `<header className="header-elevate sticky top-0 z-40 border-b
  border-glass-border bg-glass backdrop-blur-md">` con un contenedor `mx-auto flex min-h-14
  w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2`: el enlace de marca
  `text-xl font-bold tracking-tight text-foreground` con `SITE_NAME`, y
  `<Suspense fallback={null}><HeaderSearchSlot><SearchForm size="sm" /><Suspense
  fallback={<LocationSummarySkeleton />}><LocationSummary /></Suspense></HeaderSearchSlot></Suspense>`.
  El `<Suspense>` exterior existe porque `usePathname` suspende en `/p/[slug]` y
  `/tienda/[slug]` (parámetros de respaldo). `<main>` y el pie siguen fuera de toda frontera
  (Restricción 8). Pie: `border-t border-border bg-surface`, mismos enlaces.
- `Button`: base `rounded-xl` y `transition duration-150 ease-out motion-reduce:transition-none`;
  `primary` suma `shadow-card`; `secondary` usa `bg-surface` en lugar de `bg-background`.
- `Input`: `rounded-xl bg-surface` en lugar de `rounded-md bg-background`.
- `Card`: la tarjeta del recetario (Restricción 3).
- `Badge`: sin cambios de forma; `featured` conserva `bg-primary text-primary-foreground`.
- `Skeleton`: `animate-pulse rounded-xl bg-muted motion-reduce:animate-none`.
- `ui.md` regla 4: suma a la lista `bg-surface`, `bg-glass`, `border-glass-border`,
  `bg-primary-soft`, `shadow-card`, `shadow-raised`, y agrega "El desenfoque va sólo en la
  cabecera y en el buscador grande; las tarjetas usan `bg-surface` sin desenfoque." Regla 7:
  "**Íconos sólo de `lucide-react`**, importados por nombre, con `aria-hidden` en lo decorativo;
  otras dependencias de componentes (shadcn, Radix, Headless UI) no entran sin aprobación de quien
  coordina." El resto de la regla no cambia.

**Tests**

- `categoryIcon.test.ts`: una hija (`parent_slug: "salud-y-medicamentos"`) devuelve `Pill`; una
  raíz `bebidas` devuelve `CupSoda`; `null` devuelve `Package`; una raíz sin mapeo
  (`"juguetes"`) devuelve `Package`.
- `HeaderSearchSlot.test.tsx` (`vi.mock("next/navigation")` con `usePathname`, `cleanup()` en
  `afterEach`, `.claude/rules/tests.md` reglas 4 y 8): en `/` y en `/buscar` no pinta sus hijos;
  en `/p/acetaminofen-500-mg-20-tabletas` los pinta.

**Verificación**

```bash
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/tsc" --noEmit -p "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/tsconfig.json"
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/eslint" --config "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/eslint.config.mjs" <archivos tocados>
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/vitest" run --root "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce"
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/next" build "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce"
```

El build corre con el servidor de desarrollo detenido (lo detiene quien coordina antes de
despachar) y no deja avisos `blocking-route` ni `blocking-prerender-client-hook`.

**Terminada cuando** los cuatro comandos pasan, `generate-index.mjs` no deja cambios sin
commitear y el commit contiene sólo los archivos de esta tarea.

### Task 2: Inicio y búsqueda con el estilo nuevo

repo: posven-ecommerce
model: sonnet
mechanical: no
commit: feat(ui): inicio y búsqueda con el estilo suave con vidrio

Lee antes `.claude/rules/ui.md` (ya enmendada) y `.claude/rules/app-router.md`. Las piezas de la
base existen: la tarjeta del recetario en `Card`, `SearchForm` con `size`, `ProductThumb`,
`categoryIcon` y los tokens `bg-surface`, `bg-glass`, `bg-primary-soft`, `shadow-card`,
`shadow-raised`.

**Consume**: `ProductThumb({ imageUrl, category, size })` y `categoryIcon(category)` de
`features/search/`, `SearchForm` con `size = "lg"` por defecto, el recetario de la Restricción 3.

**Archivos**

- modifica: `app/page.tsx:1-39`, `app/buscar/page.tsx:1-46`
- modifica: `features/search/CategoryLinks.tsx:1-22`, `EmptyState.tsx:1-79`,
  `FeaturedCard.tsx:1-25`, `Pagination.tsx:1-29`, `ProductCard.tsx:1-56`, `RadiusFilter.tsx:1-47`,
  `SearchResults.tsx:1-67`
- modifica: `features/location/LocationPicker.tsx:1-195` (sólo clases)

**Valores exactos**

- Inicio: la sección del hero con `flex flex-col gap-5 py-6 sm:py-10`; el `h1` conserva su texto
  ("Encuentra lo que buscas en tiendas cerca de ti") con `text-3xl font-bold tracking-tight
  sm:text-5xl`; la descripción `text-lg text-muted-foreground`; `SearchForm` sin props (tamaño
  `"lg"`). Los `h2` de sección con el título del recetario.
- `CategoryLinks`: cada enlace es el chip del recetario con el ícono de `categoryIcon(category)`
  (`size-4`, `aria-hidden`) delante del nombre; el nombre accesible sigue siendo el nombre de la
  categoría.
- `ProductCard`: el `<Link>` es la tarjeta enlazada del recetario; el cuadro de la inicial se
  reemplaza por `<ProductThumb imageUrl={item.image_url} category={item.category} size="md" />`;
  precio en USD y Bs con las clases del recetario. Los textos ("Desde", "En N tiendas", "Fuera de
  tu zona", "Requiere récipe") no cambian.
- `FeaturedCard`: tarjeta enlazada con `bg-featured` y `ProductThumb` `"md"` a la izquierda del
  texto; la insignia "Destacado" se queda.
- `SearchResults`, `Pagination`, `RadiusFilter`, `EmptyState`: sólo radios, tokens y recetario; los
  enlaces con forma de botón siguen con `buttonClasses`.
- `LocationPicker`: `selectClasses` pasa de `rounded-md bg-background` a `rounded-xl bg-surface`;
  el resto de su lógica y textos no cambia.

**Tests**: ninguno nuevo; los existentes de `features/search` y `features/location` pasan sin
editarse.

**Verificación**

```bash
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/tsc" --noEmit -p "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/tsconfig.json"
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/eslint" --config "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/eslint.config.mjs" <archivos tocados>
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/vitest" run --root "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce" features/search features/location
```

**Terminada cuando** los tres comandos pasan, ninguna clase usa hex ni `backdrop-blur` fuera de
`SearchForm` y el commit contiene sólo los archivos de esta tarea.

### Task 3: Producto, tienda y errores con el estilo nuevo

repo: posven-ecommerce
model: sonnet
mechanical: no
commit: feat(ui): producto, tienda y páginas de error con el estilo suave con vidrio

Lee antes `.claude/rules/ui.md` (ya enmendada), `.claude/rules/app-router.md` y
`.claude/rules/seo.md` (regla 7: no agregues `<Suspense>` ni `loading.tsx` por encima de la
página). Las piezas de la base existen: la tarjeta del recetario en `Card`, `ProductThumb`,
`categoryIcon` y los tokens `bg-surface`, `bg-primary-soft`, `shadow-card`, `shadow-raised`.

**Consume**: `ProductThumb({ imageUrl, category, size })` de `features/search/ProductThumb.tsx`,
`storeInitials` (`features/store/initials.ts`), el recetario de la Restricción 3.

**Archivos**

- modifica: `app/p/[slug]/page.tsx:1-132` (imports y el cuerpo que pinta desde la línea 71; `generateStaticParams`,
  `generateMetadata`, `loadProduct` y el JSON-LD no se tocan)
- modifica: `app/tienda/[slug]/page.tsx:1-61` (sólo clases)
- modifica: `features/product/OfferCard.tsx:1-48`, `ProductOffers.tsx:1-89`, `SortLinks.tsx:1-28`
- modifica: `features/store/NearbyStores.tsx:1-55`, `StoreCard.tsx:1-50`, `StoreHeader.tsx:1-58`,
  `StoreProducts.tsx:1-117`
- modifica: `features/events/ContactButtons.tsx:1-58`
- modifica: `app/error.tsx:1-21`, `app/not-found.tsx:1-13`

**Valores exactos**

- Ficha de producto: el cuadro gris sin imagen y la imagen se reemplazan por `<ProductThumb
  imageUrl={product.image_url} category={product.category} size="lg" />`; el `h1` con el título
  del recetario; la lista de atributos dentro de una tarjeta del recetario.
- `OfferCard` y la tarjeta de `StoreProducts`: `Card` (ya trae el recetario), precios con sus
  clases del recetario.
- `StoreCard`: tarjeta enlazada del recetario (destacada con `bg-featured` si `is_premium`); el
  círculo de iniciales pasa a `rounded-full bg-primary-soft text-warning font-bold`; logo con
  `rounded-full`. No agrega ningún elemento con rol `img` cuando no hay logo
  (`StoreCard.test.tsx` lo comprueba).
- `StoreHeader`: portada `rounded-2xl`; iniciales sin logo con el mismo tinte que `StoreCard`; el
  `h1` con el título del recetario.
- `ContactButtons`: íconos `MessageCircle` (WhatsApp), `Phone` (llamar) y `Navigation` (ver ruta),
  `size-4`, `aria-hidden`, delante del texto; los textos y nombres accesibles ("WhatsApp de ...",
  etc.) no cambian.
- `app/error.tsx` y `app/not-found.tsx`: la sección dentro de una tarjeta del recetario con `p-8`,
  el `h1` con el título del recetario; textos, `retry()` y `noindex` sin cambios.

**Tests**: ninguno nuevo; los existentes de `features/product`, `features/store` y
`features/events` pasan sin editarse.

**Verificación**

```bash
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/tsc" --noEmit -p "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/tsconfig.json"
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/eslint" --config "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/eslint.config.mjs" <archivos tocados>
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/vitest" run --root "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce" features/product features/store features/events
```

**Terminada cuando** los tres comandos pasan, ninguna clase usa hex ni `backdrop-blur` y el commit
contiene sólo los archivos de esta tarea.

## Cierre

### Pendientes del cierre

Vacío. Lo que quedó abierto está en §4 de `2026-09-28-visual-moderna-resultado.md` como deuda
declarada; las diferencias contra el diseño quedaron escritas en la spec y en
`.claude/rules/app-router.md` y `.claude/rules/ui.md`.
