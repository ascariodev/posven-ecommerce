# Plan 5 de shadcn Mercado: cabecera en dirección C

modo: ligero

## Contexto

Los planes 1 a 4 de la spec `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md` llevaron a
la dirección C el inicio, la búsqueda, la ficha y las primitivas. La cabecera (`app/layout.tsx`)
sigue con piezas anteriores: en ficha, tienda y cuenta, `HeaderSearchSlot` monta `SearchForm
size="sm"` (campo y botón sueltos) y `LocationSummary` (texto "Cerca de: …" sin acción); la cuenta
es un `<details>` escrito a mano. Este plan pasa la cabecera a las piezas de la dirección C sobre
shadcn.

Parte de la rama del plan 4 (`feat/ui-shadcn-mercado-deuda`, sin mergear a `main`), porque usa su
tamaño `sm` táctil y su ajuste de `SearchForm`.

Queda afuera: el pie y sus páginas (`/comercios`, `/terminos`, `/privacidad`), la navegación de
`/cuenta` (`app/cuenta/layout.tsx`), el inicio y `/buscar` (que ya llevan su píldora en la página y
siguen sin buscador en la cabecera), el comportamiento de `/buscar` y todo campo nuevo del
contrato.

## Spec

`docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md`: §2 (cabecera fija con vidrio y
desenfoque, shadcn como base), §3 (44 px en móvil, foco), §4 (píldora de dos segmentos), §6.
Lección L-02 (`docs/conventions/lessons.md`) y `.claude/rules/app-router.md` regla 7.

### Decisiones tomadas al planificar (quien coordina, 2026-09-30)

1. **Rama desde el plan 4**: `feat/ui-shadcn-mercado-cabecera` sale de
   `feat/ui-shadcn-mercado-deuda` (`7fc83a4`); al mergear el plan 4 con fast-forward, esta queda
   encima.
2. **Buscador de la cabecera = `SearchPill compact`** en ficha, tienda y cuenta: "qué", "dónde"
   (`LocationSheet`, para cambiar la ubicación desde cualquier página) y "Buscar". Sustituye a
   `SearchForm size="sm"` y a `LocationSummary`, que quedan sin usos y se retiran. El segmento
   "dónde" degrada si la API cae (L-02): la cabecera no puede romper la página.
3. **Menú de cuenta con `DropdownMenu` de shadcn** (`shadcn add dropdown-menu`): se cierra con
   Escape y con clic fuera, y se recorre con las flechas. "Salir" es un ítem que envía el
   formulario de `logout`.
4. **Sin JavaScript el menú no abre**: se acepta y se declara, como ya pasa con el segmento
   "dónde" y los filtros en móvil.
5. **Móvil en dos filas**: fila 1, marca a la izquierda y cuenta a la derecha; fila 2, la píldora a
   todo el ancho. Desde `sm`, una fila: marca, píldora centrada con ancho máximo y cuenta.

## Restricciones globales

1. **shadcn es la base.** Toda pieza de UI sale de `components/ui/`; `dropdown-menu` entra con
   `shadcn add` y se ajusta a los tokens y a `ui.md`.
2. **Colores y sombras sólo por tokens** de `app/globals.css` (`ui.md` 4). Este plan no crea
   tokens. La cabecera conserva su vidrio (`bg-glass`, `border-glass-border`, `backdrop-blur-md`)
   y su sombra al hacer scroll (`header-elevate`).
3. **Foco visible por outline en `--foreground`**, sin `outline-none` ni ring; controles de al
   menos 44 px en móvil (`ui.md` 5): los ítems del menú también.
4. **Movimiento reducido con variantes apiladas** (L-03): `motion-reduce:data-open:animate-none
   motion-reduce:data-closed:animate-none` en lo que anime con `data-open`/`data-closed`.
5. **L-02**: lo que lee la API desde `app/layout.tsx` atrapa `MarketplaceUnavailableError` y
   degrada; en `/` y `/buscar` la píldora conserva su comportamiento (el error llega a
   `app/error.tsx`, `app-router.md` 7).
6. **`cacheComponents`**: toda lectura de `cookies()` o de la API en la cabecera sigue dentro de
   `<Suspense>` con su fallback; `next build` sin `blocking-route` (`app-router.md` 2).
7. **Sin cambio de contrato** (`lib/marketplace/` no cambia). **El navegador nunca llama a
   posveapi.** Metadatos, canónicas y JSON-LD no cambian.
8. **Textos y nombres accesibles que el e2e y las pruebas usan se conservan**: "Buscar productos",
   "Buscar", "Entrar", "Mi cuenta", "Salir", "Ubicación: …" y "¿Dónde? Ubicación: sin elegir". La
   única consulta del e2e que cambia a propósito es la de "Salir", que pasa de `button` a
   `menuitem` (Task 2). Otra que cambie se ajusta y se reporta.
9. **Pruebas**: las existentes siguen pasando o se ajustan cuando prueban una pieza retirada o
   cambiada (se reporta). Nuevas, sólo las que pide cada tarea.
10. Commit por tarea con el `commit:` de su cabecera, en español, sin firma ni atribución de
    ningún tipo; autor `Sergio Carrillo <miele.web.developer@gmail.com>`. Push de la rama a
    `gitea` al terminar cada tarea; nunca a `main` ni a GitHub. Nunca `cd`: rutas absolutas y
    `git -C`. Sin `--no-verify`.

## Repos y ramas

Todo en `posven-ecommerce` (`<repo>` = la raíz del checkout; en la nube,
`/home/user/posven-ecommerce`), rama `feat/ui-shadcn-mercado-cabecera`, creada desde
`feat/ui-shadcn-mercado-deuda` `7fc83a4`. Remoto de trabajo: `gitea`.

## Identificadores que estrena

- `components/ui/dropdown-menu.tsx` (de shadcn).
- `features/account/AccountDropdown.tsx` (Client Component con el menú del comprador).
- Prop `degradeLocation` de `SearchPill` y prop `degrade` de `LocationBar`.
- Se retiran `features/search/SearchForm.tsx`, `LocationSummary` y `LocationSummarySkeleton`.

## Mapa de archivos

- Task 1 (≈9): `app/layout.tsx`, `features/search/{SearchPill,HeaderSearchSlot}.tsx`,
  `features/search/SearchForm.tsx` (se borra), `features/location/LocationBar.tsx`,
  `features/location/LocationBar.test.tsx`, `.claude/rules/app-router.md`,
  `e2e/*.spec.ts` (sólo si una consulta cambia).
- Task 2 (≈6): `components/ui/dropdown-menu.tsx` (nuevo), `features/account/AccountMenu.tsx`,
  `features/account/AccountDropdown.tsx` (nuevo), `features/account/AccountMenu.test.tsx`,
  `e2e/account.spec.ts`, `.claude/rules/ui.md`.
- Task 3 (≈7): spec, `features/{search,location,account}/README.md`, `docs/CAPABILITIES.md`,
  `docs/plans/2026-09-30-shadcn-mercado-plan-5-cabecera-resultado.md` (nuevo).

## Composición

- Task 1, buscador de la cabecera (`sonnet`, `review: yes`): toca el layout raíz, la degradación de
  L-02 y retira dos piezas.
- Task 2, menú de cuenta (`sonnet`, `review: yes`): primitiva nueva y un control con sesión.
- Task 3, cierre (`sonnet`): spec, README, índice, build, standalone, e2e y resultado.

Costura: la Task 1 toca la zona central de la cabecera y su contenedor; la Task 2 sólo el hueco de
la cuenta (`AccountSlot`), que el layout ya monta en su `<Suspense>`. La Task 2 no toca
`app/layout.tsx`.

### Task 1: Buscador de la cabecera con la píldora compacta

repo: posven-ecommerce
model: sonnet
mechanical: no
review: yes
commit: feat(ui): cabecera con la píldora de búsqueda de la dirección Mercado

Lee antes `.claude/rules/{ui,app-router,seo,tests}.md`, `docs/conventions/lessons.md`,
`features/search/README.md`, `features/location/README.md` y las Restricciones globales. Esta
versión de Next difiere de tu entrenamiento: lee en `node_modules/next/dist/docs/` lo que toques
(layouts, `Suspense` con Cache Components).

**Produce**

- `features/location/LocationBar.tsx`: `LocationBar({ compact, degrade })` con `degrade?: boolean`
  (por defecto `false`). Con `degrade`, si `getEffectiveLocation()` o `listLocations()` lanzan
  `MarketplaceUnavailableError`, no pinta nada (`null`); cualquier otro error se relanza. Sin
  `degrade`, igual que hoy (el error sube a `app/error.tsx`). Se borran `LocationSummary` y
  `LocationSummarySkeleton`.
- `features/search/SearchPill.tsx`: prop nueva `degradeLocation?: boolean` que pasa a
  `LocationBar` como `degrade`. Sin ella, igual que hoy. Si el segmento "dónde" no se pinta, el
  separador (`h-6 w-px`) tampoco.
- `app/layout.tsx`:
  - Contenedor de la cabecera: `flex flex-wrap items-center gap-x-4 gap-y-2`; en móvil, fila 1
    con la marca y la cuenta (`ml-auto`), fila 2 con la píldora a todo el ancho (`order-last
    w-full`); desde `sm`, una sola fila con la píldora en medio (`sm:order-none sm:flex-1`,
    centrada y con ancho máximo `sm:max-w-xl`).
  - Dentro de `HeaderSearchSlot`: `<SearchPill compact degradeLocation />` en lugar de
    `SearchForm size="sm"` y `LocationSummary`. La cabecera conserva vidrio, borde, `sticky` y
    `header-elevate`.
- `features/search/HeaderSearchSlot.tsx`: sigue sin pintar sus hijos en `/` y `/buscar`; su
  envoltorio se ajusta a la composición nueva (o desaparece si el layout pone el contenedor).
- `features/search/SearchForm.tsx`: se borra (sin usos).
- `.claude/rules/app-router.md` regla 7: el ejemplo de la excepción del layout pasa de
  `LocationSummary` a `LocationBar` con `degrade` (y `AccountSlot`).

**Tests**

- `features/location/LocationBar.test.tsx`: los casos de `LocationSummary` se reemplazan por los de
  `LocationBar`: con `degrade` y la API caída no pinta nada; sin `degrade` y la API caída, el error
  se propaga; con `degrade` y una ciudad efectiva pinta el segmento con el nombre accesible
  "Ubicación: Valencia".
- `features/search/HeaderSearchSlot.test.tsx` sigue pasando (se ajusta sólo si cambia su
  envoltorio).

**Verificación**: `tsc`, `eslint` sobre `app/layout.tsx`, `features/search`, `features/location`,
`vitest run features/search features/location`, `grep -rn "SearchForm\|LocationSummary"
"<repo>/app" "<repo>/features" "<repo>/components" "<repo>/e2e"` sin salida, `next build` en
simulado con exit 0 y sin `blocking-route`, y `playwright test` entero en simulado (en la nube, con
la configuración temporal que apunta a `/opt/pw-browsers/chromium`, borrada al terminar; incluye
"la cabecera no desborda en móvil"). A 640 px (fila única), el campo de la píldora no queda por
debajo de unos 120 px de ancho: si queda, se reporta en vez de cambiar el punto de corte.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los archivos de esta tarea.

### Task 2: Menú de cuenta con el `DropdownMenu` de shadcn

repo: posven-ecommerce
model: sonnet
mechanical: no
review: yes
commit: feat(ui): menú de cuenta con el DropdownMenu de shadcn

Lee antes `.claude/rules/{ui,tests}.md`, `docs/conventions/lessons.md` (L-02, L-03),
`features/account/README.md` y las Restricciones globales.

**Produce**

- `components/ui/dropdown-menu.tsx` con `npx shadcn add dropdown-menu` (estilo `radix-nova` de
  `components.json`), ajustado a `ui.md`: `bg-popover`, sombra `shadow-raised`, bordes por token,
  foco por outline en `--foreground` en disparador e ítems, ítems de al menos 44 px en móvil
  (`min-h-11 md:min-h-9`), movimiento reducido con variantes apiladas (L-03) y ningún color
  literal. Se revisa el diff de `shadcn add` antes de ajustarlo.
- `features/account/AccountDropdown.tsx` (`"use client"`): `DropdownMenu` con disparador
  `Button variant="outline" size="sm"` (ícono `User` con `aria-hidden` y el texto "Mi cuenta") y
  `DropdownMenuContent align="end"` con un `DropdownMenuItem asChild` por enlace de
  `MENU_LINKS` (`<Link>`), un `DropdownMenuSeparator` y "Salir": un `<form action={logout}>` con un
  `DropdownMenuItem asChild` sobre un `<button type="submit">`. Enter o clic en "Salir" envía el
  formulario.
- `features/account/AccountMenu.tsx`: `AccountSlot` sigue siendo Server Component y conserva
  su degradación (L-02, `RN-ACCOUNT-05`): sin comprador o con la API caída, el enlace "Entrar"
  igual que hoy; con comprador, `<AccountDropdown />` en lugar del `<details>`. `MENU_LINKS` pasa a
  `AccountDropdown.tsx` (o se exporta a él). `AccountSlotSkeleton` no cambia.
- `e2e/account.spec.ts`: en "Salir deja Entrar en la cabecera…", la consulta de "Salir" pasa de
  `getByRole("button", ...)` a `getByRole("menuitem", ...)` y la de "Mi cuenta" abre el menú por su
  rol (`button`); nada más cambia.
- `.claude/rules/ui.md` regla 1: `DropdownMenu` entra en la lista de primitivas interactivas que
  traen su `'use client'`.

**Tests**

- `features/account/AccountMenu.test.tsx`: los casos sin comprador y con la API caída no cambian;
  "con comprador muestra Mi cuenta y Salir" pasa a abrir el menú (teclado sobre el disparador) y
  comprobar los ítems "Resumen", "Perfil", "Direcciones", "Favoritos", "Configuración" y "Salir"
  con rol `menuitem`, y que los enlaces llevan su `href`.

**Verificación**: `tsc`, `eslint` sobre `components/ui/dropdown-menu.tsx`, `features/account` y
`e2e`, `vitest run features/account`, `next build` en simulado con exit 0 y sin `blocking-route`, y
`playwright test e2e/account.spec.ts` en simulado con la configuración temporal de la nube.

**Terminada cuando** lo anterior pasa, `grep -n "<details" "<repo>/features/account"` no tiene
salida y el commit contiene sólo los archivos de esta tarea.

### Task 3: Cierre del plan 5

repo: posven-ecommerce
model: sonnet
mechanical: no
commit: docs(ui): cierre del plan 5 de shadcn Mercado

Lee antes la spec, el resultado del plan 4 (formato) y `docs/conventions/README.template.md`.

**Produce**

- Spec: §4, fila "Cabecera" (composición y piezas: `SearchPill compact`, `DropdownMenu`) con las
  decisiones 2 a 5 como precisiones; §6, fila 5 con este plan, marcado como cerrado.
- READMEs: `features/search` (sin `SearchForm`: se quita su entrada de `capabilities`, `exports` y
  firmas; `SearchPill` con `degradeLocation`), `features/location` (sin `LocationSummary`;
  `LocationBar` con `degrade`), `features/account` (`AccountDropdown`, `dropdown-menu` en
  `depends_on`, la fila de montaje en la cabecera y la regla de degradación).
- `docs/CAPABILITIES.md` regenerado con la reproducción `gen-capabilities.mjs` del traspaso
  (quitar `<SearchForm />` lo cambia), validada antes contra el archivo de `7fc83a4`; se declara
  cuál se usó.
- `docs/plans/2026-09-30-shadcn-mercado-plan-5-cabecera-resultado.md`, con el formato del resultado
  del plan 4.

**Verificación**: `tsc`, `eslint` de `app`, `features`, `components`, `lib` y `e2e`, `vitest run`
entero, `next build` en simulado sin `blocking-route`, el standalone en el puerto 3100 con 200 en
`/`, `/p/<slug con ofertas>`, `/tienda/<slug>` y `/cuenta` (redirige a `/entrar` sin sesión),
detenido al terminar, y `playwright test` entero en simulado con la configuración temporal de la
nube, borrada al terminar.

**Terminada cuando** lo anterior pasa y el commit contiene sólo los documentos de esta tarea.

## Cierre

### Pendientes del cierre

- Destino revisión visual de quien coordina: cabecera en ficha, tienda y cuenta, en móvil (dos
  filas) y escritorio (una fila, también a 640 px), con y sin sesión, con y sin ubicación; el menú
  de cuenta con teclado; la hoja de ubicación abierta desde la cabecera.
- Destino plan propio: el pie y sus páginas (`/comercios`, `/terminos`, `/privacidad`, hoy 404).
- Destino plan propio: la navegación de `/cuenta` en dirección C.
