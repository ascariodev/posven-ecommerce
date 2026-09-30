# Lecciones (posven-ecommerce)

Único lugar para lo aprendido de errores que se repetirían en otra parte. Formato, promoción y
poda: regla `lessons-authoring` (`posven/.claude/rules/lessons-authoring.md`). Se lee entero antes
de planificar o ejecutar un plan en este repo.

---

## L-02

Lo que lanza un componente de `app/layout.tsx` no lo cubre `app/error.tsx` (sólo
`global-error.js`): una lectura de la API en la cabecera atrapa `MarketplaceUnavailableError` y
degrada, para que la ruta muestre su reintento, su `noindex` y su 404.
aplicada en: `.claude/rules/app-router.md` (regla 7), `features/location/LocationBar.tsx`

## L-03

`motion-reduce:animate-none` no apaga una animación de shadcn: `data-open:animate-in` usa la
variante `data-open` de `shadcn/tailwind.css`, que es `:where()` (especificidad cero), y Tailwind
la emite después, así que gana. Se apila: `motion-reduce:data-open:animate-none
motion-reduce:data-closed:animate-none`, que sale detrás.
aplicada en: `components/ui/sheet.tsx`, `components/ui/select.tsx`

## L-04

Un `Select` de Radix dentro de un `<form action>` con `useActionState` vuelve al valor con que se
montó cuando React 19 resetea el formulario tras la acción, y pierde lo elegido. Se monta de nuevo
con una `key` que cambia con cada respuesta, para que tome el `defaultValue` de la respuesta.
aplicada en: `features/account/AddressForm.tsx`
