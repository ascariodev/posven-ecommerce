# Plan 4 de shadcn Mercado: deuda menor de los planes 2 y 3

modo: ligero

## Contexto

Los planes 1, 2 y 3 de la spec `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md` están
cerrados y desplegados (`main` `812085b`). Sus resultados
(`docs/plans/2026-09-30-shadcn-mercado-plan-2-inicio-busqueda-resultado.md` y
`docs/plans/2026-09-30-shadcn-mercado-plan-3-ficha-resultado.md`) dejaron una "Deuda declarada";
este plan cierra la que es de primitivas, altura táctil, ficha y formulario de dirección, siempre
sobre shadcn: cada arreglo va en la primitiva de `components/ui/` o en sus variantes, no en
estilos paralelos.

Queda afuera: la cabecera con su buscador compacto (`SearchForm size="sm"`, plan propio), la barra
de desplazamiento de `CategoryRail`, el comportamiento de `/buscar` (filtro de distancia sin
JavaScript en móvil, pantalla vacía sin chips, subcategoría sin chip activo), las migas visibles
frente al JSON-LD (decisión 4 del plan 3), las páginas del pie, la página de tienda y todo campo
nuevo del contrato.

## Spec

`docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md`: §2 (shadcn como base), §3 (tema,
44 px, foco), §4 precisión 1 del plan 3 (panel de la ficha), §6 (planes).

### Decisiones tomadas al planificar (quien coordina, 2026-09-30)

1. **shadcn es la base de toda la UI**: cada arreglo va en `components/ui/` o usa sus variantes.
2. **`sm` táctil**: el tamaño `sm` de `Button`, `Toggle` y `SelectTrigger` mide 44 px en móvil y
   36 px desde `md` (`h-11 md:h-9`). Las alturas `h-9` escritas a mano en controles pasan a lo
   mismo.
3. **Panel de la ficha sin `sticky`**: con la lista de tiendas debajo, a todo el ancho, el panel
   apenas se movía. La Task 5 corrige la precisión 1 de la spec §4 ("fijo" deja de aplicar).
4. **Ciudad de `AddressForm` con un solo `Select`** agrupado por estado (`SelectGroup` y
   `SelectLabel`), equivalente al `<select>` con `<optgroup>` de hoy; el formulario sigue enviando
   `city_slug`.
5. **"`buttonVariants` sin `cn`" no es deuda**: `buttonVariants` ya pasa por `cn` por dentro
   (`components/ui/button.tsx`), así que los 12 usos sin envolver son correctos. Se cierra como
   "no aplica" y `toggleVariants` se iguala a `buttonVariants`.
6. **`cn` con sombras propias** se resuelve con `createCn` de `cn/config` (el paquete `cn` de
   shadcn que ya usa `lib/utils.ts`), registrando `shadow-card` y `shadow-raised`.

## Restricciones globales

1. **shadcn es la base.** Toda pieza de UI sale de `components/ui/`; una pieza que falte se agrega
   con `shadcn add` y se ajusta a los tokens (`ui.md`).
2. **Colores y sombras sólo por tokens** de `app/globals.css` (`ui.md` 4). Este plan no crea
   tokens.
3. **Foco visible por outline en `--foreground`**, sin `outline-none` ni ring; controles
   principales de al menos 44 px en móvil (`ui.md` 5, decisión 2).
4. **`buttonVariants` y `toggleVariants` pasan por `cn`**; con clases extra,
   `cn(xVariants(...), "extra")`.
5. **El frontend no calcula montos** ni compara precios. **El navegador nunca llama a posveapi.**
6. **Sin cambio de contrato**: `lib/marketplace/` no cambia.
7. **Metadatos, canónicas, JSON-LD y `noindex` no cambian.** Lo que lee `searchParams` o
   `cookies()` sigue dentro de `<Suspense>` (`app-router.md` 2).
8. **Textos y nombres accesibles que el e2e y las pruebas usan se conservan**; la única consulta
   que cambia a propósito es la de la ciudad en `e2e/account.spec.ts` (Task 4). Otra que cambie se
   ajusta y se reporta.
9. **Pruebas**: las existentes siguen pasando. Nuevas, sólo las que pide cada tarea.
10. Commit por tarea con el `commit:` de su cabecera, en español, sin firma ni atribución de
    ningún tipo; autor `Sergio Carrillo <miele.web.developer@gmail.com>`. Push de la rama a
    `gitea` al terminar cada tarea (pedido de quien coordina); nunca a `main` ni a GitHub. Nunca
    `cd`: rutas absolutas y `git -C`. Sin `--no-verify`.

## Repos y ramas

Todo en `posven-ecommerce` (`<repo>` = la raíz del checkout; en la nube,
`/home/user/posven-ecommerce`), rama `feat/ui-shadcn-mercado-deuda`, creada desde `main`
`812085b`. Remoto de trabajo: `gitea`.

## Identificadores que estrena

- `lib/utils.test.ts` (nuevo) y `features/account/AddressForm.test.tsx` (nuevo).
- Ninguno de producto: no hay tokens, rutas ni componentes nuevos. Se quita el tamaño `lg` de
  `ProductThumb` (sin usos).

## Mapa de archivos

- Task 1 (≈8): `lib/utils.ts`, `lib/utils.test.ts` (nuevo), `components/ui/{sheet,select,
  toggle,toggle-group}.tsx`, `.claude/rules/ui.md`.
- Task 2 (≈10): `components/ui/{button,toggle,select}.tsx`, `features/search/{SearchPill,
  CategoryLinks}.tsx`, `features/account/{FavoriteButton,AccountMenu}.tsx` (sólo esqueletos),
  `features/location/LocationBar.tsx` (sólo esqueleto), `.claude/rules/ui.md`.
- Task 3 (≈3): `app/p/[slug]/page.tsx`, `features/search/ProductThumb.tsx`,
  `features/product/PriceSummary.test.tsx`.
- Task 4 (≈3): `features/account/AddressForm.tsx`, `features/account/AddressForm.test.tsx`
  (nuevo), `e2e/account.spec.ts`.
- Task 5 (≈6): spec, `features/{search,account,product}/README.md`, `docs/CAPABILITIES.md` (sólo
  si cambia), `docs/plans/2026-09-30-shadcn-mercado-plan-4-deuda-resultado.md` (nuevo).

## Composición

- Task 1, primitivas y `cn` (`sonnet`, `review: yes`): toca piezas que usan todas las pantallas.
- Task 2, altura táctil (`sonnet`, `review: yes`): cambia la altura de controles en todas las
  pantallas.
- Task 3, ficha (`sonnet`, mecánica).
- Task 4, `AddressForm` con `Select` (`sonnet`, `review: yes`): cambia un control de formulario
  con envío, error y edición.
- Task 5, cierre (`sonnet`): spec, README, índice, build, standalone, e2e y resultado.

Costura: las Tasks 1 y 2 tocan `toggle.tsx` y `select.tsx` en zonas distintas (la 1, la función
`toggleVariants` y `SelectContent`; la 2, el tamaño `sm`) y van en orden. La Task 4 usa
`SelectGroup` y `SelectLabel`, que `select.tsx` ya exporta.

### Task 1: Primitivas de shadcn y `cn` con sombras propias

repo: posven-ecommerce
model: sonnet
mechanical: no
review: yes
commit: fix(ui): primitivas de shadcn con tokens, movimiento reducido y cn con sombras propias

Lee antes `.claude/rules/{ui,tests}.md`, `docs/conventions/lessons.md`, las Restricciones globales
y la sección "Custom themes" de `node_modules/cn/README.md` (API de `cn/config`).

**Produce**

- `lib/utils.ts`: `cn` sale de `createCn` de `cn/config` con `extend.classGroups` que registra
  `shadow-card` y `shadow-raised` en el grupo de sombras, para que `cn("shadow-card",
  "shadow-raised")` deje sólo la última. La firma de `cn` no cambia.
- `components/ui/sheet.tsx`:
  - `SheetContent`: `border-border` en la base (los bordes laterales dejan de ser oscuros);
    `motion-reduce:animate-none` junto a su `motion-reduce:transition-none`; con
    `side="bottom"` o `"top"`, `max-h-[85dvh] overflow-y-auto` (móvil apaisado).
  - `SheetOverlay`: `motion-reduce:animate-none`.
  - `SheetHeader`: `pr-14`, para que un título largo no quede bajo el botón de cerrar (`size-11`
    en `right-2`).
- `components/ui/select.tsx`, `SelectContent`: `shadow-md` pasa a `shadow-raised` y suma
  `motion-reduce:animate-none`.
- `components/ui/toggle-group.tsx`: `ToggleGroup` pasa `orientation` a
  `ToggleGroupPrimitive.Root` (hoy sólo lo escribe en `data-orientation`).
- `components/ui/toggle.tsx`: `toggleVariants` pasa a ser una función que devuelve
  `cn(toggleStyles(options))`, como `buttonVariants`; `Toggle` y los usos existentes
  (`cn(toggleVariants(...), "rounded-full")`) no cambian.
- `.claude/rules/ui.md` regla 3: `buttonVariants` y `toggleVariants` ya pasan por `cn`; sin clases
  extra se usan tal cual, y con clases extra, `cn(xVariants(...), "extra")`.

**Tests**

- Nuevo `lib/utils.test.ts`: `cn("shadow-card", "shadow-raised")` da `"shadow-raised"`;
  `cn("shadow-raised", "shadow-card")` da `"shadow-card"`; `cn("p-2", "p-4")` da `"p-4"` (lo de
  serie sigue funcionando).
- Siguen pasando `components`, `features` y `lib`.

**Verificación**: `tsc`, `eslint` sobre `lib/utils*` y `components/ui`, `vitest run` entero,
`grep -n "shadow-md" "<repo>/components/ui"` sin salida, y `next build` en simulado con exit 0 y
sin `blocking-route`.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los archivos de esta tarea.

### Task 2: Controles `sm` a 44 px en móvil

repo: posven-ecommerce
model: sonnet
mechanical: no
review: yes
commit: fix(ui): controles de tamaño sm a 44 px en móvil

Lee antes `.claude/rules/ui.md` y las Restricciones globales.

**Produce**

- `components/ui/button.tsx`, tamaño `sm`: `h-11 gap-1.5 px-3 text-sm md:h-9`.
- `components/ui/toggle.tsx`, tamaño `sm`: `h-11 px-3 text-sm md:h-9`.
- `components/ui/select.tsx`, `SelectTrigger`: `data-[size=sm]:h-11` y `md:data-[size=sm]:h-9`
  en lugar de `data-[size=sm]:h-9`.
- `features/search/SearchPill.tsx`: la altura `compact` pasa de `h-9` a `h-11 md:h-9`.
- `features/search/CategoryLinks.tsx`: el chip escrito a mano pasa a
  `cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full shadow-card")`,
  conservando su contenido, su icono y su `href`.
- Esqueletos que imitan un control `sm`: `FavoriteButtonSkeleton` (`h-9 w-44`),
  `AccountMenuSkeleton` (`h-9 w-24`) y `LocationBarSkeleton` compacto pasan a `h-11 md:h-9`.
- `.claude/rules/ui.md` regla 5: el tamaño `sm` mide 44 px en móvil y 36 px desde `md`
  (`h-11 md:h-9`); los controles principales, `h-11` siempre.
- `SearchForm size="sm"` (cabecera) no se toca: va en el plan de la cabecera.

**Tests**: siguen pasando todas; ninguna nueva.

**Verificación**: `tsc`, `eslint` sobre `components/ui`, `features/search`, `features/account` y
`features/location`, `vitest run` entero, `grep -rnw "h-9" "<repo>/features" "<repo>/components"
"<repo>/app"` sólo con apariciones `md:h-9` o en `SearchForm.tsx`, y `next build` en simulado con
exit 0 y sin `blocking-route`.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los archivos de esta tarea.

### Task 3: Ficha sin `sticky` y con `sizes` a su columna

repo: posven-ecommerce
model: sonnet
mechanical: yes
commit: fix(ui): ficha sin panel sticky y con sizes ajustado a su columna

Lee antes `.claude/rules/{ui,tests}.md` y la guía de `next/image` en `node_modules/next/dist/docs/`
(`sizes`).

**Produce**

- `app/p/[slug]/page.tsx`: el `Card` del resumen pierde `md:sticky md:top-24`; nada más cambia.
- `features/search/ProductThumb.tsx`: el tamaño `detail` usa
  `sizes="(min-width: 1024px) 540px, (min-width: 768px) 50vw, 100vw"`; se quita el tamaño `lg`
  de la tabla y de la unión de `size` (sin usos).

**Tests**

- `features/product/PriceSummary.test.tsx`: caso nuevo con `low_price_usd` con valor y
  `high_price_usd` `null`: pinta "Desde" y el mínimo, y no pinta "hasta".

**Verificación**: `tsc`, `eslint` sobre `app/p`, `features/product` y `features/search`,
`vitest run features/product features/search`,
`grep -rn '"lg"' "<repo>/features/search/ProductThumb.tsx"` sin salida, y `next build` en
simulado con exit 0, sin `blocking-route` y `/p/[slug]` en `◐`.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los archivos de esta tarea.

### Task 4: Ciudad de la dirección con el `Select` de shadcn

repo: posven-ecommerce
model: sonnet
mechanical: no
review: yes
commit: feat(ui): ciudad de la dirección con el Select de shadcn

Lee antes `.claude/rules/{ui,tests}.md`, `features/account/README.md`,
`features/location/LocationPicker.tsx` y su prueba (uso de `Select` y cómo se prueba en jsdom) y
las Restricciones globales.

**Produce**

- `features/account/AddressForm.tsx`: el `<select>` nativo de ciudad pasa a `Select` con
  `name="city_slug"`, `required` y `defaultValue` igual al de hoy (`value("city_slug", ...)`, sin
  valor si está vacío: Radix no admite un `SelectItem` con `value=""`). `SelectTrigger` con
  `id={`${prefijo}-city`}` (el `<label>` actual lo nombra "Ciudad"), `className="w-full"`,
  `aria-invalid` y `aria-describedby` como hoy; `SelectValue` con `placeholder="Elige tu ciudad"`;
  `SelectContent` con un `SelectGroup` por estado, su `SelectLabel` y un `SelectItem` por ciudad
  (`value={city.slug}`). Tras un envío con error se conserva la ciudad elegida y al editar una
  dirección se precarga la suya, como hoy.
- `e2e/account.spec.ts`: la línea que hace `selectOption("valencia")` pasa a abrir el combobox
  "Ciudad" y elegir la opción "Valencia"; nada más cambia.

**Tests**

- Nuevo `features/account/AddressForm.test.tsx` (con `vi.mock` de las acciones, como las pruebas
  de `features/account`, y `cleanup()` en `afterEach`): sin dirección, el combobox "Ciudad" muestra
  "Elige tu ciudad"; con una dirección, muestra el nombre de su ciudad y el formulario lleva
  `city_slug` con su slug; al abrirlo aparecen los estados como etiquetas de grupo.

**Verificación**: `tsc`, `eslint` sobre `features/account` y `e2e`, `vitest run features/account`,
`next build` en simulado con exit 0 y sin `blocking-route`, y `playwright test e2e/account.spec.ts`
en simulado (en la nube, con la configuración temporal que apunta a `/opt/pw-browsers/chromium`,
borrada al terminar).

**Terminada cuando** lo anterior pasa, `grep -rn "<select" "<repo>/features" "<repo>/app"
"<repo>/components"` no tiene salida y el commit contiene sólo los archivos de esta tarea.

### Task 5: Cierre del plan 4

repo: posven-ecommerce
model: sonnet
mechanical: no
commit: docs(ui): cierre del plan 4 de shadcn Mercado

Lee antes la spec, el resultado del plan 3 (formato) y `docs/conventions/README.template.md`.

**Produce**

- Spec: §3, el tamaño `sm` táctil (decisión 2); §4, la precisión 1 del plan 3 sin "fijo"
  (decisión 3); §6, fila 4 con este plan, marcado como cerrado.
- READMEs: `features/search` (`ProductThumb` sin `lg`, `sizes` de `detail`, chips de
  `CategoryLinks` con `buttonVariants`), `features/account` (`AddressForm` con `Select`),
  `features/product` (panel sin `sticky`), cada uno sólo si menciona lo que cambió.
- `docs/CAPABILITIES.md`: se regenera con la reproducción `gen-capabilities.mjs` del traspaso
  (el script real no está en la nube) y se commitea sólo si difiere; se declara cuál se usó.
- `docs/plans/2026-09-30-shadcn-mercado-plan-4-deuda-resultado.md`, con el formato del resultado
  del plan 3, y en su "Deuda declarada" lo que este plan deja afuera.

**Verificación**: `tsc`, `eslint` de `app`, `features`, `components` y `lib`, `vitest run` entero,
`next build` en simulado sin `blocking-route`, el standalone en el puerto 3100 con 200 en `/`,
`/buscar?q=a` y `/p/<slug con ofertas>` (detenido al terminar), y `playwright test` entero en
simulado con la configuración temporal de la nube.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los documentos de esta tarea.

## Cierre

### Pendientes del cierre

- Destino revisión visual de quien coordina: controles `sm` a 44 px en móvil (cabecera con el
  menú de cuenta, chips, "Filtros", ubicación compacta, orden de la ficha, paginación), `Sheet`
  con borde claro y altura máxima, ficha sin `sticky`, formulario de dirección.
- Destino plan propio: la cabecera con el buscador compacto (`SearchForm size="sm"`, aún `h-9`).
- Destino plan propio: comportamiento de `/buscar` (filtro de distancia sin JavaScript en móvil,
  pantalla vacía sin chips, subcategoría sin chip activo) y barra de `CategoryRail` en escritorio.
- Destino posveapi y spec §7: `/categories` vacío en producción, productos para el inicio, `sort`
  en `/search`, `cover_url` en tiendas cercanas.
