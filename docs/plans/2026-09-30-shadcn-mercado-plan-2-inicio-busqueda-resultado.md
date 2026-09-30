# Resultado: plan 2 de shadcn Mercado (inicio y búsqueda en dirección C)

- Plan: `docs/plans/2026-09-30-shadcn-mercado-plan-2-inicio-busqueda.md` (modo ligero)
- Spec: `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md` (aprobada), fila 2 de su §6
- Repo y rama: posven-ecommerce, `feat/ui-shadcn-mercado` (desde `main` 56a2c44); cada tarea se subió con push por pedido de quien coordina (la Restricción 10 decía sin push), sin merge
- Commits del plan: `437c809` (plan); Task 1 `ed7a3ef`, con `d3d4225` y `e63063e` de su revisión;
  Task 2 `55a84e4`, con `0d337c1` de su revisión; Task 3 `f7fbac0` (sin revisión por tarea);
  `507d747` (arreglo aparte de `buttonVariants` por `cn` en `AccountMenu` y `FavoriteButton`, que
  venían del plan 1); Task 4, el commit de cierre `docs(ui): cierre del plan 2 de shadcn Mercado y
  retiro de /preview`.

## Qué queda hecho

- **Tema** (`app/globals.css`): escala de radios de shadcn derivada de `--radius`, tintes
  `--tint-1` a `--tint-4` con su `-foreground`, y `--overlay`; las pantallas pasaron de
  `rounded-2xl`/`rounded-xl` a `rounded-lg`/`rounded-md` sin cambio de tamaño.
- **Piezas nuevas** en `components/ui/`: `sheet`, `select`, `toggle` (con `toggleVariants`, sin
  `'use client'` para usarse en servidor) y `toggle-group`, ajustadas a los tokens y al foco en
  `--foreground`.
- **Inicio**: título, `SearchPill` (píldora con el campo de búsqueda, el segmento "dónde" en un
  `Sheet` y el botón "Buscar" fuera del `<form>`), `CategoryRail` y `NearbyStores` con `StoreCard`
  de banda de color por token.
- **Ubicación**: `LocationSheet` (hoja inferior en móvil, lateral desde `sm`) y `LocationPicker` con
  `Select` de Radix y `onDone`; ningún `<select>` nativo queda en `features/location`.
- **Búsqueda**: `SearchPill compact`, chips de categoría, `RadiusFilter` con `toggleVariants` sobre
  `<Link>` (en línea desde `md`, en el `Sheet` de `FiltersSheet` en móvil), total y tasa, rejilla
  de tarjetas verticales con tinte por categoría (`categoryTint`, `ProductThumb size="card"`).
- **Retiro**: `app/preview/` y `components/preview-ui/` borrados; ningún archivo los importa y
  `robots`, `sitemap` y las reglas no los citaban.
- **Documentación**: spec §4 (las seis diferencias), §7 (tres dependencias del contrato) y §9
  (`/preview` retirada); READMEs de `features/search`, `features/location` y `features/store`;
  `docs/CAPABILITIES.md`.

## Diferencias contra el diseño

Decididas al planificar (quien coordina, 2026-09-30) y escritas en la spec §4:

1. Inicio sin rejilla "Cerca de ti" de productos (falta un endpoint, §7).
2. Búsqueda sin selector de orden (`/search` no acepta `sort`, §7).
3. Inicio sin `tabs`.
4. Distancia con la forma de `toggle-group` hecha de enlaces (`toggleVariants` sobre `<Link>`).
5. Escala de radios de shadcn.
6. Tarjeta de tienda con banda de color por token (falta `cover_url`, §7).
7. La app de Cashea queda como estudio aparte, sin efecto en el plan.

Del implementador, sin cubrir el plan al pie de la letra:

- En `/buscar` los chips de categoría van arriba y la distancia debajo; el plan no fija el orden.
  Conviene mirarlo en pantalla.
- `LocationSheet` sin ubicación tiene el nombre accesible "¿Dónde? Ubicación: sin elegir" y no
  "Ubicación: sin elegir": contiene el texto visible (WCAG 2.5.3, arreglo `0d337c1`). El e2e de la
  Task 2 busca "Ubicación: sin elegir" y, por ser subcadena, sigue casando; con ubicación es
  "Ubicación: {ciudad}".
- `LocationSheet`, `LocationBar` y `LocationBarSkeleton` ganaron `compact` (Task 3) para la píldora
  de `/buscar`; y `FiltersSheet.tsx` es un archivo nuevo que el plan sólo describía como "un
  componente cliente pequeño".
- `SearchForm` (`size="sm"`) sigue en la cabecera y `CategoryLinks` en `EmptyState`; ya no los usan
  el inicio ni `/buscar`.

## Verificación

- `tsc --noEmit`: sin errores. `eslint` sobre `app`, `features` y `components`: sin salida.
- `vitest run` entero: 36 archivos, 235 pruebas, todas pasan.
- `next build` con `MARKETPLACE_MODE=mock SITE_URL=http://localhost:3000`: exit 0, sin aviso
  `blocking-route`.
- Standalone (`node .next/standalone/server.js` en el puerto 3100, modo simulado): 200 en `/`,
  `/buscar?q=a` y `/buscar?categoria=salud-y-medicamentos` (con la lista "Resultados" en el HTML).
  Sin copiar `.next/static` ni `public`, que para el 200 no hacen falta. El proceso se detuvo y el
  3100 quedó libre.
- Al cerrar cada tarea: `tsc`, `eslint` y `vitest` limpios; `next build` en simulado con exit 0 y
  sin `blocking-route` en las Tasks 2 y 3.
- **Sin comprobar**: Playwright (`e2e/*.spec.ts`, cuyos casos "elegir ciudad" y "usar mi
  ubicación" cambiaron en las Tasks 2 y 3) y la revisión visual en navegador, que corre quien
  coordina.
- `docs/CAPABILITIES.md` se editó a mano: `posven/.claude/scripts/generate-index.mjs` no está en
  este entorno. Se añadieron las entradas de `<SearchPill />` y `<CategoryRail />` con el formato y
  el orden de las demás; regenerar el índice donde el script exista y confirmar que no difiere.

## Deuda declarada

- `SelectContent` lleva `shadow-md` (no es un token de sombra).
- Los bordes laterales de `Sheet` no usan `border-border` (línea oscura).
- Las animaciones de `Sheet` no tienen `motion-reduce:animate-none`.
- `ToggleGroup` no pasa `orientation` a Radix.
- `SheetHeader` con un título largo puede tapar el botón de cerrar.
- La hoja inferior de ubicación no tiene `max-h` (móvil apaisado).
- `CategoryRail` no muestra barra de desplazamiento en escritorio con ratón.
- Dependencias del contrato (spec §7): productos destacados o cercanos para el inicio, `sort` en
  `/search` y `cover_url` en las tiendas cercanas.
- El `<select>` nativo de ciudad en `features/account/AddressForm.tsx` sigue sin migrar.
- Heredada del plan 1: `cn` no fusiona utilidades de sombra de token propio; `/categories` local
  de posveapi vacío (el carril sale vacío con el entorno local real).

- Revisión final de la rama: APPROVED, sin Critical ni Important. Su Minor 1 (la hoja de "Filtros"
  seguía abierta tras elegir una distancia) se corrigió al cierre con `key={searchHref(query)}` en
  `FiltersSheet`, junto con dos frases desfasadas de la spec §7. Quedan:
  - En móvil el filtro de distancia sólo existe dentro del `Sheet`: sin JavaScript no hay filtro de
    distancia en móvil (desde `md` sí, en línea).
  - Sin `q` ni `categoria`, "Escribe qué buscas o elige una categoría." no muestra chips; quitar el
    chip activo lleva ahí.
  - Con una subcategoría en la URL ningún chip raíz queda activo ni permite quitarla.
  - Chips, "Filtros" y el segmento de ubicación compacto miden 36 px (tamaño `sm`).

## Pasos de deploy

Ninguno propio de este plan: no cambia rutas públicas, contrato ni variables de entorno; `/preview`
desaparece (era `noindex` y no estaba en el sitemap). Antes de mergear a `main` (el CI despliega en
cada push a `main`): correr Playwright y la revisión visual de abajo.

## Cómo continuar

1. Correr `npx playwright test` en local (puerto 3000 libre, modo simulado) y mirar `/` y `/buscar`
   (con y sin ubicación, móvil y escritorio) y las pantallas que cambiaron de radio (`/entrar`,
   `/cuenta`, `/tienda/<slug>`, `/p/<slug>`); los ajustes visuales se corrigen en `components/ui/`
   o en `globals.css`.
2. Decidir, con la vista, el orden de chips y distancia en `/buscar` y cerrar los menores de la
   deuda que se vean mal.
3. Plan 3 (ficha en dirección C): hereda el tinte de `ProductThumb` y la escala de radios.
4. Abrir en posveapi las tres dependencias de la spec §7 (cada campo nuevo, primero en la spec §3).
5. Plan de cuenta futuro: `Select` de shadcn en `AddressForm.tsx`.
6. Estudio aparte: referencia de la app de Cashea (inicio, búsqueda, catálogo por tienda y paso de
   compra).
