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
