# Plan: rediseño E · F4b, ayuda, Vende con posven, vacíos, error y 404

**Objetivo:** que `/ayuda` y `/vende` existan con el diseño del lienzo (W12, P12, P13), que
`/comercios` redirija a `/vende`, y que los estados vacíos, el error y el 404 sigan el estilo E con
un estado vacío compartido.
**Estado:** terminado

## Contexto mínimo
- Spec: `posven-ecommerce/docs/specs/2026-10-03-rediseno-posven-design.md` §5 (W12, P12, P13),
  §6 (F4) y §8 (respuestas de "Vende con posven"). Lienzo y maqueta en `docs/design/2026-10-03-rediseno/`
  (sin trackear, ajeno: sólo se lee; `web/W12-Ayuda.dc.html`, `movil/P12-Ayuda.dc.html`,
  `web/P13-Vende.dc.html`, `maqueta/_screens/ayuda.tsx`, `vende.tsx`, `sin-resultados.tsx`). Ante
  diferencias entre lienzo y maqueta, manda el lienzo.
- Repo y rama: posven-ecommerce en `C:\Users\Windows 11\Documents\Development\posven\posven-ecommerce`,
  rama `feat/rediseno-f4b` desde `main` (9bff28a). Sin push ni merge sin pedido.
- Restricciones: sin datos nuevos de la API ni cambios de contrato; montos sólo por `lib/format.ts`;
  marca sólo por `SITE_NAME`; colores sólo por tokens (`.claude/rules/ui.md`); sin dependencias
  nuevas (las preguntas plegables van con `<details>`, no con `shadcn add accordion`). Rutas nuevas
  con la skill `new-page`. Fuera de F4b: cuenta y "volver a comprar", embudo, modo oscuro, retiro
  de `/preview` y alertas.
- Archivos principales: `app/not-found.tsx`, `app/error.tsx`, `lib/sitemap.ts`, `app/comercios/page.tsx`,
  `features/site/components/{SiteFooter,MerchantContact}.tsx`, `lib/site.ts`
  (`merchantWhatsapp`, `merchantEmail`), `features/search/components/EmptyState.tsx`.
- Verificación: `"<repo>/node_modules/.bin/tsc" --noEmit -p "<repo>/tsconfig.json"`,
  `npx --prefix <repo> vitest run --root <repo> <áreas>`, eslint con `-c <repo>/eslint.config.mjs`;
  en las fases de rutas, además `npx next build` y el e2e afectado; al cerrar, `npx playwright test`
  completo.

## Fases

### [x] Fase 1 — Estado vacío compartido en el 404 y el error
- **Repo:** posven-ecommerce
- **Alcance:** un componente de estado vacío para todo el sitio, con el molde de
  `maqueta/_screens/sin-resultados.tsx`: `Card`, ícono de `lucide-react` en círculo
  `bg-primary-soft` con `aria-hidden`, título con `font-heading`, texto `text-muted-foreground` y
  una zona de acciones (hijos). Recibe el nivel del título (`h1` en página propia, `h2` dentro de
  otra) porque el 404 y el error son la página entera y los vacíos de F2 y F3 viven dentro de una.
  Antes de escribirlo, mira si shadcn trae una primitiva `empty` sin dependencias para radix-luma;
  si la trae, se agrega con `shadcn add` y se le aplican las reglas de `ui.md` (L-03 no aplica, no
  anima); si no, va en `components/` como componente propio. La elección va a "Decisiones".
  `app/not-found.tsx` lo usa con título, una línea de texto y acciones "Ir al inicio" y "Buscar
  productos". `app/error.tsx` lo usa sin nombrar "el servicio de búsqueda" (cubre cualquier fallo
  de la API, regla `app-router` ítem 7), conserva `retry()`, el botón "Intentar de nuevo" y el
  `noindex`.
- **Archivos:** el componente nuevo (`components/ui/empty.tsx` o `components/EmptyState.tsx`),
  `app/not-found.tsx`, `app/error.tsx`; test del componente; un caso en `e2e/site.spec.ts` que
  abre una ruta inexistente y ve el título del 404.
- **Terminado cuando:** tsc limpio, `vitest run components` (o donde quede el test) en verde y el
  caso nuevo de `e2e/site.spec.ts` pasa.
- **Commit:** `feat(site): estado vacío compartido en el 404 y el error (F4b)`

### [x] Fase 2 — Vacíos de compra y cuenta
- **Repo:** posven-ecommerce
- **Alcance:** carrito vacío (`features/cart/components/CartView.tsx`), checkout vacío
  (`CheckoutEmpty.tsx`), sin compras (`features/purchases/components/PurchaseList.tsx`), sin
  favoritos (`app/cuenta/favoritos/page.tsx`) y sin direcciones (`app/cuenta/direcciones/page.tsx`)
  con el componente de la fase 1, conservando sus textos y destinos. Los tests y el helper
  `emptyCart` del e2e que leen esos textos siguen pasando. READMEs de cart, checkout, purchases y
  account al día (L-09).
- **Terminado cuando:** tsc limpio, vitest de cart, checkout, purchases y account en verde, y
  `e2e/cart.spec.ts` y `e2e/checkout.spec.ts` en verde.

### [x] Fase 3 — Vacíos de descubrir
- **Repo:** posven-ecommerce
- **Alcance:** sin resultados (`features/search/components/EmptyState.tsx`, con sus acciones, chips
  de categoría y "Quizás te sirve"), tienda sin productos (`StoreProducts.tsx`), ficha sin ofertas
  (`ProductOffers.tsx`), directorio y comercios cercanos (`StoresDirectory.tsx`, `NearbyStores.tsx`)
  con el componente de la fase 1. READMEs de search, store y product al día.
- **Terminado cuando:** tsc limpio, vitest de search, store y product en verde, y
  `e2e/search.spec.ts` y `e2e/product.spec.ts` en verde.

### [x] Fase 4 — Contenido y buscador de la ayuda
- **Repo:** posven-ecommerce
- **Alcance:** módulo nuevo (por ejemplo `features/help/`) con README desde la plantilla: temas y
  preguntas frecuentes de compradores como datos, y un Client Component que filtra las preguntas por
  texto en el navegador (sin API) con "sin coincidencias". Los temas salen del lienzo W12; cada
  respuesta se apoya en lo que el sistema hace hoy (una `RN-` o la spec de cuentas y compras, citada
  en el README), y la pregunta o el tema sin respuesta comprobable se quita. Sin ruta todavía.
- **Terminado cuando:** vitest del módulo (datos y filtro) en verde, tsc limpio y
  `generate-index --check` al día.

### [x] Fase 5 — Ruta `/ayuda`
- **Repo:** posven-ecommerce
- **Alcance:** `app/ayuda/page.tsx` con la skill `new-page` (metadatos, canónica, sitemap `static`,
  `paths:` de `seo.md`): héroe con el buscador, temas, preguntas y banda de contacto sobre `bg-ink`.
  El contacto reusa `MerchantContact` con un mensaje de soporte (prop nueva); sin
  `MERCHANT_WHATSAPP` ni `MERCHANT_EMAIL` la banda no muestra botones. El pie enlaza a `/ayuda`.
- **Terminado cuando:** `next build` sin errores, vitest de site y sitemap en verde y un e2e de
  `/ayuda` (canónica, filtro de preguntas, enlace del pie) pasa.

### [x] Fase 6 — Ruta `/vende`
- **Repo:** posven-ecommerce
- **Alcance:** `app/vende/page.tsx` y su módulo con el lienzo P13: héroe con la tarjeta de ejemplo
  "Así te ven los compradores" (montos por `lib/format.ts`), tres pasos, tres beneficios, preguntas
  de comercios sólo con respuesta comprobable (costo de aparecer y liquidación quedan fuera) y banda
  final. Los CTA van al contacto de `MerchantContact`; sin destino, no se muestran. Sitemap,
  canónica y e2e por `new-page`.
- **Terminado cuando:** `next build` sin errores y un e2e de `/vende` (canónica, secciones, CTA)
  pasa.

### [x] Fase 7 — `/comercios` redirige a `/vende`
- **Repo:** posven-ecommerce
- **Alcance:** redirección permanente (308) de `/comercios` a `/vende` según la guía de Next,
  retiro de `app/comercios/page.tsx`, enlaces del pie y de la búsqueda vacía a `/vende`, sitemap sin
  `/comercios`, y los e2e y tests que usaban `/comercios` (`site.spec.ts`, `search.spec.ts`,
  `sitemap.test.ts`, `SiteFooter.test.tsx`) apuntando a `/vende`. Fichas de site y search al día.
- **Terminado cuando:** `next build` sin errores, vitest de site, search y sitemap en verde y
  `npx playwright test` completo en verde (cierre del plan), con la revisión contra el lienzo.

## Decisiones
- 2026-10-05 — Respuestas de las preguntas: se redacta sólo lo comprobable en el código o la spec;
  lo que pide datos de negocio (cuánto cuesta aparecer, cómo se liquida el dinero) se quita hasta
  tener el texto. El usuario revisa los textos en la revisión de la fase. Elegido por el usuario.
- 2026-10-05 — `/vende` reemplaza a `/comercios`, que redirige permanente; el sitemap lista sólo
  `/vende`. Elegido por el usuario.
- 2026-10-05 — El contacto de `/ayuda` reusa `MERCHANT_WHATSAPP` y `MERCHANT_EMAIL` con un mensaje
  de soporte. Elegido por el usuario.
- 2026-10-05 — El buscador de `/ayuda` filtra las preguntas en el navegador, sin API. Elegido por
  el usuario.
- 2026-10-05 — Preguntas plegables con `<details>`: evita una dependencia nueva (accordion).
- 2026-10-05 — Estado vacío como componente propio `components/EmptyState.tsx` (no `shadcn add empty`:
  su título es un `div` sin nivel, usa borde punteado y no usa `Card`). Props: `icon`, `title`,
  `description?`, `className?`, `headingLevel` (`"h1" | "h2"`, por defecto `"h2"`) y `children`
  para las acciones; Server Component. El error dice "Intentar de nuevo" (antes "Reintentar").
- 2026-10-05 — Vacíos de compra y cuenta: título = texto original, `h2`, íconos `ShoppingCart`,
  `Receipt`, `Heart` y `MapPin`, acciones como botón `outline` `lg` con `bg-card` (favoritos y
  direcciones pasaron de enlace subrayado a botón, mismo destino).
- 2026-10-05 — Vacíos de descubrir: search importa el compartido como `EmptyStateCard`; sin
  resultados con `SearchX`, ampliar radio en primario y el resto outline, y debajo "Quizás te sirve",
  categorías y el enlace a `/comercios` (cambia en la fase 7). Íconos `StoreIcon` y `MapPinOff`; en
  directorio, cercanos y ofertas "Prueba con otra ciudad." pasó a descripción.
- 2026-10-05 — Ayuda (`features/help/`): `HelpCenter` (Client Component) pinta héroe con buscador,
  temas y preguntas en `<details>`; la ruta de la fase 5 sólo añade la banda de contacto. Cada tema
  enlaza a `#pregunta-<id>` de su primera pregunta; "Sin coincidencias" usa `components/EmptyState`.
  Del lienzo W12 se quitaron "¿Puedo pagar en bolívares?" (pasarela real sin decidir) y el tema
  "Devoluciones" (no hay política; el reembolso de faltantes va en "¿Qué pasa si la tienda no tiene
  el producto?"). Se agregaron, con fuente comprobable: costo de entrega, varias tiendas, pago
  pendiente (con pago tardío), cuenta, factura y récipe. La banda de contacto no promete horarios.
- 2026-10-05 — `/ayuda`: `MerchantContact` recibe `purpose?: "merchant" | "support"` (por defecto
  `merchant`; `support` pinta la banda `bg-ink` "¿No encontraste la respuesta?"). `HelpCenter` recibe
  `canContact` (por defecto `true`, la página lo calcula con `merchantWhatsapp()`/`merchantEmail()`):
  sin contacto, "Sin coincidencias" no invita a escribir. Metadatos estáticos; `/ayuda` en el grupo
  `static` del sitemap; el pie suma la columna "Ayuda" (5 columnas en `lg`). El héroe queda dentro
  del `max-w-5xl` del layout, como el resto del sitio (ver M-5).
- 2026-10-05 — `/vende`: módulo `features/merchants/` (`MerchantsLanding`, `ExampleStoreCard`,
  contenido en `lib/content.ts`). `features/site/components/MerchantContact.tsx` exporta
  `merchantContactHref(whatsapp, email, purpose?)` (`wa.me`, si no `mailto:`, si no `null`) para los
  CTA. "Quiero aparecer" en héroe y banda final, ocultos sin destino; "Hablar con el equipo" se
  quitó (mismo destino) y el héroe lleva "Cómo funciona" (`#como`). Pasos y beneficios reescritos a
  la spec; se quitaron "¿Cuánto cuesta aparecer?" y "¿Cómo recibo el dinero...?". La tarjeta de
  ejemplo usa `lib/format.ts` (distancia "a 800 m" en vez de "0,8 km" del lienzo).
- 2026-10-05 — `/comercios` redirige con `redirects` de `next.config.ts` (`permanent: true`, 308);
  `app/comercios/page.tsx` retirado. Los textos "Para comercios" del pie y de la búsqueda vacía se
  conservan, cambia sólo el destino. `MerchantContact` en modo `merchant` queda sin llamadores en
  páginas (se deja; ver M-10).

## Identificadores que estrena

Catálogo actual: no hay `RN-HELP-` (módulo nuevo `features/help/`).

- `RN-HELP-01` a `RN-HELP-04` (Fase 4): reglas del contenido y del filtro de la ayuda; el
  enunciado de cada una vive en `features/help/README.md`, una afirmación por regla.
- `RN-MERCHANTS-01` a `RN-MERCHANTS-03` (Fase 6): contenido de `/vende` (cada pregunta cita su
  spec; sin costo ni liquidación; sin contacto no hay CTA ni banda final), en `features/merchants/README.md`.

## Notas para la próxima sesión
- Plan terminado. Pendiente: el usuario revisa los textos de `features/help/lib/content.ts` y
  `features/merchants/lib/content.ts`; mejoras M-1 a M-10.

## Mejoras propuestas
- [x] M-1 (baja, sonnet) — El mensaje de `CheckoutEmpty` puede venir de la API y ahora es el `h2` a
  `md:text-3xl`; si se ve grande, ajustar el título con `className`. `features/checkout/components/CheckoutEmpty.tsx`,
  `components/EmptyState.tsx`.
- [x] M-2 (baja, sonnet) — La clase de acción `cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-card")`
  se repite en cada vacío; extraer una constante o prop de acción en `components/EmptyState.tsx`.
- [x] M-3 (baja, sonnet) — Vacíos dentro de secciones con su propio `h2` (`ProductOffers`,
  `StoreProducts`, `NearbyStores`): admitir `headingLevel: "h3"` en `components/EmptyState.tsx` y usarlo ahí.
- [x] M-4 (baja, sonnet) — La tarjeta con ícono grande puede verse desproporcionada en secciones de
  la home (`NearbyStores`); validar en `/preview` y, si hace falta, variante compacta en `components/EmptyState.tsx`.
- [x] M-5 (media, sonnet) — El héroe de `/ayuda` queda dentro del `max-w-5xl` del `<main>` del
  layout y no a ancho completo como en W12/P12 (`max-width: 1200px`). Decidir un patrón de sección a
  sangre para el sitio. `app/layout.tsx`, `features/help/components/HelpCenter.tsx`.
- [x] M-6 (baja, sonnet) — `.claude/rules/seo.md` ítem 3 podría listar `/ayuda` entre las indexables.
- [x] M-7 (baja, sonnet) — `features/merchants/README.md`: `depends_on` omite `lib/utils.ts` y
  `lib/marketplace/schemas.ts` (tipo `Money`).
- [x] M-8 (baja, sonnet) — `.claude/rules/seo.md` pasa el tope orientativo (67 líneas): condensar.
- [x] M-9 (baja, sonnet) — `e2e/site.spec.ts`: la aserción de pasos de `/vende` es débil; comprobar
  los tres `h3` de los pasos.
- [ ] M-10 (baja, sonnet) — Retirar la rama `merchant` del render de `MerchantContact` (sin llamadores
  tras retirar `/comercios`), conservando el mensaje que usa `merchantContactHref`, y ajustar los
  `intent_aliases` de `features/site/README.md`. `features/site/components/MerchantContact.tsx`, su
  test, `features/site/README.md`, `docs/CAPABILITIES.md`.
- [ ] M-11 (baja, sonnet) — El e2e de ancho completo de `/ayuda` (375 px, `e2e/site.spec.ts`) pasa aun
  sin el `overflow-x: clip` (Chromium headless no tiene barra clásica); cubrir el caso con barra o
  aclarar en el nombre que sólo mide el ancho.
- Patrón M-5: sección a sangre con `data-full-bleed`, `w-screen`, `ml-[calc(50%-50vw)]` y `-mt-8`
  (depende del `py-8` de `<main>` en `app/layout.tsx`), más `body:has([data-full-bleed]) { overflow-x: clip }`
  en `app/globals.css`; con barra clásica el héroe se recorta 7.5 px por lado, sin efecto visible.
