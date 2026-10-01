# Resultado: visual moderna del ecommerce

- Plan: `docs/plans/terminados/2026-09-28-visual-moderna.md` (modo ligero)
- Spec: `docs/specs/2026-09-28-visual-moderna-design.md`
- Repo y rama: posven-ecommerce, `main`, sin push
- Commits: `92ab22c..dbdc9fc` más el commit de cierre de documentación

## 1. Qué quedó

| Commit | Qué |
|---|---|
| `92ab22c` | simulado con las raíces de la taxonomía de posveapi |
| `fcd8e61`, `b68a583` | spec y plan |
| `fe8be3d`, `051a37d` | base: tokens, Plus Jakarta Sans, `lucide-react`, primitivas, cabecera fija de vidrio, `ProductThumb`, `categoryIcon`; arreglo de la altura del buscador compacto (`inputSize` en `Input`) y de la cabecera con la API caída |
| `05b5130` | inicio, búsqueda y selector de ubicación |
| `2db1e4b` | producto, tienda, contacto, error y 404; `ProductThumb` con `alt` y `preload` |
| `dbdc9fc` | cabecera compacta en móvil con la ciudad en la primera fila, y `scroll-padding-top` |

## 2. Diferencias contra el diseño

- `ProductThumb` suma `alt?` y `preload?`, que el plan no declaraba, para que la ficha conserve el
  texto alternativo y la precarga que ya tenía (decisión de quien coordina; ruteo a la Task 3).
- En móvil la ciudad sube a la primera fila de la cabecera, junto a la marca, porque compartiendo
  la fila con el formulario el input quedaba en ~130 px (visto en captura a 375 px). La spec §5
  quedó enmendada.
- Las sombras viven en `:root` como `--elevation-card` y `--elevation-raised`; la spec §3 quedó
  alineada.
- `LocationSummary` atrapa `MarketplaceUnavailableError`; la regla 7 de `app-router.md` quedó con
  esa excepción.

## 3. Verificación

Corrido sobre `dbdc9fc`:

- `tsc --noEmit` limpio.
- `vitest run` completo: 29 archivos y 164 pruebas pasan.
- `next build` limpio, sin avisos `blocking-route`.
- `playwright test`: 11 de 11 pasan.

Capturas en el panel del navegador, en modo simulado, de inicio, `/buscar`, producto y tienda a
375 px y en escritorio. Sin desborde horizontal. La cabecera mide 57 px en escritorio y 89 px en
móvil en `/p` y `/tienda`, y el input compacto 241 px a 375 px.

Sin comprobar:

- Tabular hacia atrás con teclado: sólo se midió el `scroll-padding-top` calculado (96 px).
- El salto de la cabecera en un slug no prerenderizado (ver §4).
- Nada contra posveapi real, porque el ecommerce sigue en `MARKETPLACE_MODE=mock`.

## 4. Deuda declarada

- `app/layout.tsx`: `<Suspense fallback={null}>` del `HeaderSearchSlot`. En `/p` y `/tienda` con
  un slug fuera de `generateStaticParams`, `usePathname` suspende y la segunda fila de la cabecera
  aparece al hidratar, lo que puede causar un salto en móvil. Si se confirma, el arreglo es un
  fallback con altura mínima sólo en móvil.
- En `/` y `/buscar` se resuelve `LocationSummary` aunque el slot lo descarte. El costo es la
  cookie más `listLocations()` cacheado, sin efecto visible.
- `docs-check` sigue marcando por fecha los README de `features/store`, `features/location` y
  `features/search`. Quien coordina los releyó: sus cambios fueron sólo de clases y no afirman
  nada visual que haya dejado de ser cierto.

## 5. Deploy

No hay migraciones ni cambios de contrato. Hace falta `npm install` para `lucide-react` 1.48.0,
luego `next build` y reiniciar el proceso. Esto cae dentro del despliegue que el plan D todavía
tiene que decidir.
