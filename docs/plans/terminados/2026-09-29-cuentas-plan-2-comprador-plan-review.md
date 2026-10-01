# Revisión del plan: cuentas plan 2, comprador en el ecommerce

Plan: `posven-ecommerce/docs/plans/2026-09-29-cuentas-plan-2-comprador.md`. Árbol
`posven-ecommerce`, rama `main`, HEAD `f3381f6`; contrato contra posveapi `feat/marketplace-cuentas`
`9a8bfc12`. Spec: `posven/.claude/docs/specs/2026-09-29-cuentas-y-compras-design.md`. Revisor:
`plan-reviewer`, despachado por quien coordina; enmiendas aprobadas por el usuario.

Veredicto: **ejecutable tras enmiendas** (aplicadas).

## Hallazgos

1 bloqueante y 10 no bloqueantes.

1. **Bloqueante.** `deleteAccountAction` (Task 3) borraba `mp_session` importando
   `SESSION_COOKIE`, sin las opciones de la Restricción 4: un borrado sin `path: "/"` puede dejar
   la cookie viva. Cambió: la Task 2 produce `endSession(to): Promise<never>` en `session.ts`, que
   borra con el `path` de la Restricción 4 y redirige; la usan `withSession`, `logout`,
   `resetPasswordAction` y `deleteAccountAction`; `SESSION_COOKIE` sale del Consume de la Task 3.
2. `/cuenta` pintaba "Reenviar verificación" sin un componente que lo produjera. Cambió: la Task 2
   produce `ResendVerificationForm()` en `VerifyEmailForm.tsx` y la Task 3 lo consume.
3. `FieldError` armaba `id="<campo>-error"`: chocan dos `password` en configuración y un
   `AddressForm` por dirección. Cambió: `FieldError({ id, state, name })` y prefijo de `useId()`
   por formulario (Restricción 9); el caso 5 del e2e ubica el alta como región "Agregar
   dirección".
4. El simulado no fijaba el orden ni el caso `is_default: false`. Cambió: direcciones con la
   predeterminada primero y luego id ascendente, favoritos del más reciente al más antiguo
   (`MarketplaceCustomerRepository.php:23-24` y `:36`), y `is_default: false` no cambia la marca
   (RN-MKT-17); tres casos nuevos en `mock/accounts.test.ts`.
5. La nota de despliegue de `X-Client-IP` no tenía portador. Cambió: va a
   `features/account/README.md` (Task 2) y a "Pendientes del cierre".
6. La Task 4 (e2e y reglas) no tenía razón propia: el e2e cierra lo de la 3 y la regla `seo.md`
   describe lo que hace la 2. Cambió: plan de 3 tareas; `e2e/account.spec.ts` y `tests.md` 7 en
   la Task 3; `seo.md` en la Task 2 junto con `robots.ts`; Composición, Mapa y cifras al día.
7. "Tarjetas enlazadas del recetario de `ui.md`": `ui.md` no tiene el recetario. Cambió: la cadena
   de clases copiada de `docs/plans/2026-09-28-visual-moderna.md` Restricción 3.
8. El contenedor de `AccountSlot` no se alineaba cuando `HeaderSearchSlot` no pinta. Cambió:
   `ml-auto shrink-0` y caso 9 del e2e en móvil (sin desborde horizontal).
9. Los casos 5 y 6 del e2e usaban el comprador sembrado, que otras corridas mutan, y el 6 no decía
   que el primer toque sólo lleva a entrar. Cambió: comprador registrado con correo único por
   corrida; el 6 toca "Guardar en favoritos" de nuevo tras entrar.
10. El criterio del build era "igual que en `main`". Cambió: valor esperado `◐` (Partial
    Prerender, `build/utils.js:319`) en `/`, `/p/[slug]`, `/tienda/[slug]` y `/entrar`, ninguna
    `ƒ`, y cero avisos `blocking-route`; con el `grep` que lo comprueba sobre el log del build.
11. La Task 1 no daba la ruta de seis funciones y contaba 13 archivos. Cambió: rutas de
    `resetPassword`, `getMe`, `listAddresses`, `createAddress`, `deleteAddress` y
    `listFavorites` desde `api.php:27-50`; 14 archivos.

## Verificado sin hallazgo

Contrato real: rutas y middlewares de `routes/Modules/Marketplace/api.php:27-50`, forma de
`CustomerResource` y `CustomerAddressResource`, códigos y mensajes de
`CustomerAccountException`, mensajes de campo de los FormRequests, `ClientIp::resolve` y la regex
del token de `EnsureMarketplaceCustomer`. Anclas en el árbol: `app/layout.tsx:44-55`,
`app/robots.ts:8`, `app/p/[slug]/page.tsx:98`, `app/tienda/[slug]/page.tsx:55`,
`.claude/rules/contract.md:22-24`, `tests.md:34-35`, `seo.md:28-31` y `:52`,
`schemas.ts:36-47`, `features/location/cookie.ts:16`, `LocationBar.tsx:17-34`,
`LocationPicker.tsx:33-51`, `node_modules/next/dist/server/base-server.js:612` y la guía
`proxy.md`; el build previo marca `postponed` en `/` y en las fichas. Identificadores:
`RN-MARKETPLACE-05` a `07` siguen a `04` sin choque, `RN-ACCOUNT-01` a `06` estrenan prefijo, todos
bajo 240 caracteres; ningún `L-` nuevo. Arrastres del plan 1: RN-MKT-19 (contraseña actual al
cambiar el correo) en perfil, el 409 `open_orders` diferido al plan 3, `X-Client-IP` desde el BFF
y `MARKETPLACE_STOREFRONT_URL` en la verificación manual.

## Qué cambió en el plan

Los 11 hallazgos aplicados en el plan. En "Pendientes del cierre" quedan, con destino plan 3 de
posveapi, el 429 global sin `Retry-After` ni cuerpo `{ error }` (`bootstrap/app.php:88-95`) y los
mensajes de validación con nombres de campo en inglés (`attributes` vacío en `lang/es`); además la
nota de `X-Client-IP` y `MARKETPLACE_STOREFRONT_URL` en `.env.example`, pendiente del usuario.

## Lentes usadas

Costuras, cobertura de spec, arrastres, restricciones propias, valores exactos, modelo,
identificadores, cifras, composición, granularidad y anclaje en el árbol.
