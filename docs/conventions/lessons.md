# Lecciones (posven-ecommerce)

Único lugar para lo aprendido de errores que se repetirían en otra parte. Formato, promoción y
poda: regla `lessons-authoring` (`posven/.claude/rules/lessons-authoring.md`). Se lee entero antes
de planificar o ejecutar un plan en este repo.

---

## L-03
`motion-reduce:animate-none` no apaga una animación de shadcn: `data-open:animate-in` usa la
variante `data-open` de `shadcn/tailwind.css`, que es `:where()` (especificidad cero), y Tailwind
la emite después, así que gana. Se apila: `motion-reduce:data-open:animate-none
motion-reduce:data-closed:animate-none`, que sale detrás.
aplicada en: `components/ui/sheet.tsx`, `components/ui/select.tsx`, `components/ui/dropdown-menu.tsx`

## L-04
Un `Select` de Radix dentro de un `<form action>` con `useActionState` vuelve al valor con que se
montó cuando React 19 resetea el formulario tras la acción, y pierde lo elegido. Se monta de nuevo
con una `key` que cambia con cada respuesta, para que tome el `defaultValue` de la respuesta.
aplicada en: `features/account/components/AddressForm.tsx`

## L-05
Un botón `submit` dentro del contenido de un menú de Radix no envía con movimiento reducido: al
elegir el ítem, Radix cierra el menú y, sin animación de salida que retenga `Presence`, React
desmonta el contenido antes de la acción por defecto del clic; el formulario queda desconectado.
El formulario va fuera del menú, siempre montado, y el ítem lo envía con `requestSubmit()` en su
`onSelect`.
aplicada en: `features/account/components/AccountDropdown.tsx`

## L-06
Si la acción llama a `refresh()` y la respuesta desmonta el componente que la envió (la tarjeta
eliminada), el efecto de `useActionToast` nunca corre y el toast se pierde. El toast se dispara
dentro de la función pasada a `useActionState`, tras el `await`, y se prueba con e2e.
aplicada en: `features/account/components/AddressActionButton.tsx`, `features/account/components/FavoriteToggleForm.tsx`

## L-07
Una validación nueva del simulado (`lib/marketplace/mock/`) lleva su prueba en la misma fase: sin
ella, una regex que perdió el escape (`d{7}` por `\d{7}`) rechaza todo lo válido y la suite sigue
en verde. Tras escribir una regex, se relee el archivo para confirmar las barras invertidas.
aplicada en: pendiente: el usuario decide promoverla a `posven-ecommerce/.claude/rules/contract.md` (punto 5), propuesto al cerrar el plan del registro del comprador

## L-09
Una fase que cambia el comportamiento de un componente o una ruta de un módulo actualiza su README
en el mismo cambio: la ficha del símbolo, la fila de tests, las dependencias y `verified_against`,
y también el README de otro módulo que liste el archivo cambiado (`docs-check` lo marca RANCIO).
Quien revisa lo rechaza si falta, y cuesta una ronda entera.
aplicada en: pendiente: el usuario decide promoverla a una casilla de `posven/.claude/agents/implementador-fase.md`, propuesto al cerrar el plan de eventos de búsqueda y carrito

## L-10
Un componente del layout raíz que marca la ruta activa con `usePathname()` desajusta la
hidratación: con `cacheComponents` el HTML prerenderizado puede ser de otra ruta. La marca activa
se calcula sólo tras hidratar (`useSyncExternalStore` con instantánea de servidor `false`).
aplicada en: `features/site/components/MobileNavLinks.tsx`

## L-12
`cache` de React indexa por la lista de argumentos: `f("")` y `f()` son claves distintas y la
lectura se repite. Quien comparte un `cache` con otro llamador lo invoca con los mismos argumentos
(sin el valor por defecto explícito), y una prueba memoizando por argumentos lo fija.
aplicada en: `features/cart/__tests__/cart.test.ts`

## L-14
Una primitiva sobre `bg-ink` (pie) no contrasta con sus colores por defecto: `outline-foreground`
y `bg-primary` quedan por debajo de 3:1 en algún modo. Se le pasan por `className` clases `ink`
(foco, borde y relleno), con `!` donde el `dark:` de shadcn gana, y se mide en claro y oscuro.
aplicada en: `.claude/rules/ui.md` ítem 5

## L-15
En el frontmatter de un README de módulo, un escalar entre comillas dobles (`output: "..."`) no
lleva comillas dobles dentro (`"Ver menos"`, `name="robots"`): el YAML queda inválido y
`generate-index.mjs` no lo detecta. Dentro se usan comillas simples o se reescribe sin comillas.
aplicada en: pendiente: el usuario decide promoverla a una comprobación de `posven/.claude/scripts/docs-check.mjs`, propuesto en las mejoras sueltas del rediseño
