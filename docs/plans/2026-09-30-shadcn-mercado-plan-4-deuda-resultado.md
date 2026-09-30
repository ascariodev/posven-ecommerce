# Resultado: plan 4 de shadcn Mercado (deuda menor de los planes 2 y 3)

- Plan: `docs/plans/2026-09-30-shadcn-mercado-plan-4-deuda.md` (modo ligero)
- Spec: `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md` (aprobada), fila 4 de su §6
- Repo y rama: posven-ecommerce, `feat/ui-shadcn-mercado-deuda` (desde `main` `812085b`); cada
  tarea se subió con push a `gitea` por pedido de quien coordina, sin merge. Primer plan ejecutado
  en la nube con acceso directo a Gitea.
- Commits del plan: `1ce69cb` (plan); Task 1 `0ce8722`, revisión APPROVED; Task 2 `a066401`, con
  `383a3c9` de su revisión; Task 3 `d08426e` (mecánica, sin revisión por tarea); Task 4
  `0cabf2b`, revisión APPROVED, con `7ce46b3` de su Minor 1 (la prueba comprueba que cada estado
  nombra su grupo, como pide el plan); Task 5, el commit de cierre `docs(ui): cierre del plan 4
  de shadcn Mercado`.

## Qué queda hecho

- **`cn`** (`lib/utils.ts`): sale de `createCn` de `cn/config` con `shadow-card` y
  `shadow-raised` en el grupo de sombras. Antes las tomaba por colores de sombra y no las fusionaba
  con `shadow-md` ni con `shadow-none` (prueba nueva `lib/utils.test.ts`).
- **`Sheet`**: borde `border-border`, sin animación con movimiento reducido (contenido y fondo),
  `max-h-[85dvh] overflow-y-auto` en las hojas inferior y superior, y `SheetHeader` con `pr-14`
  para no quedar bajo el botón de cerrar.
- **`SelectContent`**: sombra `shadow-raised` en lugar de `shadow-md`, sin animación con
  movimiento reducido.
- **`ToggleGroup`**: pasa `orientation` a Radix (flechas sólo en su eje).
- **`toggleVariants`**: devuelve su resultado por `cn`, como `buttonVariants`; `ui.md` regla 3
  aclara que ambas se usan tal cual sin clases extra.
- **`sm` táctil**: `Button`, `Toggle` y `SelectTrigger` miden 44 px en móvil y 36 px desde `md`
  (`h-11 md:h-9`), igual que la píldora compacta, el buscador de la cabecera, los chips de
  `CategoryLinks` (ahora `buttonVariants` outline `sm`) y los esqueletos que los imitan
  (`ui.md` regla 5).
- **Ficha**: el panel del resumen pierde el `sticky`; `ProductThumb detail` pide `sizes` a su
  columna (`(min-width: 1024px) 540px, (min-width: 768px) 50vw, 100vw`); se quita el tamaño `lg`
  sin usos; `PriceSummary` gana la prueba con mínimo y sin máximo.
- **`AddressForm`**: la ciudad es un `Select` de shadcn agrupado por estado, con
  `name="city_slug"`; ya no queda ningún `<select>` nativo en `features`, `app` ni `components`
  (prueba nueva `features/account/AddressForm.test.tsx`).
- **Documentación**: spec §3 (`sm` táctil), §4 (precisión 1 del plan 3 sin "fijo") y §6 (fila 4);
  READMEs de `features/search`, `features/account`, `features/product` y `features/location`;
  `.claude/rules/ui.md` reglas 3 y 5.

## Diferencias contra el plan

1. **Movimiento reducido con variantes apiladas** (Task 1). El plan pedía
   `motion-reduce:animate-none`, pero Tailwind lo emite antes que `data-open:animate-in` y, como
   la variante `data-open` de shadcn usa `:where()` (especificidad cero), la animación ganaba. Se
   usó `motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`, que sale
   después; comprobado en el CSS del build.
2. **Casos extra en la prueba de `cn`** (Task 1): los del plan (`shadow-card` contra
   `shadow-raised`) ya pasaban sin el arreglo; se añadieron `shadow-md` contra `shadow-raised` y
   `shadow-card` contra `shadow-none`, que fallaban sin él (`tests.md` 6).
3. **`SearchForm` sí se tocó** (arreglo de la revisión de la Task 2). El plan lo dejaba para el
   plan de la cabecera, pero al subir `Button sm` a 44 px el botón quedaba más alto que su campo
   en móvil; el campo pasó a `h-11 text-sm md:h-9`.
4. **`key` en el `Select` de `AddressForm`** (Task 4). Radix vuelve al valor con que se montó
   cuando React 19 resetea el formulario tras la acción, así que tras un error perdía la ciudad
   elegida. Un contador que sube con cada respuesta lo monta de nuevo con el valor de la
   respuesta; la prueba "tras un envío con error conserva la ciudad elegida" falla sin él.
5. **`features/location/README.md`** también se actualizó (mencionaba el esqueleto compacto en
   `h-9`); el plan no lo listaba.
6. `docs/CAPABILITIES.md` no cambia: ningún frontmatter `capabilities` se tocó. Se comprobó con la
   reproducción `gen-capabilities.mjs` del traspaso (idéntica al archivo en `812085b` y en el árbol
   final), porque `posven/.claude/scripts/generate-index.mjs` no está en la nube.

## Verificación

- `tsc --noEmit`: sin errores (tras `next typegen` en simulado, que genera `LayoutProps`).
  `eslint` sobre `app`, `features`, `components`, `lib` y `e2e`: sin salida.
- `vitest run` entero: 39 archivos, 253 pruebas, todas pasan.
- `next build` con `MARKETPLACE_MODE=mock SITE_URL=http://localhost:3000`: exit 0, 0 avisos
  `blocking-route`, `/p/[slug]` en `◐`.
- Standalone (`node .next/standalone/server.js` en el puerto 3100, modo simulado): 200 en `/`,
  `/buscar?q=a` y `/p/acetaminofen-500-mg-20-tabletas` (sin `md:sticky` en el HTML). El proceso se
  detuvo y el 3100 quedó libre.
- `playwright test` entero en simulado (Pixel 7, con una configuración temporal que apunta al
  Chromium del contenedor, borrada al terminar): 20/20 pasan. `e2e/account.spec.ts` también se
  corrió solo al cerrar la Task 4: 9/9.
- En el CSS del build, las reglas `motion-reduce:data-open:animate-none` y
  `motion-reduce:data-closed:animate-none` van detrás de `data-open:animate-in` y
  `data-closed:animate-out`.
- `grep -rn "<select"` en `features`, `app` y `components`: sin salida. `grep -rnw h-9`: sólo
  `md:h-9` y `md:data-[size=sm]:h-9`.
- El build, el standalone y el e2e se corrieron sobre `0cabf2b`; lo posterior sólo toca pruebas y
  documentos.
- **Sin comprobar**: la revisión visual en navegador, que corre quien coordina.

## Deuda declarada

De la revisión de la Task 1:

- Con `overflow-y-auto` en `SheetContent`, el botón de cerrar (`absolute`) se va con el scroll en
  una hoja inferior con contenido largo; Escape y el fondo siguen cerrándola. Arreglo posible:
  scroll en un contenedor interno o botón `sticky`.
- `cn/config` pesa más en el cliente que `cn` a secas (unos 88 KB sin minificar frente a 13,6 KB)
  y compila en la primera llamada (unos 3 ms); la vía para aligerarlo es `cn build` o `withCn` de
  `cn/next`.
- Un `className` con `p-*` en `SheetHeader` pisa su `pr-14`; hoy nadie lo hace.

De la revisión de la Task 2:

- Los chips de `CategoryLinks` con `buttonVariants` llevan `whitespace-nowrap`: un nombre de
  categoría muy largo no se parte en 320 px (antes, con `h-9` fijo, también desbordaba).
- La cabecera móvil crece de unos 96 a unos 112 px (menú de cuenta y fila del buscador a 44 px);
  nada depende de su altura.

De la revisión de la Task 4:

- Si el foco está en el disparador de Ciudad cuando llega la respuesta de la acción, se pierde,
  porque la `key` monta un nodo nuevo. Sólo pasa si se tabula hasta Ciudad mientras la acción está
  pendiente.

Fuera del plan, siguen abiertas: la barra de desplazamiento de `CategoryRail` en escritorio; el
comportamiento de `/buscar` (filtro de distancia sin JavaScript en móvil, pantalla vacía sin chips,
subcategoría sin chip activo); las migas visibles frente al JSON-LD (decisión 4 del plan 3); y las
dependencias de la spec §7.

## Pasos de deploy

Ninguno propio de este plan: no cambia contrato, rutas ni variables de entorno. Antes de mergear a
`main` (el CI de Gitea despliega en cada push a `main`): la revisión visual de abajo.

## Cómo continuar

1. Revisión visual en móvil y escritorio: controles `sm` a 44 px en móvil (cabecera con el menú de
   cuenta y el buscador, chips, "Filtros", ubicación compacta, orden de la ficha, paginación),
   `Sheet` con borde claro y altura máxima (móvil apaisado), ficha sin `sticky` y formulario de
   dirección con el `Select` de ciudad.
2. Plan propio: la cabecera en dirección C (el buscador compacto sigue con su estilo anterior).
3. Plan propio: comportamiento de `/buscar` y barra de `CategoryRail`.
4. Plan propio: páginas `/comercios`, `/terminos` y `/privacidad` del pie (hoy 404).
5. posveapi: `/categories` vacío en producción y las dependencias de la spec §7.
