# Resultado: plan 1 de shadcn Mercado (primitivas y migración)

- Plan: `docs/plans/terminados/2026-09-29-shadcn-mercado-plan-1-primitivas.md` (modo ligero)
- Spec: `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md` (aprobada), fila 1 de su §6
- Repo y rama: posven-ecommerce, `feat/ui-shadcn-mercado` (desde `main` 56a2c44), sin push ni merge
- Commits del plan: `3691b88` y `d6ac2fb` (Task 1), `7ee2838` (Task 2), `061ae5b` (Task 3), `a96ecfc`
  (arreglo de la revisión final). Antes en la rama: `e215951`, `2612e66`, `3ec2cbc` (vista previa
  desechable), `eb7249a` (spec) y `eb41169` (plan).

## Qué queda hecho

`components/ui/{button,badge,card,input,skeleton}.tsx` son las primitivas de shadcn ajustadas a los
tokens de `app/globals.css`; `cx.ts`, `buttonClasses` e `inputSize` ya no existen; todos los usos
están migrados (`Button` `secondary` a `outline`, `buttonVariants` sobre `<Link>`, `Badge` con
`secondary`, `default` y `warning`, 19 `Card` con `CardContent`); `.claude/rules/ui.md` se reescribió
y `L-01` se retiró.

## Diferencias contra el diseño

Con autorización (decididas al planificar y aprobadas con el plan):
- `Card` pasa de `bg-surface` a `bg-card`; `Badge` mide `h-6`; el botón primario conserva
  `shadow-card` y `hover:bg-primary-hover`.
- El foco de `Button` e `Input` queda por outline en `--foreground` (no el ring de shadcn).
- Se eliminan los tamaños `xs` e `icon-*` del botón; `Badge` gana la variante `warning`.

Sin autorización explícita, aceptadas por la revisión final y que conviene mirar en pantalla:
- `Input` con `aria-invalid` pinta borde `--destructive` y un ring de 3 px (21 sitios en los
  formularios de cuenta); antes sólo aparecía el texto del error.
- `Button` gana `border-transparent` y `whitespace-nowrap`, e `Input` `py-1` y
  `disabled:bg-input/50`; sin efecto visible con las alturas fijas, salvo una etiqueta muy larga.
- `Card` gana `overflow-hidden` y `text-base` como base (queda en 16 px como antes).
- Quedan clases `dark:` inertes en las primitivas (no hay modo oscuro).

El plan pedía copiar la base generada tal cual y sus diferencias visibles no estaban previstas; dos
las corrigieron la revisión de la Task 1 (`buttonVariants` sin `cn` sobre enlaces) y la final (`Card`
en 14 px, ring de `Badge`, desplazamiento activo de `Button`).

## Verificación

- `tsc`, `eslint` (`components/ui`, `app`, `features`) y `vitest` (35 archivos, 231 pruebas) pasan al
  cierre de cada tarea y tras el último arreglo.
- `next build` en modo simulado sin errores ni aviso `blocking-route`. El standalone se levantó con
  `node .next/standalone/server.js` y respondió 200 en `/entrar`, `/p/<slug>` y `/tienda/<slug>`.
  Turbopack empaqueta `radix-ui`, `class-variance-authority` y `cn` en los chunks, no en
  `standalone/node_modules`: la expectativa original del plan estaba mal y se corrigió.
- **Sin comprobar**: Playwright (`e2e/*.spec.ts`), que corre quien coordina con el puerto 3000 libre
  y el servidor en modo simulado; y todo lo visual en navegador (la revisión salió del diff y de los
  tokens).

## Deuda declarada

- `components/preview-ui/` y `app/preview/` siguen en la rama: `preview-ui/button.tsx` tiene
  `buttonVariants` sin `cn` (mismo defecto de conflicto de clases sobre `<a>`) y arrastra el barril
  `radix-ui` a un chunk cliente. Se borran en el plan 2, cuando las pantallas reales usen
  `sheet`, `select` y `tabs` desde `components/ui/`.
- `cn` (paquete `cn`) no fusiona utilidades de sombra de token propio (`shadow-card` con
  `shadow-none`); ningún consumidor lo necesita hoy.
- La variante `destructive` de `Badge` conserva clases de ring sin efecto.
- La escala de radios de Tailwind no se sobrescribió; el plan 2 decide si adopta la de shadcn.
- Entorno local de posveapi: `/categories` vacío y una imagen sin archivo en `storage` (el carril
  de categorías sale vacío en `/preview`).

## Pasos de deploy

Ninguno propio de este plan: no cambia rutas, contrato ni variables de entorno. Antes de mergear a
`main` (el CI despliega en cada push a `main`): correr Playwright y mirar en navegador `/entrar`,
`/cuenta`, `/p/<slug>`, `/tienda/<slug>` y `/buscar`.

## Cómo continuar

1. Correr `npx playwright test` en local (puerto 3000 libre, modo simulado) y mirar las pantallas de
   arriba; los ajustes visuales que salgan se corrigen en `components/ui/` o en `globals.css`.
2. Planificar el plan 2 (inicio y búsqueda en dirección C) con `plan-phase`, según la spec §4 y §6,
   instalando sólo las piezas nuevas (`sheet`, `select`, `tabs`, `toggle-group`) y borrando
   `components/preview-ui/` y `app/preview/` al final. Antes de diseñarlo, quien coordina trae la
   referencia de la app de Cashea que comentó el equipo (sólo diseño: descubrimiento, compra o
   visual, por confirmar).
3. Plan 3 (ficha en dirección C) después del 2.
4. Aparte: varias imágenes por producto (carrusel) exige un campo nuevo en spec y posveapi.
