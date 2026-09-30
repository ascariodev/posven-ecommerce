# Resultado: plan 5 de shadcn Mercado (cabecera en dirección C)

- Plan: `docs/plans/2026-09-30-shadcn-mercado-plan-5-cabecera.md` (modo ligero)
- Spec: `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md` (aprobada), fila 5 de su §6
- Repo y rama: posven-ecommerce, `feat/ui-shadcn-mercado-cabecera` (desde
  `feat/ui-shadcn-mercado-deuda` `7fc83a4`, el plan 4 sin mergear); cada tarea se subió con push a
  `gitea` por pedido de quien coordina, sin merge.
- Commits del plan: `501f7b8` (plan); Task 1 `b22761b`, revisión APPROVED; Task 2 `0a7baaf`,
  revisión APPROVED, con `3a4fd6b` de sus tres Minor; Task 3, el commit de cierre `docs(ui):
  cierre del plan 5 de shadcn Mercado`.

## Qué queda hecho

- **Buscador de la cabecera** (`app/layout.tsx`): en ficha, tienda y cuenta, `SearchPill compact
  degradeLocation` ("qué", "dónde" con `LocationSheet` y "Buscar") dentro de `HeaderSearchSlot`.
  En móvil, dos filas (marca y cuenta; píldora a todo el ancho); desde `sm`, una fila con la
  píldora centrada (`sm:max-w-xl`). La cabecera conserva vidrio, borde, `sticky` y
  `header-elevate`. En `/` y `/buscar` no cambia nada: la píldora va en la página.
- **Degradación del segmento "dónde"** (L-02): `LocationBar` gana `degrade`; con él, si
  `getEffectiveLocation()` o `listLocations()` lanzan `MarketplaceUnavailableError`, no pinta nada
  (ni el separador). Sin él (inicio y `/buscar`), el error sigue llegando a `app/error.tsx`.
  `SearchPill` lo activa con `degradeLocation`.
- **Menú de cuenta**: `components/ui/dropdown-menu.tsx` de `shadcn add dropdown-menu`, ajustado a
  `ui.md` (tokens, `shadow-raised`, foco por outline en `--foreground`, ítems de 44 px en móvil,
  movimiento reducido apilado, `cn` de `@/lib/utils`); `AccountDropdown` (cliente) con "Mi cuenta"
  y los ítems Resumen, Perfil, Direcciones, Favoritos, Configuración y Salir. `AccountSlot` sigue
  siendo Server Component con su degradación a "Entrar" (`RN-ACCOUNT-05`).
- **Retiro**: `features/search/SearchForm.tsx`, `LocationSummary` y `LocationSummarySkeleton`;
  ninguno tiene usos.
- **Documentación**: spec §4 (fila "Cabecera" y tres precisiones) y §6 (fila 5); READMEs de
  `features/search`, `features/location` y `features/account`; `.claude/rules/app-router.md`
  regla 7 y `.claude/rules/ui.md` reglas 1 y 4; lecciones L-03 (`aplicada en` suma
  `dropdown-menu.tsx`) y L-05 nueva; `docs/CAPABILITIES.md`.

## Diferencias contra el plan

1. **El separador de la píldora pasó a `LocationBar`** (Task 1): `Divider` en `LocationBar` y en
   `LocationBarSkeleton`, para que desaparezca con el segmento cuando `degrade` no pinta nada.
   `LocationBar` sólo lo usa `SearchPill`; en `/` y `/buscar` se ve igual.
2. **`app/buscar/page.tsx`**, fuera del mapa: la función local `SearchFormWithQuery` (que ya
   montaba `SearchPill`) pasó a llamarse `SearchPillWithQuery`, para que el nombre no mintiera y
   el `grep` de verificación del plan quedara limpio.
3. **`HeaderSearchSlot` devuelve `children` sin envoltorio**; el contenedor lo pone el layout (el
   plan lo permitía).
4. **"Salir" con un formulario fuera del menú** (Task 2). El plan pedía un `DropdownMenuItem
   asChild` sobre un `<button type="submit">` dentro de un `<form action={logout}>`. Al elegir un
   ítem, Radix cierra el menú y, con movimiento reducido (sin animación de salida que retenga
   `Presence`), React desmonta el contenido antes de la acción por defecto del clic: el formulario
   queda desconectado y no se envía. Ahora `<form action={logout} hidden>` vive fuera del menú y
   el ítem lo envía con `requestSubmit()` en su `onSelect` (lección L-05).
5. **`ui.md` regla 4**: "el desenfoque va sólo en la cabecera" (quitado "y en el buscador grande",
   que era `SearchForm`); la regla 1 dice que las primitivas interactivas pueden importarse desde
   Server o Client Components (arreglo de la revisión de la Task 2).
6. **La prueba de `LocationBar`** simula `window.matchMedia` con `vi.stubGlobal` (lo usa
   `LocationSheet`) y lo restaura en `afterEach`.
7. **`docs/CAPABILITIES.md`** se regeneró con la reproducción `gen-capabilities.mjs` del traspaso
   (idéntica al archivo en `7fc83a4`), porque `posven/.claude/scripts/generate-index.mjs` no está
   en la nube: sólo sale la fila de `<SearchForm />`. La capacidad de `<SearchPill />` suma los
   alias "buscador de la cabecera", "caja de busqueda" y "buscador" de la que se quitó.

## Verificación

- `tsc --noEmit`: sin errores. `eslint` sobre `app`, `features`, `components`, `lib` y `e2e`: sin
  salida.
- `vitest run` entero: 39 archivos, 254 pruebas, todas pasan.
- `next build` con `MARKETPLACE_MODE=mock SITE_URL=http://localhost:3000`: exit 0, 0 avisos
  `blocking-route`; `/cuenta`, `/p/[slug]` y `/tienda/[slug]` en `◐`.
- Standalone (`node .next/standalone/server.js` en el puerto 3100, modo simulado): 200 en `/`,
  `/p/acetaminofen-500-mg-20-tabletas` (con "Buscar productos" en la cabecera) y
  `/tienda/farmacia-central-valencia`; `/cuenta` sin sesión, 307 a `/entrar?volver=%2Fcuenta`. El
  proceso se detuvo y el 3100 quedó libre.
- `playwright test` entero en simulado (Pixel 7, configuración temporal con el Chromium del
  contenedor, borrada al terminar): 20/20, incluidos "la cabecera no desborda en móvil" y "Salir
  deja Entrar en la cabecera".
- Comprobaciones con Playwright fuera del e2e (archivos temporales, borrados):
  - Campo de la píldora en la ficha: 203 px a 412 px (cabecera de 127 px, dos filas), 190 px a
    640 px (75 px, una fila), 318 px a 768 y 346 px a 1024; sin desborde horizontal.
  - "Salir" con `reducedMotion: "reduce"` y clic, y sólo con teclado (Enter abre y enfoca
    "Resumen", End enfoca "Salir", Escape cierra y devuelve el foco a "Mi cuenta", Enter en "Salir"
    cierra sesión): pasan. El ítem mide 44 px en móvil.
- `grep "SearchForm\|LocationSummary"` en `app`, `features`, `components` y `e2e`: sin salida.
  `grep "<details" features/account`: sin salida.
- **Sin comprobar**: la revisión visual en navegador, que corre quien coordina.

## Deuda declarada

De la revisión de la Task 1:

- En `/` y `/buscar`, `HeaderSearchSlot` devuelve `null` pero sus hijos de servidor se renderizan
  igual: la lista de estados de `LocationSheet` viaja dos veces en el payload RSC (sin llamada
  extra a la API, porque `listLocations` está cacheada). Arreglo posible: decidir la ruta en el
  servidor o cargar los estados al abrir la hoja.

De la revisión de la Task 2:

- "Salir" con movimiento reducido no queda en el e2e (corre con movimiento normal); se comprobó a
  mano al cerrar el plan.
- En `next dev`, abrir el menú mientras la página aún hidrata su parte en streaming da un aviso de
  hidratación (`aria-hidden` que pone el `hideOthers` del menú modal de Radix). Sólo en desarrollo;
  `Sheet` y `Select` se comportan igual. `modal={false}` lo evitaría si molesta.
- Sin JavaScript el menú de cuenta no abre (decisión 4).

Heredadas: la deuda del plan 4 que sigue abierta (botón de cerrar del `Sheet` con scroll, peso de
`cn/config`, foco al enviar una dirección sin ciudad, entre otras).

## Pasos de deploy

Ninguno propio de este plan: no cambia contrato, rutas ni variables de entorno. Depende del plan 4:
mergear primero `feat/ui-shadcn-mercado-deuda` y después esta rama (ambas con fast-forward). Antes
de mergear a `main` (el CI de Gitea despliega en cada push a `main`): la revisión visual de abajo.

## Cómo continuar

1. Revisión visual: cabecera en ficha, tienda y cuenta, en móvil (dos filas) y escritorio (una
   fila, también a 640 px), con y sin sesión, con y sin ubicación; el menú de cuenta con ratón y
   teclado; la hoja de ubicación abierta desde la cabecera.
2. Plan propio: el pie y sus páginas (`/comercios`, `/terminos`, `/privacidad`, hoy 404).
3. Plan propio: la navegación de `/cuenta` en dirección C.
4. Plan propio: comportamiento de `/buscar` y barra de `CategoryRail` (deuda del plan 4).
