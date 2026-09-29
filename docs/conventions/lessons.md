# Lecciones (posven-ecommerce)

Único lugar para lo aprendido de errores que se repetirían en otra parte. Formato, promoción y
poda: regla `lessons-authoring` (`posven/.claude/rules/lessons-authoring.md`). Se lee entero antes
de planificar o ejecutar un plan en este repo.

---

## L-01

`cx` (`components/ui/cx.ts`) sólo une cadenas, no resuelve conflictos de Tailwind: un `className`
que repite una utilidad de la base (`h-9` sobre `h-11`) deja las dos y gana la que el CSS genera
después. Altura, texto y color de una primitiva salen de su variante, no de `className`.
aplicada en: `components/ui/input.tsx`

## L-02

Lo que lanza un componente de `app/layout.tsx` no lo cubre `app/error.tsx` (sólo
`global-error.js`): una lectura de la API en la cabecera atrapa `MarketplaceUnavailableError` y
degrada, para que la ruta muestre su reintento, su `noindex` y su 404.
aplicada en: `features/location/LocationBar.tsx`
