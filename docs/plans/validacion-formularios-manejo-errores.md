# Plan: validacion-formularios-manejo-errores

**Objetivo:** los formularios validan con zod en el servidor y en el cliente con mensajes en
español, y todo resultado de una acción (error general o éxito) se avisa con un toast de sonner,
incluidas las acciones que hoy fallan en silencio o tumban la página a `app/error.tsx`.
**Estado:** en curso · Fase actual: 6

## Contexto mínimo
- Spec: sin spec propia. Reglas de validación de la API: FormRequests de posveapi en
  `posveapi/app/Http/Requests/Marketplace/Customer/` y spec
  `posven/.claude/docs/specs/2026-09-29-cuentas-y-compras-design.md` (registro: contraseña de al
  menos 8).
- Repo: `posven-ecommerce` en `C:\Users\Windows 11\Documents\Development\posven\posven-ecommerce`,
  rama `main`.
- Restricciones: el contrato con posveapi (`lib/marketplace/schemas.ts`) no cambia; los esquemas de
  formulario van aparte, en `features/<f>/lib/formSchemas.ts`, y nunca son más estrictos que la
  API. El navegador nunca llama a posveapi. Reglas `ui.md` (sonner entra por `shadcn add`, sin
  modo oscuro, tokens), `app-router.md` (ítem 7 cambia: las acciones dejan de subir a
  `error.tsx`), `tests.md`, lecciones L-04 (Select y `key`) y L-05.
- Patrón actual: Server Actions con `useActionState`; `FormState` y `formStateFromError` en
  `features/account/lib/formState.ts`; avisos en `features/account/components/FormFeedback.tsx`;
  estados propios en `features/cart/lib/addToCartState.ts` y `features/checkout/lib/checkoutState.ts`.
- Verificación por fase: `tsc`, `eslint` y `vitest run` del área con las rutas absolutas del repo
  (CLAUDE.md del repo). Al cerrar el plan: `next build` en simulado y `playwright test` entero.

## Fases

### [x] Fase 1 — Infraestructura de toasts
- **Repo:** posven-ecommerce
- **Alcance:** `shadcn add sonner` (agrega la dependencia `sonner`); el componente generado se
  ajusta a `ui.md`: sin `next-themes` (no hay modo oscuro), colores por tokens, contraste AA.
  `<Toaster />` montado una vez en `app/layout.tsx` (no lee cookies ni `searchParams`, así que no
  necesita `Suspense`). Hook cliente `useActionToast(notice)` que recibe `{ kind: "error" |
  "success", message } | null` y dispara un toast por cada respuesta nueva (identidad del objeto
  de estado, sin repetir en el doble render de StrictMode). `ui.md` ítem 1 suma `Toaster` a las
  primitivas interactivas. Antes de tocar `layout.tsx`, leer la guía de Next en
  `node_modules/next/dist/docs/` que corresponda.
- **Archivos:** `components/ui/sonner.tsx` (nuevo), `app/layout.tsx`, `hooks/useActionToast.ts`
  (nuevo; la carpeta `hooks/` ya es alias en `components.json`), `package.json` (+ lock),
  `.claude/rules/ui.md`. Test: `hooks/__tests__/useActionToast.test.tsx`.
- **Terminado cuando:** el test del hook pasa (un toast por respuesta, ninguno con `null`, tipo
  correcto); `tsc` y `eslint` limpios sobre los archivos tocados; `vitest run hooks`.
- **Commit:** `feat(ui): toasts con sonner y hook useActionToast`

### [x] Fase 2 — Avisos de formularios con estado a toast
- **Repo:** posven-ecommerce
- **Alcance:** `FormNotice` pasa a disparar el toast (error y éxito) en vez de pintar el párrafo,
  lo que cubre los 11 formularios de cuenta sin tocarlos; `FieldError` sigue en línea.
  `AddToCartButton` y los errores generales de `CheckoutForm` también van a toast; los estados
  con UI propia del pago (`quote_changed`, `email_unverified`, `cart_empty`) se quedan. Ajustar
  los e2e que buscan el texto en línea (`account.spec.ts` "demasiados intentos", `checkout.spec.ts`
  "pago fallido"). README de `account`, `cart` y `checkout`.
- **Terminado cuando:** `vitest run features/account features/cart features/checkout` y los e2e
  ajustados pasan.

### [x] Fase 3 — Códigos de la API sin mapear dan mensaje, no `error.tsx`
- **Repo:** posven-ecommerce
- **Alcance:** `formStateFromError`, `failed` del carrito y `stateFrom` del pago devuelven un
  mensaje genérico ante un código no mapeado en lugar de relanzar; `unauthenticated` se sigue
  lanzando para que `withSession` redirija. `app-router.md` ítem 7 dice que las acciones no suben a
  `error.tsx`.
- **Terminado cuando:** tests de cada mapeador con un código no mapeado y con `unauthenticated`.

### [x] Fase 4 [riesgo] — Esquemas zod de cuenta y validación en las acciones
- **Repo:** posven-ecommerce
- **Alcance:** `features/account/lib/formSchemas.ts` con login, registro, recuperar, restablecer,
  perfil, contraseña, borrar cuenta y dirección, espejo de los FormRequests (máximos, regex de
  teléfono, contraseña 8 a 72, rango de lat/lng); `formStateFromZod` en `formState.ts`; las acciones
  de `actions.ts` y `accountActions.ts` validan antes de llamar a la API. `engineering.md` suma zod
  para formularios, separado del contrato. Riesgo: un esquema más estricto que la API bloquea
  envíos válidos.

### [x] Fase 5 — Validación en cliente de los formularios de acceso
- **Repo:** posven-ecommerce
- **Alcance:** hook `useFormValidation(schema)` que valida el `FormData` en `onSubmit`, cancela el
  envío si falla y combina sus errores con `state.fields`; aplicado a `LoginForm`, `RegisterForm`
  y `RecoveryForms`.

### [ ] Fase 6 — Validación en cliente de los formularios de la cuenta
- **Repo:** posven-ecommerce
- **Alcance:** el mismo hook en `ProfileForm`, `SettingsForms` y `AddressForm` (respetar L-04 con
  el Select de ciudad).

### [ ] Fase 7 — Acciones de direcciones con aviso
- **Repo:** posven-ecommerce
- **Alcance:** `setDefaultAddress` y `deleteAddressAction` devuelven estado en vez de `void`; sus
  botones de `app/cuenta/direcciones/page.tsx` pasan a un componente cliente con `useActionState` y
  toast. `not_found` deja de tragarse.

### [ ] Fase 8 — Favoritos con aviso
- **Repo:** posven-ecommerce
- **Alcance:** `toggleFavorite` devuelve estado; `FavoriteButton` y el formulario de
  `app/cuenta/favoritos/page.tsx` muestran el resultado en toast.

### [ ] Fase 9 — Líneas del carrito con aviso
- **Repo:** posven-ecommerce
- **Alcance:** `setQuantity` y `removeLine` devuelven estado (incluidos `not_orderable`,
  `product_restricted`, cantidad fuera de rango y referencia inválida); `LineForm` de `CartView`
  pasa a componente cliente con toast. Cierre del plan: `next build` en simulado y `playwright
  test` entero.

## Decisiones
- 2026-10-01 — Repo: sólo posven-ecommerce — elección del usuario.
- 2026-10-01 — Validación sólo con zod, sin react-hook-form ni Conform — encaja con Server Actions
  y `useActionState`, sin dependencias nuevas; el servidor es la validación autoritativa y el
  cliente reutiliza el mismo esquema.
- 2026-10-01 — Toasts con sonner vía `shadcn add` — aprobado por quien coordina (`ui.md` ítem 7).
- 2026-10-01 — Errores generales y éxitos van a toast; los errores de campo siguen en línea.
- 2026-10-01 — Se incluyen las acciones silenciosas (direcciones, favoritos, carrito) y los códigos
  no mapeados.
- 2026-10-01 — Fase 1: `next-themes` (traído por `shadcn add`) se desinstala; `Toaster` con
  `theme="light"` y tokens (`--popover`, `--popover-foreground`, `--input-border`, `--radius`).
  `useActionToast` deduplica por identidad con `useRef`, acepta `null`/`undefined` y exporta el
  tipo `ActionNotice` desde `@/hooks/useActionToast`.
- 2026-10-01 — Fase 2: excepción a "éxitos a toast": "Agregado · Ver carrito" de `AddToCartButton`
  sigue en línea porque lleva enlace. En `CheckoutForm` sólo `status: "error"` va a toast. El e2e
  "pago fallido" no cambió (afirma la vista de resultado); en `account.spec.ts` el aviso se busca
  con `page.getByText`. Contraste del ícono de error: `#b42318` sobre `#ffffff`, ~6,5:1 (AA).
- 2026-10-01 — Fase 3: un código no mapeado da mensaje genérico en español, no el texto de la API:
  `GENERIC_MESSAGE` en `formStateFromError`, `ADD_FAILED` en el carrito (conserva el de la API
  sólo para `API_MESSAGE_CODES`: `not_orderable`, `product_restricted`, `cart_full`,
  `validation_failed`) y `PAY_FAILED` en `stateFrom` (conserva el de la API para
  `validation_failed` y `not_found`). Sólo `unauthenticated` se relanza.
- 2026-10-01 — Fase 4: esquemas en `features/account/lib/formSchemas.ts` (zod 4.6.5), espejo de
  los FormRequests con `TrimStrings` (no recorta `password` ni `current_password`) y longitudes por
  `Array.from(v).length`; el email sólo exige texto a ambos lados de `@` (RFC, `unique` y `exists`
  quedan para la API); `@anonimo.invalid` se rechaza sólo en registro y perfil.
  `formStateFromZod(error, values)` da "Revisa los datos del formulario." y el primer mensaje por
  clave de la API. Las acciones validan antes de `accountContext`/`withSession` y mandan los
  valores crudos. `addressCoordsSchema` reemplaza a `isValidCoords` en account. Quien coordina
  pidió `formSchemas.test.ts` como criterio verificable del riesgo.
- 2026-10-01 — Fase 5: `useFormValidation(schema, actionState)` en `hooks/` devuelve
  `{ onSubmit, state }`; los errores del cliente pisan a los del servidor y se limpian al enviar
  válido; al fallar enfoca el primer control inválido en orden del DOM tras el render. Los
  formularios llevan `noValidate` y `FormNotice` recibe el estado crudo (sin toast repetido). El
  hook se documenta en el README de account; no hay README de `hooks/`.

## Notas para la próxima sesión
- Fase 9: `writeQuantity` (`setQuantity`, `removeLine`) aún lanza ante un código no mapeado
  salvo `not_orderable` y `product_restricted`.
- Fase 6: el hook toma el `FormData` crudo; perfil puede necesitar una transformación antes de
  validar. `firstInvalidControl` busca controles con `name`: revisar que el Select de ciudad de
  Radix reciba el foco. Si el hook se usa fuera de account, mover `FormState` y
  `formStateFromZod` a un lugar compartido.
- Fase 9: `docs-check` marca rancio `features/cart/README.md` porque `features/account/server/actions.ts`
  cambió en la Fase 4; sus afirmaciones siguen ciertas y se refresca al commitear el README de cart.
- Fase 6: `profileSchema` necesita que el cliente arme `email` y `current_password` sólo
  cuando cambia el correo, igual que `updateProfile`.
- Fase 4 en adelante: `useActionToast` y `ActionNotice` en `@/hooks/useActionToast`; `FormNotice`
  ya dispara el toast. Pendiente menor sin fase: `VerifyEmailForm` en `success` queda sin texto de
  confirmación en línea una vez cerrado el toast.
- El grafo de posven-ecommerce es del 2026-09-28 y no tiene `features/account`, `cart` ni
  `checkout`: explorar con Grep/Read dirigidos.
