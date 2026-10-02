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
aplicada en: `components/ui/sheet.tsx`, `components/ui/select.tsx`,
`components/ui/dropdown-menu.tsx`

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
aplicada en: `features/account/components/AddressActionButton.tsx`
