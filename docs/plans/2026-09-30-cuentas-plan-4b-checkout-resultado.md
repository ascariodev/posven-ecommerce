# Resultado: plan 4b de cuentas y compras (checkout, pago simulado y compras)

- Plan: `docs/plans/2026-09-30-cuentas-plan-4b-checkout.md` (modo completo)
- Spec: `posven/.claude/docs/specs/2026-09-29-cuentas-y-compras-design.md` §8 fila 4 (segunda
  mitad), con la enmienda del 2026-09-30 (F, G y H;
  `docs/delivery/2026-09-30-enmienda-cuentas-y-compras-s4.md`, fuera de git)
- Repo y rama: posven-ecommerce, `feat/cuentas-checkout` (desde `feat/cuentas-carrito` `b8d9345`);
  cada tarea se subió con push a `gitea`, sin merge
- Commits: `34812a9` (plan); Task 1 `7cd913b`; Task 2 `3d47693`; Task 3 `713e01f`; Task 4
  `e72a134`; Task 5 `f794d85`; Task 6 `ae7af6b`; Task 7, el commit de cierre `docs(checkout):
  cierre del plan 4b de cuentas y compras`
- Revisiones: las de cada tarea (`review: yes`) se hicieron releyendo el diff antes del commit, sin
  un revisor aparte; no hay informes de revisión por tarea como en el 4a.

## Qué queda hecho

- **Contrato** (`lib/marketplace/schemas.ts`, `errors.ts`, `http.ts`, `client.ts`): Quote,
  CheckoutStart, Purchase, StoreOrder y su página; entradas de la cotización y del checkout
  (`idempotency_key` UUID v4); códigos `email_unverified`, `quote_changed`, `cart_empty` y
  `open_orders`; `quote` en el cuerpo de error y en `MarketplaceAccountError`; 403 y 409 como
  errores de cuenta; `quoteCheckout`, `startCheckout`, `listPurchases` y `getPurchase` sin caché.
- **Simulado** (`lib/marketplace/mock/checkout.ts`): cotización con reparto por radio
  (haversine), envío por tienda y `quote_hash`; checkout con 403, 409 con la Quote nueva, `cart_empty`
  e idempotencia; avance por consultas del detalle (`RN-MARKETPLACE-09`) con el alcohol de Farmacia
  Central faltante y reembolsado; compras paginadas; eliminar la cuenta se bloquea con pedidos
  abiertos (409 `open_orders`) y borra el carrito. Cuentas sembradas `entrega@posven.test` y
  `pago-fallido@posven.test`.
- **`/checkout`** (`features/checkout`): dirección con `Select`, retiro o entrega por tienda con
  `RadioGroup` (primitiva nueva de shadcn), motivo cuando no hay entrega, recotización por la URL,
  totales de la Quote, "Pagar Bs X", `quote_changed` con "Cambió", correo sin verificar con
  "Reenviar verificación", 429 con segundos y API caída en el formulario. "Ir a pagar" (o "Entra
  para pagar") en `/carrito`; "Volver al checkout" en `/cuenta/direcciones?volver=/checkout`.
- **`/checkout/resultado`**: consulta cada 3 s mientras está pendiente; pagada, fallida y vencida.
- **Compras** (`features/purchases`): `/cuenta/compras` paginada, `/cuenta/compras/[codigo]` con
  código de retiro, faltantes reembolsados, dirección, envío, reembolsado y fechas; "Últimas
  compras" en `/cuenta`; "Mis compras" en el menú, la navegación y los atajos de la cuenta; el
  mensaje de `open_orders` al eliminar la cuenta.
- **E2e de §7** (`e2e/checkout.spec.ts`): compra completa (carrito de invitado, registro con
  fusión, verificación, pago, resultado, código de retiro, reembolso, "Últimas compras", carrito
  vaciado y `open_orders`), sin verificar, entrega con envío, pago fallido y `noindex`.
- **Documentación**: README nuevos de `features/checkout` (`RN-CHECKOUT-01` a `04`) y
  `features/purchases` (`RN-PURCHASES-01` a `03`); READMEs de `lib/marketplace`
  (`RN-MARKETPLACE-05` ampliada y `RN-MARKETPLACE-09`), `features/cart` y `features/account`;
  reglas `contract.md` 1, `ui.md` 1, `seo.md` 3 y 8 y `tests.md` 7; `docs/CAPABILITIES.md` con
  `checkout`, `purchases` y la capacidad nueva de `marketplace`.

## Diferencias contra el plan

1. **`readCheckoutParams` vive en `features/checkout/params.ts`**, no en `server.ts`: el
   formulario del cliente necesita `checkoutHref` y `server.ts` es `server-only`.
2. **`CheckoutEmpty.tsx` y `testQuote.ts`** (datos de prueba compartidos), y `testPurchase.ts` en
   compras, son archivos que el plan no nombraba.
3. **Los mensajes simulados de los códigos nuevos entraron en la Task 1** y no en la 2: el tipo
   `Record<SimpleErrorCode, string>` de `mock/accounts.ts` no compilaba sin ellos. Los estados HTTP
   (403 y 409) sí llegaron con la Task 2.
4. **`listPurchases` usa `pageQuery`** (`contract.md` 6) y `accountRequest` ganó un parámetro
   `query` opcional.
5. **`RadioGroup` de shadcn** se agregó con `shadcn add radio-group` y se ajustó a `ui.md` (tokens,
   foco por outline, sin modo oscuro); `ui.md` 1 lo suma a las primitivas interactivas.
6. **El título del detalle es fijo ("Detalle de compra")**, no "Compra <código>": el código viene
   de la petición y los metadatos se resuelven fuera del `<Suspense>`. El `h1` sí lleva el código.
7. **`contract.md` 1** suma la distancia haversine de `mock/checkout.ts` a las excepciones de "sin
   cálculo" (no estaba en el mapa de la Task 2).
8. **`http.test.ts`**: el caso "un estado %i lanza MarketplaceUnavailableError" pasó de 500 y 409 a
   500 y 503, porque un 409 con cuerpo de error ahora es error de cuenta (`quote_changed`,
   `open_orders`).
9. **"Agregar dirección"** sale una vez en el bloque de la dirección, no dentro del motivo
   `no_address` de cada tienda (el motivo sí sale por tienda).
10. **La prueba de `noindex` del e2e entra con sesión**: sin ella `/checkout` redirige a entrar
    antes de que la página cargue.
11. **Pruebas no pedidas por el plan**, útiles y declaradas: `params.test.ts`; la consulta en la
    URL y el 403 en `http.test.ts`; fecha sin zona y `javascript:` rechazados en
    `schemas.test.ts`; entrega en camino con la dirección copiada en `mock/checkout.test.ts`; la
    navegación al elegir entrega y "Agregar dirección" en `CheckoutForm.test.tsx`.

## Huecos del contrato (a acordar con el plan 3 de posveapi)

- **Estado de los pedidos antes del pago**: el simulado los deja en `accepted` y la UI sólo muestra
  el estado del pedido con la compra `paid` (`RN-PURCHASES-03`).
- **Formato de `code` y `pickup_code`**: el simulado usa `PV-` más 6 caracteres `[A-Z0-9]` y 6
  dígitos; la UI acepta `^[A-Za-z0-9-]{1,40}$`.
- **Envoltura del detalle**: se lee sin `{ data }`, como Cart y Quote.
- **Mensaje de `open_orders`**: el simulado usa "Tienes pedidos en curso. Podrás eliminar tu cuenta
  cuando se entreguen."; la UI muestra el de la API.
- **El listado no avanza el estado** en el simulado; sólo el detalle cuenta consultas.
- **`quote_hash` del simulado** cubre la Quote, la dirección y las cantidades del carrito; posveapi
  decide qué cubre el suyo.

## Verificación

- `tsc --noEmit`: sin errores. `eslint` sobre `app`, `features`, `components`, `lib` y `e2e`: sin
  salida.
- `vitest run` entero: 57 archivos, 433 pruebas, todas pasan.
- `next build` con `MARKETPLACE_MODE=mock SITE_URL=http://localhost:3000`: exit 0, 0 avisos
  `blocking-route`; `/checkout`, `/checkout/resultado`, `/cuenta/compras` y
  `/cuenta/compras/[codigo]` en `◐`.
- Standalone en el puerto 3100 (modo simulado): 200 en `/`, `/carrito`, `/checkout` y
  `/checkout/resultado?compra=…` (sin sesión, con `noindex` y la redirección a
  `/entrar?volver=…` en el streaming); 307 a entrar en `/cuenta/compras` y su detalle (`proxy.ts`);
  detenido, el puerto quedó libre.
- `playwright test` entero en simulado (configuración temporal con el Chromium del contenedor,
  borrada al terminar), dos veces seguidas contra el mismo `next dev`: 29 pasan y 1 `fixme` en cada
  corrida. Antes, una prueba de humo con Playwright recorrió entrar, agregar, "Ir a pagar", elegir
  entrega, pagar, resultado confirmado y "Ver tu compra" sin errores de página.
- `CAPABILITIES.md` regenerado con `gen-capabilities.mjs` después de añadir a git los README
  nuevos, con el generador validado idéntico al archivo de `77ca74e`.
- **Sin comprobar**: el interruptor apagado en un build en modo API (lo cubren las pruebas de
  `actions`, menú y cuenta) y la revisión visual en navegador de escritorio.

## Deuda declarada

- **`/checkout` sin sesión redirige desde el render** (200 con la redirección en el streaming), no
  desde `proxy.ts` como `/cuenta/*` (307): el `matcher` sólo cubre `/cuenta` y `loginHref` usa sólo
  el `pathname`, así que sumar `/checkout/resultado?compra=` perdería la consulta.
- **Verificación simulada global**: `mock/accounts.ts` guarda una sola verificación pendiente para
  todo el servidor; el e2e la pide de nuevo justo antes de verificar y reintenta (`toPass`), porque
  otros archivos registran compradores en paralelo.
- **Cuentas sembradas con estado**: `entrega@posven.test` y `pago-fallido@posven.test` guardan
  compras entre corridas; el e2e les vacía el carrito al terminar.
- **Sin reserva de stock** (limitación aceptada en la spec §5.8): no se simula la segunda compra
  de la última unidad.
- **El simulado no llega a `delivered`**: un comprador que pagó no puede eliminar su cuenta en el
  simulado (siempre tiene un pedido abierto).
- **Sin JavaScript** el checkout, el resultado y las compras no se ven (hallazgo del 4a, sin
  decidir).

## Pasos de deploy

- Mismo interruptor que el 4a (`MARKETPLACE_CART_ENABLED`, apagado en producción): con él apagado,
  `/checkout`, `/checkout/resultado` y `/cuenta/compras*` dan 404 y no hay "Mis compras",
  "Últimas compras" ni "Ir a pagar".
- Depende de `feat/cuentas-carrito` (plan 4a) y, por ella, de los planes 4 y 5 de shadcn: mergear
  en ese orden y luego esta rama, con fast-forward.
- Encenderlo exige el plan 3 de posveapi con las rutas de checkout y compras, el proveedor `fake`
  (o uno real) y `MARKETPLACE_STOREFRONT_URL` apuntando al ecommerce para `redirect_url`.

## Cómo continuar

1. Revisión visual: `/checkout` (dirección, retiro o entrega, "Cambió"), resultado, compras y
   detalle en móvil y escritorio.
2. Acordar los huecos del contrato con el plan 3 de posveapi y aplicarlos en la spec §4.
3. Decidir el hallazgo sin JavaScript y si `/checkout` pasa por `proxy.ts`.
4. Cerrar la fila 4 de §8 "contra la API": cuando posveapi despliegue su plan 3, encender el
   interruptor en un entorno de prueba y correr el flujo contra la API. Los planes 5 a 7 de §8 son
   de posveapi, posvenapp y la pasarela real.
