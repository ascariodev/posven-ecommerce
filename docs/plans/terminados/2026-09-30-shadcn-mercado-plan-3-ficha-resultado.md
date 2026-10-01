# Resultado: plan 3 de shadcn Mercado (ficha en dirección C)

- Plan: `docs/plans/2026-09-30-shadcn-mercado-plan-3-ficha.md` (modo ligero)
- Spec: `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md` (aprobada), fila 3 de su §6
- Repo y rama: posven-ecommerce, `feat/ui-shadcn-mercado-ficha` (desde `143ed46`, la nota de CAPABILITIES del plan 2 que el espejo de Gitea había quitado de GitHub; viaja en esta rama); cada tarea se subió con push por pedido de quien coordina (la Restricción 10 lo pedía), sin merge
- Commits del plan: `01e94ea` (plan); Task 1 `afcadc1` (ficha con imagen y panel fijo,
  `PriceSummary`, migas), revisión APPROVED; Task 2 `280fef9` (tiendas en filas, "Mejor precio",
  orden como toggle, tokens `best`), revisión APPROVED; Task 3, el commit de cierre
  `docs(ui): cierre del plan 3 de shadcn Mercado`.

## Qué queda hecho

- **Ficha** (`app/p/[slug]/page.tsx`): dos columnas (`ProductThumb size="detail"` con `preload` a la
  izquierda; a la derecha un `Card` fijo en escritorio con categoría, nombre, marca, "Requiere
  récipe", `PriceSummary`, favoritos y atributos). Debajo, a todo el ancho, "Sin disponibilidad
  ahora." o `ProductOffers` en su `Suspense`.
- **Migas**: sólo "Inicio" es enlace; las categorías son texto. El `BreadcrumbList` del JSON-LD
  lleva Inicio y el producto. Ya no hay `/categoria/` en `app/`.
- **`PriceSummary`** (`features/product/`): "Desde", "hasta" sólo si la cadena del máximo difiere de
  la del mínimo, "en N tiendas" y "Precio en todo el país"; nada si `low_price_usd` es `null`.
- **`ProductThumb`**: tamaño `detail` (cuadrado, `object-contain`, ícono `size-24` sin imagen).
- **Tiendas en filas** (`OfferCard`): tienda, ciudad y distancia, insignias, precios a la derecha
  desde `sm`, antigüedad y contactos abajo; con `best`, borde y anillo `best-foreground`.
- **"Mejor precio"** (`ProductOffers`, `RN-PRODUCT-05`): sólo la primera oferta normal, sólo con
  orden por precio y sólo sin destacadas (arreglo de la revisión final); tokens `--best` y `--best-foreground` y variante `best` de `Badge`.
- **Orden**: `SortLinks` con `toggleVariants` outline `sm` y `rounded-full` sobre `<Link>`, con
  `data-state` y `aria-current`.
- **Documentación**: spec §4 (fila de la ficha y las cuatro precisiones) y §6 (plan 3 cerrado);
  READMEs de `features/product` (`PriceSummary`, `RN-PRODUCT-05`, migas, pruebas) y
  `features/search` (tamaño `detail`); `.claude/rules/ui.md` regla 4 (línea partida y
  `ring-best-foreground`); `docs/CAPABILITIES.md`.

## Diferencias contra el diseño

Decididas al planificar (quien coordina, 2026-09-30) y escritas en la spec §4:

1. Panel fijo sólo con el resumen; la lista de tiendas va debajo, a todo el ancho.
2. "Mejor precio" sólo con orden por precio, en la primera oferta normal y sin destacadas; el
   frontend no compara.
3. Rango del panel sólo en dólares, de `offers_summary`.
4. Migas con las categorías como texto; el JSON-LD lleva sólo Inicio y el producto.

Del cierre:

- El plan no fija la referencia de `RN-PRODUCT-05` en `verified_against` ni si `toggle.tsx` entra en
  las dependencias de `features/product`; se añadió `components/ui/toggle.tsx` a ambas listas
  porque `SortLinks` usa `toggleVariants`.
- La spec §6 marca el plan 3 con "**Cerrado** (2026-09-30)" en la tabla (el plan 2 no lo tenía
  marcado ahí).
- `docs/CAPABILITIES.md`: `posven/.claude/scripts/generate-index.mjs` no está en este entorno, así
  que se regeneró con la reproducción `gen-capabilities.mjs` del scratchpad de la sesión (validada
  idéntica al script real en `4245a9a` y `bc1c598`). El único cambio es `RN-PRODUCT-05` en la fila
  de `<ProductOffers />`.

## Verificación

- `tsc --noEmit`: sin errores. `eslint` sobre `app`, `features` y `components`: sin salida.
- `vitest run` entero: 37 archivos, 242 pruebas, todas pasan.
- `next build` con `MARKETPLACE_MODE=mock SITE_URL=http://localhost:3000`: exit 0, 0 avisos
  `blocking-route`, `/p/[slug]` en `◐`. `grep "emerald\|green-"` sobre `features` y `components/ui`
  sin salida.
- Standalone (`node .next/standalone/server.js` en el puerto 3100, modo simulado): 200 en
  `/p/acetaminofen-500-mg-20-tabletas`, `/p/jarabe-para-la-tos-120-ml` (con "Sin disponibilidad
  ahora." en el HTML) y `/p/acetaminofen-500-mg-20-tabletas?orden=cerca`. El proceso se detuvo y el
  3100 quedó libre.
- Al cerrar cada tarea: `tsc`, `eslint`, `vitest` y `next build` (sin `blocking-route`, `/p/[slug]`
  en `◐`) limpios.
- **Sin comprobar**: Playwright (`e2e/*.spec.ts`) y la revisión visual en navegador; los corre quien
  coordina (y también en la nube al final).

## Deuda declarada

De la revisión de la Task 1:

- Las migas visibles (Inicio › Padre › Categoría, sin el producto) y el JSON-LD (Inicio › Producto)
  no coinciden del todo; cumple la Decisión 4.
- `sizes` de `ProductThumb detail` pide `50vw` aunque el `main` topa en ~1024 px; sugerido
  `(min-width: 1024px) 540px, (min-width: 768px) 50vw, 100vw`.
- El tamaño `lg` de `ProductThumb` quedó sin uso.
- `PriceSummary` no tiene prueba del caso `low` con valor y `high` `null` (el código lo maneja).

De la revisión de la Task 2:

- `SortLinks` mide 36 px (`h-9`, tamaño `sm`), bajo el mínimo de 44 px; no es regresión.
- (Arreglado en este cierre: la línea de la regla 4 de `ui.md` pasaba de 100 columnas y faltaba
  `ring-best-foreground`. Cubierto en el README: la regla de "Mejor precio", como `RN-PRODUCT-05`.)

Heredada del plan 2: las que siguen abiertas de su "Deuda declarada" (sombra de `SelectContent`,
bordes y animaciones de `Sheet`, `ToggleGroup` sin `orientation`, `AddressForm` con `<select>`
nativo, `cn` con sombras de token propio).

- Revisión final de la rama: CHANGES_REQUIRED por un Important, ya corregido: "Mejor precio" podía
  caer en una oferta más cara que una destacada de encima (en el simulado,
  `/p/alcohol-isopropilico-250-ml`: destacada a $1,60 y marcada a $1,75), porque la API saca las
  destacadas de `offers`. Ahora sólo se marca si no hay destacadas, con su prueba. Quedan de esa
  revisión: el panel `md:sticky` apenas se mueve (su bloque es la celda del grid y la lista va
  fuera), y 11 `buttonVariants` sin `cn` y sin clases extra, anteriores a esta rama.

## Pasos de deploy

Ninguno propio de este plan: no cambia contrato, ni variables de entorno, ni rutas (la ficha sigue
en `/p/[slug]`; deja de enlazar a `/categoria/<slug>`, que daba 404). Antes de mergear a `main` (el
CI despliega en cada push a `main`): correr Playwright y la revisión visual de abajo.

## Cómo continuar

1. Correr `npx playwright test` en local (puerto 3000 libre, modo simulado) y mirar `/p/<slug>` con
   y sin ofertas, con y sin ubicación, en móvil y escritorio (panel fijo, "Mejor precio", orden).
2. Plan propio: la cabecera sigue con el buscador compacto anterior (`SearchForm size="sm"`) en
   ficha, tienda y cuenta.
3. Plan propio: páginas `/comercios`, `/terminos` y `/privacidad` del pie (hoy 404).
4. Plan propio o spec §7: páginas de categoría indexables (`/categoria/<slug>`); entonces las migas
   de la ficha podrán enlazarlas.
5. posveapi: `/categories` vacío en producción (sin carril, chips ni migas de categoría).
