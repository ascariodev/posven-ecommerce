# Plan 1 de shadcn Mercado: primitivas de shadcn y migración de sus usos

modo: ligero

## Contexto

El ecommerce pasa a shadcn/ui como base de componentes (spec `2026-09-29-ecommerce-shadcn-mercado-design.md`,
aprobada). Este plan es la fila 1 de su §6: reemplaza las cinco primitivas propias
(`components/ui/{button,badge,card,input,skeleton}.tsx`) por las de shadcn y migra sus usos, sin
rediseñar ninguna pantalla. Desbloquea los planes 2 (inicio y búsqueda en dirección C) y 3 (ficha),
que ya parten de la librería.

Queda afuera: las pantallas de la dirección C, `carousel`, `sheet`, `select`, `tabs` y `toggle-group`
(planes 2 y 3), borrar `/preview` y `components/preview-ui/` (plan 2), y todo campo nuevo del
contrato. El plan de cuentas (plan 2 de cuentas) ya está en `main`, de donde sale esta rama: los
archivos de `features/account` y `app/cuenta` se migran aquí sin conflicto pendiente.

## Spec

`docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md`: §2 (decisiones: primitivas
reemplazadas, `cx.ts`, `buttonClasses` e `inputSize` eliminados, paleta en `globals.css`), §3 (tema
y altura táctil de 44 px), §5 (estrategia de migración y mapeo de variantes), §6 fila 1, §7 (la
regla `ui.md` se reescribe al cerrar este plan).

## Restricciones globales

1. **Sin cambio de aspecto que no esté enumerado.** Es una migración de API. Diferencias
   permitidas: `Card` pasa de `bg-surface` a `bg-card` (blanco opaco), `Badge` mide `h-6`, el
   botón primario conserva `shadow-card`. Cualquier otra diferencia visible se reporta, no se
   decide.
2. **Alturas táctiles**: `Button` por defecto `h-11` (44 px) y `sm` `h-9`; `Input` `h-11`; el
   texto del botón por defecto y del input es `text-base` (16 px, sin `md:text-sm`).
3. **Foco visible por outline en `--foreground`**, como hoy (`ui.md` 5): en `button.tsx` e
   `input.tsx` van `focus-visible:outline-2 focus-visible:outline-offset-2
   focus-visible:outline-foreground` y NO va `outline-none` ni el `ring` de shadcn. En Tailwind v4
   `outline-none` fija el estilo del outline a `none` y anula al `outline-2` del foco.
4. **Colores sólo por tokens** de `app/globals.css` (`bg-primary`, `bg-card`, `bg-muted`,
   `border-border`, `border-input`, `bg-featured`, `text-warning`, ...). Ni hex ni `zinc-*`, `black`
   o `white`. No se crea ningún token nuevo.
5. **`Button` con `type="button"` por defecto** cuando renderiza `<button>` (hoy lo hace la
   primitiva propia; el de shadcn no): un botón dentro de un `<form>` sin `type` enviaría el
   formulario.
6. **Server Components**: las cinco primitivas no llevan `'use client'` ni hooks. `Slot` de
   `radix-ui` (para `asChild`) está permitido.
7. **Utilidad de clases**: `cn` de `@/lib/utils` (ya existe y resuelve conflictos de Tailwind:
   `cn("h-11 text-base w-full", "h-9 text-sm")` da `"w-full h-9 text-sm"`). Desaparece `cx`.
8. **Íconos sólo de `lucide-react`**; nombre accesible en todo control, `aria-hidden` en lo
   decorativo (`ui.md` 6).
9. **No se toca** `app/preview/`, `components/preview-ui/`, `app/globals.css` ni `components.json`.
10. **Sin pruebas nuevas** (`tests.md` 6): las existentes deben seguir pasando sin editarlas; si una
    falla por la migración, se ajusta su consulta y se reporta.
11. Commit por tarea con el `commit:` de su cabecera, sin atribución, sin push.

## Repos y ramas

Todo en `posven-ecommerce`, árbol `C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce`,
rama `feat/ui-shadcn-mercado` (ya creada desde `main`; HEAD `eb7249a`, el commit de la spec). Sin
push ni merge. Ninguna tarea toca otro repo.

## Identificadores que estrena

Ninguno. Se retira `L-01` de `docs/conventions/lessons.md` en la Task 3 (queda obsoleta: `cx`
desaparece y `cn` resuelve conflictos).

## Mapa de archivos

Task 1 (28 archivos; el grafo `graphify-out` está desfasado y lista consumidores que ya no usan
las primitivas, este mapa sale de `grep`):

- Reemplaza: `components/ui/button.tsx`, `components/ui/badge.tsx`, `components/ui/input.tsx`,
  `components/ui/skeleton.tsx`. Borra: `components/ui/cx.ts`.
- `buttonClasses`, `Button variant`, `Badge variant`, `inputSize` o `cx` en: `app/cuenta/layout.tsx`,
  `app/cuenta/page.tsx` (sólo `cx`), `app/cuenta/direcciones/page.tsx`, `app/cuenta/favoritos/page.tsx`,
  `app/not-found.tsx`, `features/account/{AccountMenu,AddressForm,FavoriteButton,SettingsForms,VerifyEmailForm}.tsx`,
  `features/events/ContactButtons.tsx`, `features/location/LocationPicker.tsx`,
  `features/product/{OfferCard,SortLinks}.tsx`,
  `features/search/{EmptyState,FeaturedCard,Pagination,ProductCard,ProductThumb,RadiusFilter,SearchForm}.tsx`,
  `features/store/{StoreCard,StoreProducts}.tsx`.
- Sin edición (el defecto de la primitiva nueva coincide): los `<Button type="submit">` sin
  variante, `app/error.tsx`, `app/p/[slug]/page.tsx` (`Badge variant="warning"`), los `Skeleton`.

Task 2 (15 archivos): `components/ui/card.tsx` (reemplaza) y los 14 con `<Card>`:
`app/cuenta/{configuracion,direcciones,favoritos,perfil}/page.tsx`, `app/cuenta/page.tsx`,
`app/entrar/page.tsx`, `app/registro/page.tsx`, `app/recuperar/page.tsx`,
`app/restablecer/[token]/page.tsx`, `app/verificar/[token]/page.tsx`, `app/p/[slug]/page.tsx`,
`features/product/OfferCard.tsx`, `features/search/SearchResults.tsx`, `features/store/StoreProducts.tsx`.

Task 3 (2 archivos): `.claude/rules/ui.md` (reescribe), `docs/conventions/lessons.md` (retira L-01).

## Composición

- Task 1, primitivas y API de botón, insignia, input y esqueleto (`opus`, `review: yes`): define el
  contrato de las primitivas que consume el resto y decide las adaptaciones (foco, tipo, alturas).
  Razón 3 del modo ligero (define contrato). 28 archivos, en advertencia de tamaño: el diff por
  archivo es de una a tres líneas y sale como `review-package`.
- Task 2, `Card` y su contenido (`sonnet`): la primitiva cambia de forma (sin padding horizontal,
  con `CardContent`) y cada uso se reacomoda. Se corta de la 1 porque es lo único que altera
  estructura y no sólo nombres de props. 15 archivos.
- Task 3, reglas y cierre (`sonnet`): reescribe `ui.md`, retira `L-01` y corre la build y el
  standalone. Razón 2 (documentación de cierre) y verificación final. 2 archivos.

Costuras: la Task 1 deja `buttonVariants` exportado de `components/ui/button.tsx` (lo usan los
planes 2 y 3 sobre `<Link>`) y `Badge` con las variantes `default`, `secondary`, `outline`,
`destructive` y `warning`; la Task 2 deja `Card` y `CardContent` (más `CardHeader`, `CardTitle`,
`CardDescription`, `CardAction`, `CardFooter` de la generación). Entre el commit de la 1 y el de la
2 las tarjetas pierden su padding horizontal: las dos van en la misma rama sin publicarse aparte.

### Task 1: Primitivas de shadcn y migración de su API

repo: posven-ecommerce
model: opus
mechanical: no
review: yes
commit: feat(ui): primitivas de shadcn y migración de sus usos

Lee antes `.claude/rules/ui.md` (sus ítems 1, 3 y 7 dejan de regir por la spec §7; los demás
sí), `.claude/rules/app-router.md`, `docs/conventions/lessons.md` y las Restricciones globales. Los
archivos de `components/` los gobierna `ui.md`; crearlos no la dispara.

**Produce**

- `components/ui/button.tsx`: `Button` y `buttonVariants` (cva), variantes `default`, `outline`,
  `secondary`, `ghost`, `destructive`, `link`; tamaños `default`, `sm`, `lg`, `icon`; prop `asChild`.
- `components/ui/badge.tsx`: `Badge` y `badgeVariants`, variantes `default`, `secondary`,
  `destructive`, `outline`, `warning`.
- `components/ui/input.tsx`: `Input` sin prop de tamaño.
- `components/ui/skeleton.tsx`: `Skeleton`, con `aria-hidden="true"`.

**Consume**: `cn` de `@/lib/utils`, `class-variance-authority`, `Slot` de `radix-ui`.

**Cómo se generan.** Punto de partida: `components/preview-ui/{button,badge,input}.tsx` (ya
generados por el CLI y ajustados a los tokens); se copian a `components/ui/` y se aplican
exactamente las diferencias de abajo. `skeleton.tsx` se genera con
`node_modules/.bin/shadcn add skeleton --overwrite` (cwd del repo; si no hay red, se escribe con
los valores de abajo). Toda importación de `cn` sale de `@/lib/utils`.

**Valores exactos**

`button.tsx`:
- Base: conservar la generada, quitando `outline-none`, `focus-visible:border-ring`,
  `focus-visible:ring-3` y `focus-visible:ring-ring/50`, y añadiendo `rounded-xl`,
  `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground` y
  `motion-reduce:transition-none`.
- `default`: `bg-primary text-primary-foreground shadow-card hover:bg-primary-hover`.
- `outline`: `border-border bg-surface text-foreground hover:bg-muted`.
- `secondary`, `ghost`, `destructive`, `link`: los generados, sin tocar.
- Tamaños: `default` `h-11 gap-2 px-4 text-base`; `sm` `h-9 gap-1.5 px-3 text-sm`; `lg`
  `h-12 gap-2 px-6 text-base`; `icon` `size-11`. Se eliminan `xs`, `icon-xs`, `icon-sm`, `icon-lg`.
- `Button` recibe `type = "button"` y lo pasa al elemento sólo cuando no es `asChild`.

`badge.tsx`: base generada tal cual; variante nueva `warning`: `bg-featured text-warning`.
Se elimina `ghost` y `link`.

`input.tsx`: base generada más `bg-card`, sin `md:text-sm`, sin `outline-none`, sin
`focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`, con las tres clases de
foco de la Restricción 3; conserva `h-11`, `text-base`, `border-input`.

`skeleton.tsx`: `cn("animate-pulse rounded-xl bg-muted motion-reduce:animate-none", className)`,
`aria-hidden="true"` y `data-slot="skeleton"`, props de `div` repartidas.

**Migración de usos** (mapeo de la spec §5):
- `Button variant="primary"` o sin variante: sin cambio. `variant="secondary"` pasa a
  `variant="outline"`. `size="md"` se elimina (`size="sm"` queda). Ojo: `secondary` sigue siendo una
  variante válida en la primitiva nueva pero con otro significado; ningún `Button` debe quedar con
  ella.
- `buttonClasses("primary")` pasa a `buttonVariants()`; `buttonClasses("primary", "sm")` a
  `buttonVariants({ size: "sm" })`; `buttonClasses("secondary"[, "sm"])` a
  `buttonVariants({ variant: "outline"[, size: "sm"] })`; con condición
  (`SortLinks`, `RadiusFilter`): `buttonVariants({ variant: cond ? "default" : "outline", size: "sm" })`.
  Cuando iba envuelto en `cx(buttonClasses(...), "<extra>")`, el extra va en `className` de
  `buttonVariants` (sólo utilidades que no chocan con la variante: `self-start`,
  `cursor-pointer list-none [&::-webkit-details-marker]:hidden`).
- `Badge`: sin variante (era `neutral`) pasa a `variant="secondary"` (`direcciones/page.tsx`,
  `ProductCard.tsx`, `StoreCard.tsx`); `variant="featured"` pasa a `variant="default"`
  (`OfferCard.tsx`, `FeaturedCard.tsx`, `StoreCard.tsx`); `variant="warning"` no cambia.
- `Input inputSize={large ? "md" : "sm"}` (`SearchForm.tsx`) pasa a
  `className={large ? undefined : "h-9 text-sm"}`; el `Button size={large ? "md" : "sm"}` de ese
  archivo pasa a `size={large ? "default" : "sm"}`.
- `cx(...)` pasa a `cn(...)` de `@/lib/utils` en `app/cuenta/page.tsx`, `AccountMenu.tsx`,
  `FavoriteButton.tsx`, `ProductThumb.tsx`, `SearchForm.tsx` y `StoreCard.tsx`; luego se borra
  `components/ui/cx.ts`.

**Tests**: ninguno nuevo. Deben seguir pasando `features/account/AccountMenu.test.tsx`,
`features/events/ContactButtons.test.tsx`, `features/location/LocationPicker.test.tsx`,
`features/search/{EmptyState,ProductCard,RadiusFilter,SearchResults}.test.tsx`,
`features/store/{StoreCard,StoreProducts}.test.tsx` y `features/product/ProductOffers.test.tsx`.

**Verificación** (rutas absolutas, sin `cd`):

```bash
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/tsc" --noEmit -p "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/tsconfig.json"
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/eslint" "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/components/ui" "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/app" "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/features"
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/vitest" run --root "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce"
grep -rnE 'variant="(primary|neutral|featured|ghost)"|size="md"|inputSize|buttonClasses|components/ui/cx|\bcx\(' "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/app" "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/features" "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/components/ui"
grep -rn 'variant="secondary"' "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/app" "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/features"
grep -n "outline-none" "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/components/ui/button.tsx" "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/components/ui/input.tsx"
```

Esperado: `tsc`, `eslint` y `vitest` sin errores ni fallos; el primer `grep` sin salida; el segundo
sólo con líneas de `<Badge`; el tercero sin salida.

**Terminada cuando** lo anterior da lo esperado, `components/ui/cx.ts` ya no existe, ningún `Button`
conserva `variant="secondary"`, `button.tsx` exporta `buttonVariants`, y el commit contiene sólo los
28 archivos de esta tarea.

### Task 2: Card de shadcn y su contenido

repo: posven-ecommerce
model: sonnet
mechanical: no
commit: feat(ui): Card de shadcn con CardContent en sus usos

Lee antes `.claude/rules/ui.md` y las Restricciones globales.

**Produce**: `components/ui/card.tsx` con `Card`, `CardHeader`, `CardTitle`, `CardDescription`,
`CardAction`, `CardContent` y `CardFooter`.

**Cómo se genera.** Se copia `components/preview-ui/card.tsx` a `components/ui/card.tsx` sin
cambios (ya lleva `bg-card`, `border-border`, `shadow-card`, `rounded-2xl`, `py-(--card-spacing)`).
Su importación de `cn` debe salir de `@/lib/utils`.

**Migración de los 19 usos.** El `Card` de shadcn no tiene padding horizontal; lo da `CardContent`
(`px-(--card-spacing)`, 16 px, igual al `p-4` anterior). Cada
`<Card className="X">hijos</Card>` pasa a `<Card><CardContent className="X">hijos</CardContent></Card>`
con estas reglas:
- Las utilidades de layout (`flex`, `flex-col`, `items-*`, `justify-*`, `gap-*`) van a `CardContent`.
- `h-full` se queda en `Card`, y `CardContent` recibe además `flex-1` (`OfferCard.tsx`,
  `StoreProducts.tsx`).
- Un `<Card>` sin `className` queda `<Card><CardContent>hijos</CardContent></Card>`.
- Importar `CardContent` junto a `Card` desde `@/components/ui/card`.
Sitios: `app/cuenta/configuracion/page.tsx` (3), `app/cuenta/direcciones/page.tsx` (2),
`app/cuenta/favoritos/page.tsx` (2), `app/cuenta/page.tsx` (2), `app/cuenta/perfil/page.tsx`,
`app/entrar/page.tsx`, `app/registro/page.tsx`, `app/recuperar/page.tsx`,
`app/restablecer/[token]/page.tsx`, `app/verificar/[token]/page.tsx`, `app/p/[slug]/page.tsx`,
`features/product/OfferCard.tsx`, `features/search/SearchResults.tsx`,
`features/store/StoreProducts.tsx`.

**Tests**: ninguno nuevo; deben seguir pasando `features/search/SearchResults.test.tsx`,
`features/store/StoreProducts.test.tsx` y `features/product/ProductOffers.test.tsx`.

**Verificación**: los comandos `tsc`, `eslint` (sobre `components/ui`, `app`, `features`) y
`vitest run` de la Task 1, más:

```bash
grep -rnE "<Card( |>)" "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/app" "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/features" | grep -v preview
```

Esperado: cada línea `<Card ...>` va seguida en el archivo de `<CardContent` (revisar a ojo los 19).

**Terminada cuando** `tsc`, `eslint` y `vitest` pasan, los 19 usos tienen `CardContent`, ningún
`Card` con `flex-col`/`gap-*` en su propio `className`, y el commit contiene sólo los 15 archivos de
esta tarea.

### Task 3: Reglas de UI, lección y verificación de la build

repo: posven-ecommerce
model: sonnet
mechanical: no
commit: docs(ui): reglas de primitivas con shadcn y retiro de L-01

Lee antes `posven/.claude/rules/docs-authoring.md`, `posven/.claude/rules/lessons-authoring.md` y
`.claude/rules/ui.md`. Un cambio en una regla cae bajo `docs-authoring`.

**Reescribe `.claude/rules/ui.md`** (mismo `paths: components/**`, hasta ~40 líneas) con:
1. Las primitivas viven en `components/ui/` y son las de shadcn (`Button`, `Badge`, `Card`, `Input`,
   `Skeleton`); una nueva se agrega con `shadcn add` y se ajusta a los tokens.
2. Las que no necesitan estado no llevan `'use client'` ni hooks; las interactivas (`sheet`,
   `select`, `tabs`) traen el suyo y se consumen desde Server Components.
3. Clases por `cn` de `@/lib/utils`; un enlace con forma de botón usa `buttonVariants` sobre `<Link>`.
4. Colores sólo por tokens (la lista actual de la regla 4, más `bg-card`, `border-input`), sin
   modo oscuro, desenfoque sólo en cabecera y buscador grande.
5. Contraste AA y foco por outline en `--foreground` (la regla 5 actual, sin cambios), altura táctil
   mínima de 44 px en controles principales.
6. Nombre accesible y `aria-hidden` (regla 6 actual).
7. Íconos de `lucide-react`; shadcn y Radix se permiten; otras librerías de componentes requieren
   aprobación de quien coordina.

**Retira `L-01`** de `docs/conventions/lessons.md` (deja `L-02` intacta). Ejecuta
`node "C:/Users/Windows 11/Documents/Development/posven/.claude/scripts/docs-check.mjs"` y corrige
lo que reporte sobre estos dos archivos.

**Verificación de la build** (en modo simulado; si el servidor de desarrollo del usuario tiene
bloqueado `.next`, se le pide detenerlo y no se borra nada):

```bash
MARKETPLACE_MODE=mock SITE_URL=http://localhost:3000 "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/next" build "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce"
ls "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/.next/standalone/server.js"
ls "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/.next/standalone/node_modules" | grep -E "radix|class-variance-authority|^cn$"
```

Esperado: la build termina sin errores ni el aviso `blocking-route`, `server.js` existe y el
standalone incluye `radix-ui` (o sus paquetes `@radix-ui`), `class-variance-authority` y `cn`. El
e2e de Playwright lo corre el usuario con el puerto 3000 libre; se declara "no corrido" si no.

**Terminada cuando** `ui.md` ya no cita `cx`, `buttonClasses` ni prohíbe shadcn, `L-01` no existe,
`docs-check` no reporta nada de estos archivos, la build y el standalone dan lo esperado y el commit
contiene sólo esos dos archivos.

## Cierre

### Pendientes del cierre
