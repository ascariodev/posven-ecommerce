# Resultado: plan 4a de cuentas y compras (carrito del comprador)

- Plan: `docs/plans/2026-09-30-cuentas-plan-4a-carrito.md` (modo completo), con su revisión
  `docs/plans/2026-09-30-cuentas-plan-4a-carrito-plan-review.md`
- Spec: `posven/.claude/docs/specs/2026-09-29-cuentas-y-compras-design.md` §8 fila 4 (partida en 4a
  y 4b), con la enmienda del 2026-09-30 (A a K;
  `docs/delivery/2026-09-30-enmienda-cuentas-y-compras-s4.md`, fuera de git), que quien coordina
  confirmó aplicada en `posven` antes de ejecutar
- Repo y rama: posven-ecommerce, `feat/cuentas-carrito` (desde `feat/ui-shadcn-mercado-cabecera`
  `77ca74e`); cada tarea se subió con push a `gitea`, sin merge
- Commits: `eec4665` (plan y revisión); Task 1 `65dda7d` (mecánica); Task 2 `181aab6`, revisión
  APPROVED, con `7b08432`; Task 3 `53573a9`, revisión APPROVED, con `0540d8a`; Task 4 `5d7cd43`,
  revisión APPROVED, con `47cc962`; Task 5 `6166fa0`, revisión CHANGES_REQUIRED (dos Important de
  accesibilidad), corregida en `ba7be6b`; Task 6, el commit de cierre `docs(carrito): cierre del
  plan 4a de cuentas y compras`; revisión final CHANGES_REQUIRED (un Important, siete Minor),
  corregida en `fix(carrito): arreglos de la revisión final del plan 4a`

## Qué queda hecho

- **Contrato** (`lib/marketplace/schemas.ts`, `client.ts`): `accepts_orders` en `StoreSummary`
  (opcional, ausente = `false`, `RN-MARKETPLACE-08`); `CartItem`, `CartItemPut`, `CartLine`,
  `CartStore`, `Cart`, `UnavailableReason`; códigos `not_orderable`, `product_restricted` y
  `cart_full`; `quoteGuestCart`, `getCart`, `setCartItem` y `mergeCart` sin caché.
- **Simulado** (`lib/marketplace/mock/cart.ts`, `money.ts`): carrito por comprador en memoria,
  cotización con las reglas de la enmienda (C, D, E, G, J y K), errores por campo, y montos en
  céntimos enteros sólo en `mock/money.ts` (`contract.md` 1 lo permite ahora). Fixtures: tres
  tiendas que venden y tres que no, `offers_delivery` e `is_open` por tienda, un producto
  `controlled` (`clonazepam-0-5-mg-30-tabletas`).
- **Carrito de invitado y acciones** (`features/cart/`): cookie `mp_cart` con sus límites
  (`RN-CART-01`), `getCurrentCart` y `getSessionCart` (una lectura por petición), `addToCart`
  (suma 1; con sesión, si la API topa al stock responde "Sólo hay N unidades disponibles." en
  lugar de "Agregado"), `setQuantity` y `removeLine`; un 401 borra la sesión y sigue como
  invitado. Los límites 20, 99 y 120 salen de `CART_MAX_LINES`, `CART_MAX_QUANTITY` y
  `CART_SLUG_MAX_LENGTH`, exportados por `schemas.ts`.
- **Fusión** al entrar y al registrarse (`RN-CART-02`): con la API caída o un 429 conserva
  `mp_cart`; ante otro error de la API la borra; nunca impide el acceso.
- **"Agregar al carrito"** en las tres listas de ofertas de la ficha y en los productos de la
  tienda, sólo con el interruptor encendido, tienda con `accepts_orders` y producto sin restricción
  (`RN-CART-03`); los `recipe` y `controlled` muestran su nota en el panel de la ficha.
- **`/carrito`** (`noindex`, fuera de robots y del sitemap): tiendas con sus líneas, cantidades con
  "Quitar uno" y "Agregar uno", "Quitar", motivos de las líneas no disponibles, subtotales, total y
  tasa; vacío con "Buscar productos". **Contador** en la cabecera, junto a la cuenta, que degrada a
  "Carrito" ante cualquier error de la API (L-02).
- **Interruptor** (`RN-CART-04`): `MARKETPLACE_CART_ENABLED=1` o modo simulado.
- **Documentación**: README nuevo de `features/cart`; READMEs de `lib/marketplace`,
  `features/{product,store,account}`; reglas `contract.md` 1, `seo.md` 3 y 8, `tests.md` 7 y
  `app-router.md` 7; `docs/CAPABILITIES.md` (capacidad del carrito en `marketplace` y módulo
  `cart`).

## Diferencias contra el plan

1. **El stock simulado se deriva de `availability`** (`low` 3, `available` 50, sin oferta 99), no se
   guarda por oferta. La cotización también topa la cantidad al stock (la enmienda G sólo lo fija
   para `PUT` y `merge`): una cookie con 5 unidades de una oferta `low` se muestra con 3. Pendiente
   de acordar con posveapi.
2. **Nombre accesible del botón**: "Agregar al carrito: {producto} de {tienda}" (y "Agregar otro:
   …"), porque el del plan no contenía la etiqueta visible (WCAG 2.5.3).
3. **`addToCartState.ts`** guarda el estado del botón fuera de `actions.ts` (un archivo
   `"use server"` sólo exporta funciones async); **`getSessionCart`** en `server.ts` evita pedir el
   carrito dos veces por render.
4. **El tope de la cookie se mide con todas las líneas en 99**, para que ningún cambio de cantidad
   posterior lo pase en silencio.
5. **Con el carrito encendido, la nota "Requiere récipe, consúltalo en la tienda." reemplaza a la
   insignia "Requiere récipe"** del panel de la ficha (evita el texto duplicado).
6. **`mp_cart` inválida se reescribe en la siguiente escritura** en lugar de borrarse al leer
   (spec §6 dice "se ignora y se borra"): un Server Component no puede borrar cookies. La fusión sí
   la borra.
7. **La API caída en "Quitar uno", "Agregar uno" y "Quitar" va a `error.tsx`** (precedente de
   `deleteAddressAction`), no a un aviso en el formulario como dice §6; un 429 en esos tres
   controles también. En "Agregar" el 429 sí se avisa en el formulario: "Demasiados intentos.
   Prueba de nuevo en N segundos.", con N de `retryAfter`.
8. **Sin JavaScript no hay carrito en la práctica** (ver "Hallazgo" abajo): el caso e2e sin
   JavaScript que pedía la Task 5 quedó como `test.fixme`.
9. **Pruebas no pedidas por el plan**, útiles y declaradas: en `mock/cart.test.ts`, más de 20
   entradas, inexistentes omitidas, sin sesión y errores por campo; en `schemas.test.ts`, 20
   entradas aceptadas y los rechazos de cantidad 0, 100 y 21 entradas; en `money.test.ts`, céntimos
   negativos o no enteros; en `features/account/actions.test.ts`, la fusión ante un 429 y la
   ausencia de fusión con el carrito apagado.
10. **Detalles de interfaz fuera del plan**: una línea no disponible sólo atenúa la imagen
    (atenuar el texto bajaría su contraste); el número del contador es un `span` con las clases
    de la píldora y no un `Badge`; el enlace del contador lleva `rel="nofollow"` (`/carrito` es
    `noindex`).
11. **Exports que el plan no pedía**: `writeGuestCart` (`cookie.ts`, lo usan las acciones),
    `CartContent` (`CartView.tsx`, la parte síncrona que prueba `CartView.test.tsx`) y
    `accountError` y `customerIdFor` (`mock/accounts.ts`, los reutiliza `mock/cart.ts`).

## Hallazgo para quien coordina: sin JavaScript no hay carrito

La decisión 5 ("funciona sin JavaScript") no se cumple en la práctica. Con PPR, lo que una página
lee dentro de un `<Suspense>` (ofertas de la ficha, productos de la tienda, líneas de `/carrito`, la
cuenta y el contador de la cabecera) llega por streaming en un bloque oculto que revela un script.
Sin JavaScript ese contenido no aparece, así que el botón y los controles del carrito, aunque son
formularios, no se ven. Es anterior a este plan (ya pasaba con las ofertas y la cuenta) y no tiene
arreglo sin cambiar cómo se renderizan esas páginas (la regla `app-router.md` 2 obliga a leer
cookies y `searchParams` dentro de `<Suspense>`). Queda como `test.fixme` en `e2e/cart.spec.ts`.

## Verificación

- `tsc --noEmit`: sin errores. `eslint` sobre `app`, `features`, `components`, `lib` y `e2e`: sin
  salida.
- `vitest run` entero: 47 archivos, 343 pruebas, todas pasan.
- `next build` con `MARKETPLACE_MODE=mock SITE_URL=http://localhost:3000`: exit 0, 0 avisos
  `blocking-route`; `/carrito`, `/p/[slug]` y `/tienda/[slug]` en `◐`.
- Standalone en el puerto 3100 (modo simulado): 200 en `/`, `/p/acetaminofen-500-mg-20-tabletas`,
  `/tienda/farmacia-central-valencia` y `/carrito` (con "Tu carrito" y `noindex`); detenido, el
  puerto quedó libre.
- `playwright test` entero en simulado (configuración temporal con el Chromium del contenedor,
  borrada al terminar): 24 pasan y 1 `fixme`, tras los arreglos de la Task 5. Antes, con un servidor
  de desarrollo levantado a mano, `e2e/cart.spec.ts` pasó 4/4 dos veces seguidas contra el mismo
  servidor y el e2e completo 24/24 dos veces seguidas: el e2e es repetible con el estado del
  simulado acumulado.
- `CAPABILITIES.md` regenerado con la reproducción `gen-capabilities.mjs` del traspaso, validada
  idéntica al archivo de `77ca74e` (el script real de `posven` no está en la nube). En el cierre
  el módulo `cart` faltaba: el script lee `git ls-files` y su README aún no estaba en git. Se
  regeneró con los arreglos de la revisión final y ahora tiene la sección `## cart`.
- Tras los arreglos de la revisión final: `tsc` y `eslint` sin salida; `vitest run` entero 47
  archivos, 346 pruebas; `next build` exit 0 sin `blocking-route`; `playwright test` 24 pasan y
  1 `fixme`.
- **Sin comprobar**: el interruptor apagado en un build real en modo API (el build en modo API pide
  la API); lo cubren `flag.test.ts`, `CartLink.test.tsx`, `actions.test.ts` y las pruebas de ficha y
  tienda. La revisión visual en navegador la corre quien coordina.

## Deuda declarada

- **Lectura y escritura no atómicas**: dos pestañas de invitado que agregan a la vez se pisan;
  con sesión, dos clics simultáneos en "Agregar" suman uno (`getCart` y luego `PUT` actual + 1);
  "Quitar uno" desde una pestaña vieja sobre una línea ya quitada la recrea (el `PUT` es un upsert).
  Arreglarlo exige cambiar el contrato (p. ej. un `PATCH` con incremento).
- **Doble fusión**: si posveapi aplica el `merge` pero la respuesta pasa del tope de 5 s, la cookie
  se conserva y el siguiente login vuelve a sumar (con techo de stock). Pedir idempotencia al plan
  3 de posveapi.
- **El contador cuenta distinto según haya sesión**: el invitado cuenta las entradas de `mp_cart`
  (también las no disponibles y las fantasma); con sesión, `line_count` cuenta sólo las líneas
  `ok`. Al entrar, el número puede bajar sin que el comprador haya quitado nada.
- **Tope de stock del invitado**: sin sesión no se conoce el stock, así que "Agregar" responde
  "Agregado" aunque la cotización luego muestre menos unidades (diferencia 1).
- **Fusión fallida**: con la API caída o un 429, `mp_cart` se conserva pero no se ve mientras
  dure la sesión (con sesión se lee el carrito de la API) y se fusiona en el próximo login. Ante
  otro error de la API se borra y esas líneas se pierden.
- **Líneas fantasma del invitado**: una entrada con un slug inexistente cuenta en el contador,
  ocupa cupo y no sale en `/carrito` (la cotización la omite) hasta el login.
- **Motivos de `unavailable`**: la prioridad restringido > tienda que no vende > oferta
  desaparecida no la fija la enmienda; `out_of_stock` no se produce en el simulado (el contrato de
  lectura no tiene "agotado").
- **Foco**: al deshabilitar "Agregar" mientras está pendiente, al llegar "Quitar uno" a 1 o al
  quitar una línea, el foco cae al `body` (convención actual del repo con `disabled`).
- **§5.8**: el simulado no borra el carrito al eliminar la cuenta (inalcanzable: los tokens se
  revocan); llega con el plan 4b y el 409 `open_orders`.

## Pasos de deploy

- `MARKETPLACE_CART_ENABLED` queda **apagada en producción** hasta que posveapi despliegue su
  plan 3 (rutas de carrito y `accepts_orders`). Se lee al construir (lo prerenderizado queda
  fijado): encenderla exige reconstruir y debe estar también en el `next build` del CI de Gitea,
  no sólo en la ejecución. Conviene sumarla a `.env.example` (no se tocó: la sesión no lee
  archivos `.env*`).
- Con el interruptor apagado, esta rama puede mergearse a `main` sin cambios visibles en
  producción: sin botón, sin contador y `/carrito` da 404; `accepts_orders` ausente se lee `false`.
- Cuando posveapi envíe `accepts_orders`, pasarlo a obligatorio en `storeSummarySchema`.
- Depende de los planes 4 y 5 de shadcn (sin mergear): mergear `feat/ui-shadcn-mercado-deuda`,
  luego `feat/ui-shadcn-mercado-cabecera` y luego esta rama, con fast-forward.

## Cómo continuar

1. Revisión visual: "Agregar" en ficha y tienda, `/carrito` en móvil y escritorio (líneas no
   disponibles, cantidades, vacío), contador en la cabecera con y sin sesión.
2. Decidir el hallazgo sin JavaScript (aceptarlo o replantear el render de ficha, tienda y
   carrito).
3. Plan 3 de posveapi: rutas de §4.2 del carrito con la enmienda (G, J, K), `accepts_orders` en
   `StoreSummary`, idempotencia de `merge`, y acordar el techo de stock en la cotización.
4. Plan 4b del ecommerce: checkout, pago simulado, `/checkout/resultado`, compras, "Mis compras",
   el botón de pagar en `/carrito`, el 409 `open_orders` y el borrado del carrito al eliminar la
   cuenta.
