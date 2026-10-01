# Plan 2 de cuentas y compras: acceso y cuenta del comprador en el ecommerce

modo: ligero

## Contexto

El buscador pasa a vender (spec cruzada `2026-09-29-cuentas-y-compras-design.md`). Este plan es
la fila 2 de su §8: el comprador se registra, entra, verifica su correo, recupera la contraseña,
edita su perfil, guarda direcciones y favoritos, configura avisos y elimina su cuenta desde el
ecommerce, contra un simulado que cumple el contrato que posveapi ya tiene en
`feat/marketplace-cuentas` (`9a8bfc12`, plan 1). La cabecera suma "Entrar" o el menú de la cuenta.
Desbloquea el plan 4 (carrito, checkout y compras), que cuelga de la sesión que este plan crea.

Queda afuera: carrito, `mp_cart`, checkout, compras, "Últimas compras" de `/cuenta` y el contador
del carrito (plan 4), y el 409 `open_orders` de `DELETE /me` (llega con el plan 3 de posveapi;
hasta entonces un 409 es falla de la API). No se toca ningún campo existente del contrato de
lectura. posveapi no cambia en este plan: `feat/marketplace-cuentas` sigue sin merge ni push.

## Spec

`posven/.claude/docs/specs/2026-09-29-cuentas-y-compras-design.md`: §1 decisiones 7, 8 y 14; §2
(Next como BFF, tabla de rutas sin `/carrito`, `/checkout` ni `/cuenta/compras`, cabecera en su
`<Suspense>`, botón de favorito en su `<Suspense>`, cookie `mp_session`); §4 (errores); §4.1
Customer y Address; §4.2 filas de `POST /customers` a `PUT/DELETE /me/favorites/...` y el párrafo
de límites y `X-Client-IP`; §5.1; §5.8 (eliminar y favoritos, sin el bloqueo por pedidos); §6
filas "API caída", 401, 422, 429 y vacíos de direcciones y favoritos; §7 viñeta posven-ecommerce
salvo carrito, fusión, pago y compras. Contrato verificado contra posveapi `9a8bfc12`:
`routes/Modules/Marketplace/api.php:27-50`, `app/Exceptions/Marketplace/CustomerAccountException.php`,
`app/Http/Requests/Marketplace/Customer/*`, `app/Http/Resources/Marketplace/{CustomerResource,CustomerAddressResource}.php`,
`app/Services/Marketplace/ClientIp.php`, `app/Http/Middleware/{EnsureMarketplaceKey,EnsureMarketplaceCustomer}.php`
y `docs/modules/marketplace/README.md` §2 (RN-MKT-12 a 19).

Decisiones del usuario al planificar (textuales):

- `/cuenta`: "Accesos y aviso de verificación (Recomendado)": saludo, estado del correo con
  "reenviar verificación" y enlaces a perfil, direcciones, favoritos y configuración.
- Favoritos: "Sí, en el plan 2 (Recomendado)": botón en ficha de producto y de tienda, cada uno en
  su `<Suspense>`; sin sesión lleva a `/entrar?volver=<ruta>`; más `/cuenta/favoritos`.
- Rama: "feat/cuentas-comprador (Recomendado)", sin push.

## Restricciones globales

1. **Contrato de cuentas** (spec de cuentas §4, §4.1 y §4.2; la regla `contract.md` 4 pasa a
   citarla en la Task 1). Esquemas zod en `lib/marketplace/schemas.ts`, tipos por `z.infer`, sin
   tocar ningún esquema existente. Customer = `name`, `email`, `phone`, `email_verified` (bool),
   `pending_email` (string o null), `settings: { order_status_emails }` (bool). Address = `id`
   (entero), `label`, `recipient_name`, `phone`, `city: { slug, name }`, `line`, `reference`
   (string o null), `lat`, `lng` (número), `is_default` (bool). Registro y login
   `{ token, customer }`; un recurso `{ data: X }`; lista `{ data: [Address] }`; favoritos
   `{ products: [Product], stores: [StoreSummary] }` con `productSchema` y `storeSummarySchema`
   existentes; 204 y 202 sin cuerpo. El token cumple `^\d{1,18}\|.+$`
   (`EnsureMarketplaceCustomer.php`).
2. **Errores de la API** (`CustomerAccountException.php`): cuerpo
   `{ "error": { "code", "message", "fields"?, "retry_after"? } }`. Códigos y mensajes exactos:
   401 `unauthenticated` "Inicia sesión para continuar."; 404 `not_found` "No encontrado."; 422
   `validation_failed` "Revisa los datos del formulario." (con `fields`, mapa campo a primer
   mensaje); 422 `invalid_credentials` "Correo o contraseña incorrectos."; 422 `token_invalid` "El
   enlace no es válido."; 422 `token_expired` "El enlace venció. Pide uno nuevo."; 429
   `too_many_attempts` "Demasiados intentos. Prueba de nuevo en <N> segundos." (con
   `retry_after`). Mensajes de campo que el ecommerce muestra tal cual: "El correo ya está
   registrado.", "El correo no es válido.", "La ciudad no es válida.", "Ingresa tu contraseña
   actual para cambiar el correo." y "La contraseña actual no es correcta." (RN-MKT-19, campo
   `current_password`), "La contraseña no es correcta." (campo `password` de `DELETE /me`).
3. **Qué es falla de la API y qué vuelve al formulario.** `MarketplaceAccountError` (nuevo, en
   `lib/marketplace/errors.ts`) sólo para 401, 404, 422 y 429 cuyo cuerpo pasa el esquema de
   error, más el 429 sin ese cuerpo (límite global, `bootstrap/app.php:88-95` de posveapi, cuerpo
   `{ success, message, status }`). Todo lo demás (401 `{ "message": "Unauthenticated." }` sin
   clave de servidor, 403, 409, 5xx, red, tiempo agotado, cuerpo 2xx que no pasa su esquema) es
   `MarketplaceUnavailableError`, como hoy. `retryAfter` = `error.retry_after`; si no viene, el
   entero del encabezado `Retry-After`; si tampoco, `60`.
4. **Sesión** `mp_session`: valor = token del comprador; opciones exactas
   `{ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 2592000 }`.
   Un valor que no cumple `^\d{1,18}\|.+$` o pasa de 512 caracteres equivale a no tener sesión (no
   se llama a la API con él). Sólo una Server Action o un Route Handler la escriben o borran (guía
   `cookies.md`, "Good to know"). Un 401 `unauthenticated` borra la cookie; un 401 sin esa forma
   no (spec §6).
5. **Nada del comprador en `'use cache'`** ni en `generateMetadata`: toda lectura de
   `mp_session`, `headers()`, `params` de `[token]` o `searchParams` va en un componente dentro de
   `<Suspense>` con su fallback (`.claude/rules/app-router.md` reglas 2 y 3). Inicio, producto y
   tienda siguen prerenderizados: la cabecera y el botón de favorito son islas en su `<Suspense>`.
6. **`volver`**: sólo rutas internas, `safeReturnPath` (Task 2): cadena que empieza con `/`, no
   con `//` ni `/\`, sin `\` ni caracteres de control, de hasta 512 caracteres; si no, `/cuenta`.
7. **IP del cliente** para `X-Client-IP` (spec §4.2): el último valor de `x-forwarded-for`
   (`headers()`), sin espacios, si `isIP` de `node:net` lo acepta (distinto de 0); si no, el
   encabezado no se manda y posveapi usa la IP de la conexión (`ClientIp.php:14-25`). Next sólo
   escribe `x-forwarded-for` si falta (`node_modules/next/dist/server/base-server.js:612`): sin
   un proxy delante que lo reescriba, el navegador controla ese valor y esquiva el límite de 5
   intentos de login por correo e IP. La nota de despliegue va en `features/account/README.md`
   (Task 2) y en "Pendientes del cierre".
8. **Textos de UI exactos** en español neutro, sin voseo, los de cada tarea; la marca sólo por
   `SITE_NAME`. Aviso de API caída en un formulario: "No pudimos conectar con el servicio.
   Intenta de nuevo en unos segundos."; 429: "Demasiados intentos, prueba en {N} segundos" con
   `retryAfter`. Los formularios conservan lo escrito salvo las contraseñas (spec §6).
9. **UI** (`.claude/rules/ui.md`): primitivas `Button`, `Input`, `Card`, `Badge`, `Skeleton` sin
   cambios; colores sólo por tokens (errores de campo en `text-warning`, sin color nuevo); íconos
   de `lucide-react` con `aria-hidden`; cada control con su `<label>`; cada formulario toma un
   prefijo con `useId()` y lo usa en los `id` de sus controles y errores, porque una página tiene
   formularios con el mismo campo (dos `password` en configuración, un `AddressForm` por
   dirección); el error de campo va en un `<p id="<prefijo>-<campo>-error">` enlazado con
   `aria-describedby` y `aria-invalid`. Server Components
   por defecto; `"use client"` sólo en los formularios con `useActionState` (guía
   `02-guides/forms.md`, "Validation errors" y "Pending states") y en el de dirección.
10. **Metadatos** (`.claude/rules/seo.md`): cada ruta nueva exporta `metadata` estático con su
    `title` propio (la plantilla pone la marca) y `robots: { index: false, follow: false }`; ninguna
    entra al sitemap (`lib/sitemap.ts` no cambia).
11. **Contrato del simulado** (`.claude/rules/contract.md` regla 5): `mock/adapter.ts` exporta las
    mismas funciones con las mismas firmas que `client.ts`; su estado vive en `globalThis`, no en
    una variable de módulo, porque el servidor de desarrollo puede evaluar el módulo más de una
    vez.
12. **Commits** en `feat/cuentas-comprador`, conventional commit en español, sin
    `Co-Authored-By` ni atribución; sin push; `.env` no se lee, no se imprime ni se edita.

## Repos y ramas

Todo en `posven-ecommerce`, árbol `C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce`,
rama nueva `feat/cuentas-comprador` creada desde `main` (`f3381f6`) por quien ejecuta, antes de la
Task 1: `git -C "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce" switch -c feat/cuentas-comprador main`.
Sin push ni merge.

## Identificadores que estrena

Catálogo actual: `RN-MARKETPLACE-01` a `04` (`lib/marketplace/README.md`); no hay `RN-ACCOUNT-`.

- `RN-MARKETPLACE-05` (Task 1): "Un 401, 404, 422 o 429 con cuerpo `{ error: { code, message } }`
  llega como `MarketplaceAccountError`; un 401 sin esa forma o cualquier otro estado no 2xx es API
  caída."
- `RN-MARKETPLACE-06` (Task 1): "Un 429 da los segundos de `retry_after`; sin cuerpo de error, los
  del encabezado `Retry-After`; sin encabezado, 60."
- `RN-MARKETPLACE-07` (Task 1): "Las llamadas de cuenta mandan `X-Marketplace-Customer` sólo con
  sesión y `X-Client-IP` sólo con IP; las de catálogo no mandan ninguno de los dos."
- `RN-ACCOUNT-01` (Task 2): "`mp_session` es `httpOnly`, `SameSite=Lax`, `Path=/`, de 30 días y
  `Secure` en producción; un valor que no cumple `^\d{1,18}\|.+$` equivale a no tener sesión."
- `RN-ACCOUNT-02` (Task 2): "`volver` sólo acepta rutas internas: empieza con `/` y no con `//`
  ni `/\`; cualquier otro valor vuelve a `/cuenta`."
- `RN-ACCOUNT-03` (Task 2): "Un 401 `unauthenticated` borra `mp_session` y lleva a
  `/entrar?volver=`; un 401 sin esa forma es API caída y conserva la cookie."
- `RN-ACCOUNT-04` (Task 2): "La IP del cliente es el último valor de `x-forwarded-for` si `isIP`
  lo acepta; si no, no se manda `X-Client-IP`."
- `RN-ACCOUNT-05` (Task 3): "La cabecera y el botón de favorito leen la sesión en su
  `<Suspense>`; con la API caída la cabecera muestra "Entrar" y el botón no se pinta."
- `RN-ACCOUNT-06` (Task 3): "Una dirección nueva sólo se envía con las coordenadas de "Usar mi
  ubicación"; sin ellas el botón de guardar queda deshabilitado."

Ningún `L-` nuevo.

## Mapa de archivos

Rutas relativas al árbol.

| Archivo | Qué | Task |
|---|---|---|
| `lib/marketplace/schemas.ts` | suma esquemas de cuenta al final | 1 |
| `lib/marketplace/errors.ts` | suma `MarketplaceAccountError` | 1 |
| `lib/marketplace/params.ts` | suma los tipos `AccountContext` y `FavoriteTarget` | 1 |
| `lib/marketplace/http.ts` | métodos con cuerpo, encabezados de cuenta, `accountRequest`, `accountCommand` | 1 |
| `lib/marketplace/client.ts` | diecinueve funciones de cuenta | 1 |
| `lib/marketplace/mock/accounts.ts` (crea) | simulado de cuentas con estado en `globalThis` | 1 |
| `lib/marketplace/mock/fixtures.ts` | comprador sembrado y tokens fijos | 1 |
| `lib/marketplace/mock/adapter.ts` | reexporta las funciones de `accounts.ts` | 1 |
| `lib/marketplace/http.test.ts` | casos de cuenta | 1 |
| `lib/marketplace/schemas.test.ts` | respuestas de cuenta del simulado contra sus esquemas | 1 |
| `lib/marketplace/mock/accounts.test.ts` (crea) | reglas del simulado | 1 |
| `lib/marketplace/README.md` | exports, §2 a §5, §8, §9 | 1 |
| `.claude/rules/contract.md` | regla 4 cita la spec de cuentas §4 | 1 |
| `docs/CAPABILITIES.md` | regenera | 1, 2, 3 |
| `features/account/returnPath.ts` (crea) | `safeReturnPath`, `loginHref` | 2 |
| `features/account/formState.ts` (crea) | estado de formulario y traducción de errores | 2 |
| `features/account/session.ts` (crea) | cookie, IP, comprador actual, `requireCustomer`, `withSession`, `endSession` | 2 |
| `features/account/actions.ts` (crea) | acciones de acceso | 2 |
| `features/account/FormFeedback.tsx` (crea) | aviso de formulario y error de campo | 2 |
| `features/account/LoginForm.tsx`, `RegisterForm.tsx`, `RecoveryForms.tsx`, `VerifyEmailForm.tsx` (crea) | formularios de acceso y de reenvío de verificación | 2 |
| `app/entrar/page.tsx`, `app/registro/page.tsx`, `app/recuperar/page.tsx`, `app/restablecer/[token]/page.tsx`, `app/verificar/[token]/page.tsx` (crea) | páginas de acceso | 2 |
| `app/api/sesion/vencida/route.ts` (crea) | borra `mp_session` y lleva a `/entrar` | 2 |
| `proxy.ts` (crea) | `/cuenta/*` sin cookie redirige a `/entrar?volver=` | 2 |
| `app/robots.ts` | excluye `/cuenta`, `/restablecer/`, `/verificar/` | 2 |
| `.claude/rules/seo.md` | `noindex` y robots de las rutas de acceso y de cuenta | 2 |
| `features/account/returnPath.test.ts`, `session.test.ts`, `actions.test.ts` (crea) | sus casos | 2 |
| `features/account/README.md` (crea, amplía en 3) | ficha del módulo | 2, 3 |
| `features/account/accountActions.ts` (crea) | acciones de perfil, contraseña, avisos, eliminar, direcciones y favoritos | 3 |
| `features/account/AccountMenu.tsx` (crea) | `AccountSlot` y su esqueleto | 3 |
| `features/account/FavoriteButton.tsx` (crea) | botón de favorito y su esqueleto | 3 |
| `features/account/ProfileForm.tsx`, `AddressForm.tsx`, `SettingsForms.tsx` (crea) | formularios de cuenta | 3 |
| `app/cuenta/layout.tsx`, `app/cuenta/page.tsx`, `app/cuenta/perfil/page.tsx`, `app/cuenta/direcciones/page.tsx`, `app/cuenta/favoritos/page.tsx`, `app/cuenta/configuracion/page.tsx` (crea) | páginas de cuenta | 3 |
| `app/layout.tsx` | `AccountSlot` en la cabecera | 3 |
| `app/p/[slug]/page.tsx`, `app/tienda/[slug]/page.tsx` | botón de favorito | 3 |
| `features/account/accountActions.test.ts`, `AccountMenu.test.tsx` (crea) | sus casos | 3 |
| `e2e/account.spec.ts` (crea) | flujo de cuenta en simulado | 3 |
| `.claude/rules/tests.md` | `e2e/account.spec.ts` en el e2e de cierre | 3 |

## Composición

- Task 1, contrato y simulado (`opus`, `review: yes`): define el contrato de cuentas que todo lo
  demás consume, y el simulado con las mismas firmas. Razón 3 del modo ligero (define contrato).
  14 archivos.
- Task 2, sesión y acceso (`opus`, `review: yes`): cookie, IP, `volver`, borrado ante 401, las
  cinco páginas de acceso, robots y la regla `seo.md` que los describe. Toca seguridad (sesión,
  cookies, entrada del público). Razón 5: junto a la 1 no se revisa en una pasada. ~24 archivos.
- Task 3, cuenta, cabecera, favoritos y e2e (`sonnet`): pantallas que consumen las firmas de la 1
  y los ayudantes de sesión de la 2 sin tocar la cookie más que por `withSession` y `endSession`,
  y el e2e que recorre todo en simulado con su línea en `tests.md` 7. Razón 5 y 7 (sumada a la 2
  pasa de 25 archivos). ~23 archivos.

Costuras: `MarketplaceAccountError`, `AccountContext` y las funciones de `client.ts` nacen en la 1;
`safeReturnPath`, `loginHref`, `FormState`, `formStateFromError`, `accountContext`,
`getCurrentCustomer`, `requireCustomer`, `withSession`, `endSession`, `FormNotice`, `FieldError`
y `ResendVerificationForm` nacen en la 2 y los consume la 3; el e2e de la 3 busca los textos de la
2 y de la 3.

### Task 1: Contrato de cuentas en lib/marketplace y simulado

repo: posven-ecommerce
model: opus
mechanical: no
review: yes
commit: feat(marketplace): contrato de cuentas del comprador y simulado

Lee antes `.claude/rules/contract.md`, `.claude/rules/tests.md`, `posven/.claude/rules/module-readme.md`,
`posven/.claude/docs/conventions/module-readme.md` y las Restricciones 1 a 3 y 11. Contrato de
referencia: los archivos de posveapi citados en "Spec" (léelos con
`git -C "C:/Users/Windows 11/Documents/Development/posven/posveapi" show feat/marketplace-cuentas:<ruta>`
si el árbol de posveapi está en otra rama).

**Produce**

- `schemas.ts`, al final, sin tocar lo existente: `accountErrorCodeSchema` (`z.enum` de los siete
  códigos de la Restricción 2) / `AccountErrorCode`; `accountErrorBodySchema = { error: { code,
  message: string, fields?: z.record(z.string(), z.string()), retry_after?: z.int().min(0) } }`;
  `customerSchema` / `Customer`; `customerEnvelopeSchema = { data: customerSchema }`;
  `authResponseSchema = { token: z.string().regex(/^\d{1,18}\|.+$/), customer: customerSchema }` /
  `AuthResponse`; `addressSchema` / `Address` (`id: z.int().min(1)`, `city: cityRefSchema`, `lat`
  en [-90, 90], `lng` en [-180, 180]); `addressEnvelopeSchema`, `addressListSchema = { data:
  z.array(addressSchema) }`; `addressInputSchema` / `AddressInput` (`label`, `recipient_name`,
  `phone`, `city_slug`, `line`: string; `reference: string | null`; `lat`, `lng`: number;
  `is_default?: boolean`); `addressPatchSchema = addressInputSchema.partial()` / `AddressPatch`;
  `registerInputSchema` / `RegisterInput` (`name`, `email`, `phone`, `password`);
  `profilePatchSchema` / `ProfilePatch` (`name?`, `phone?`, `email?`, `current_password?`);
  `favoritesResponseSchema = { products: z.array(productSchema), stores: z.array(storeSummarySchema) }`
  / `FavoritesResponse`.
- `errors.ts`: `class MarketplaceAccountError extends Error { readonly status: number; readonly
  code: AccountErrorCode; readonly fields: Record<string, string> | null; readonly retryAfter:
  number | null; constructor(p: { status: number; code: AccountErrorCode; message: string;
  fields?: Record<string, string> | null; retryAfter?: number | null }) }`, `name =
  "MarketplaceAccountError"`, `message` = el de la API. Importa sólo el tipo de `schemas.ts`.
- `params.ts` (tipos a mano, no son contrato): `type AccountContext = { session: string | null;
  clientIp: string | null }` y `type FavoriteTarget = { kind: "product" | "store"; slug: string }`.
- `http.ts`: `exchange` acepta `method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"` y su `catch`
  relanza también `MarketplaceAccountError` sin envolverla. `type AccountRequest = { method:
  "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; path: string; ctx: AccountContext; body?: unknown }`
  (exportado). `accountRequest<T>(req: AccountRequest, schema: z.ZodType<T>): Promise<T>` (2xx
  con cuerpo, validado con `parseBody`) y `accountCommand(req: AccountRequest): Promise<void>` (2xx,
  descarta el cuerpo). Encabezados: los de hoy más `Content-Type: application/json` sólo si hay
  `body`, `X-Marketplace-Customer: <ctx.session>` sólo si no es null, `X-Client-IP: <ctx.clientIp>`
  sólo si no es null. Un no 2xx pasa por `readAccountError(path, response)` (privada) con la
  Restricción 3. `requestJson`, `requestJsonOrNull` y `postJson` no cambian de firma ni de
  encabezados.
- `client.ts`, sin `'use cache'` y con `if (usesMock()) return mock.<misma>(...)` al inicio:
  `registerCustomer(ctx, input: RegisterInput): Promise<AuthResponse>` (`POST /customers`);
  `loginCustomer(ctx, input: { email: string; password: string }): Promise<AuthResponse>`
  (`POST /auth/login`); `logoutCustomer(ctx): Promise<void>` (`POST /auth/logout`);
  `requestPasswordReset(ctx, email: string): Promise<void>` (`POST /auth/password/forgot`, cuerpo
  `{ email }`); `resetPassword(ctx, input: { token: string; password: string }): Promise<void>`
  (`POST /auth/password/reset`); `verifyEmail(ctx, token: string): Promise<void>`
  (`POST /auth/email/verify`, `{ token }`); `resendVerification(ctx): Promise<void>`
  (`POST /auth/email/resend`); `getMe(ctx): Promise<Customer>` (`GET /me`); `updateMe(ctx,
  patch: ProfilePatch): Promise<Customer>` (`PATCH /me`);
  `changePassword(ctx, input: { current_password: string; password: string }): Promise<void>`
  (`PUT /me/password`); `updateSettings(ctx, input: { order_status_emails: boolean }):
  Promise<Customer>` (`PATCH /me/settings`); `deleteAccount(ctx, input: { password: string }):
  Promise<void>` (`DELETE /me`); `listAddresses(ctx): Promise<Address[]>` (`GET /me/addresses`);
  `createAddress(ctx, input: AddressInput): Promise<Address>` (`POST /me/addresses`);
  `updateAddress(ctx, id: number, patch: AddressPatch): Promise<Address>`
  (`PATCH /me/addresses/{id}`); `deleteAddress(ctx, id: number): Promise<void>`
  (`DELETE /me/addresses/{id}`); `listFavorites(ctx): Promise<FavoritesResponse>`
  (`GET /me/favorites`); `addFavorite(ctx, target: FavoriteTarget):
  Promise<void>` (`PUT /me/favorites/products/{slug}` o `.../stores/{slug}`, slug con
  `encodeURIComponent`); `removeFavorite(ctx, target): Promise<void>` (`DELETE`). `ctx` es
  `AccountContext` en todas. Los `{ data }` se desenvuelven en `client.ts`.
- `mock/accounts.ts` (sin `server-only`, como `adapter.ts`): las diecinueve funciones con las
  mismas firmas, y `resetMockAccounts(): void` (sólo para tests). `mock/adapter.ts` las reexporta
  (`export { ... } from "./accounts"`), sin `resetMockAccounts`.
- `mock/fixtures.ts`: `MOCK_ACCOUNT_SEED`, `MOCK_VERIFY_TOKEN`, `MOCK_RESET_TOKEN`,
  `MOCK_EXPIRED_TOKEN`, `MOCK_RATE_LIMITED_EMAIL` (valores abajo).

**Consume**: `productSchema`, `storeSummarySchema`, `cityRefSchema` (`schemas.ts`);
`MOCK_PRODUCTS`, `MOCK_UNAVAILABLE_PRODUCTS`, `MOCK_STORES`, `MOCK_LOCATIONS` (`mock/fixtures.ts`).

**Archivos**

- modifica: `lib/marketplace/schemas.ts` (después de la línea 244), `errors.ts:1-9`,
  `params.ts` (al final), `http.ts:1-97`, `client.ts:1-130`, `mock/adapter.ts:1-39` y final,
  `mock/fixtures.ts:1-12` y final
- crea: `lib/marketplace/mock/accounts.ts`
- modifica: `lib/marketplace/README.md` (`exports`, `verified_against`, `capabilities` con una
  entrada por grupo: acceso, perfil y configuración, direcciones, favoritos; §2 con
  RN-MARKETPLACE-05 a 07; §3 fila "Endpoint de cuenta nuevo"; §4 firmas nuevas; §5 filas
  `accountRequest`, `accountCommand`, "Simulado de cuentas"; §8 "las funciones de cuenta no se
  cachean"; §9 casos nuevos)
- modifica: `.claude/rules/contract.md:22-24`: "Un campo nuevo entra primero en la spec §3
  (`...ecommerce-hiperlocal-design.md`), o en la §4 de `posven/.claude/docs/specs/2026-09-29-cuentas-y-compras-design.md`
  si es de cuentas, y después en `schemas.ts`." El resto igual.
- después `node "C:/Users/Windows 11/Documents/Development/posven/.claude/scripts/generate-index.mjs" posven-ecommerce`
  y `docs/CAPABILITIES.md` en el mismo commit.
- test: `lib/marketplace/http.test.ts`, `lib/marketplace/schemas.test.ts`, crea
  `lib/marketplace/mock/accounts.test.ts`

**Valores exactos del simulado**

- Estado en `globalThis[Symbol.for("posven.mockAccounts")]`, creado perezosamente desde
  `MOCK_ACCOUNT_SEED`: compradores por id, tokens a id, siguiente id de comprador y de dirección,
  `pendingVerification: { customerId, email } | null` y `pendingReset: number | null`.
- `MOCK_ACCOUNT_SEED`: un comprador id 1, `name` "Comprador de prueba", `email`
  "comprador@posven.test", `phone` "+584141234567", contraseña "clave-segura-1" (sólo del
  simulado), `email_verified: true`, `pending_email: null`, `order_status_emails: true`, favoritos
  vacíos y una dirección id 1: `label` "Casa", `recipient_name` "Comprador de prueba", `phone`
  "+584141234567", ciudad `valencia`, `line` "Av. Bolívar Norte, edificio Sol, piso 3",
  `reference: null`, `lat: 10.162`, `lng: -68.007`, `is_default: true`.
- Token emitido: `` `${id}|simulado-${crypto.randomUUID()}` ``. Sesión null o token desconocido:
  `MarketplaceAccountError` 401 `unauthenticated` con su mensaje.
- `MOCK_VERIFY_TOKEN = "verificacion-simulada"`: verifica `pendingVerification` (si su correo es el
  `pending_email`, lo pasa a `email` y deja `pending_email: null`; si no, `email_verified: true`) y
  la vacía; sin pendiente, `token_invalid`. `MOCK_RESET_TOKEN = "restablecer-simulado"`: cambia la
  contraseña de `pendingReset`, revoca todos sus tokens y la vacía; sin pendiente,
  `token_invalid`. `MOCK_EXPIRED_TOKEN = "enlace-vencido"`: `token_expired` en ambos. Cualquier
  otro: `token_invalid`.
- `registerCustomer` y `resendVerification` fijan `pendingVerification`; `updateMe` con correo
  nuevo también. `requestPasswordReset` fija `pendingReset` sólo si el correo existe y responde
  igual en ambos casos.
- `MOCK_RATE_LIMITED_EMAIL = "limite@posven.test"`: `loginCustomer` y `requestPasswordReset` con
  ese correo lanzan 429 `too_many_attempts` con `retryAfter: 42` y el mensaje de la Restricción 2
  con 42.
- Validación (422 `validation_failed`, `fields` con el primer mensaje por campo, como
  `lang/es/validation.php` de posveapi): vacío, `El campo <campo> es obligatorio.`; correo sin
  `@`, `El campo email debe ser una dirección de correo válida.`; contraseña de menos de 8, `El
  campo password debe contener al menos 8 caracteres.`; correo ya usado, "El correo ya está
  registrado."; correo que termina en `@anonimo.invalid`, "El correo no es válido."; `city_slug`
  fuera de `MOCK_LOCATIONS`, "La ciudad no es válida.". Correos en minúsculas y sin espacios
  antes de comparar. Login errado: 422 `invalid_credentials`.
- `updateMe` con `email` distinto del actual: sin `current_password`, "Ingresa tu contraseña
  actual para cambiar el correo."; errada, "La contraseña actual no es correcta." (campo
  `current_password`); en ambos casos no guarda nada. `changePassword` con la actual errada: "La
  contraseña actual no es correcta."; si no, cambia y revoca los demás tokens. `deleteAccount` con
  la contraseña errada: "La contraseña no es correcta." (campo `password`); si no, borra el
  comprador y sus tokens.
- Direcciones (RN-MKT-17: con direcciones hay siempre una predeterminada): la primera queda
  predeterminada; `is_default: true` desmarca las demás; `updateAddress` con `is_default: false`
  no cambia la marca de ninguna (el resto del parche sí se aplica); borrar la predeterminada
  promueve la de mayor id (`DeleteCustomerAddressAction.php:21`); id ajeno o inexistente, 404
  `not_found`. Lista con la predeterminada primero y luego por id ascendente
  (`MarketplaceCustomerRepository.php:23-24`).
- Favoritos: `addFavorite` de un producto que no está en `MOCK_PRODUCTS` ni en
  `MOCK_UNAVAILABLE_PRODUCTS`, o de una tienda fuera de `MOCK_STORES`, da 404 `not_found`;
  repetir no duplica ni cambia el orden; `removeFavorite` siempre resuelve. `listFavorites`
  devuelve el `Product` y el `StoreSummary` de los fixtures, del más reciente al más antiguo
  (`MarketplaceCustomerRepository.php:36`).

**Tests**

- `http.test.ts` (los casos existentes no se editan): `accountRequest` con `PATCH`, sesión e IP
  manda `X-Marketplace-Customer`, `X-Client-IP`, `Content-Type` y el cuerpo JSON; con `ctx`
  nulo no manda ninguno de los dos encabezados de cuenta (RN-MARKETPLACE-07); 422 con `fields`
  lanza `MarketplaceAccountError` con `code`, `message` y `fields` (RN-MARKETPLACE-05); 401
  `unauthenticated` lanza `MarketplaceAccountError`; 401 `{ message: "Unauthenticated." }` lanza
  `MarketplaceUnavailableError`; 429 con `retry_after: 17` da `retryAfter` 17; 429 sin cuerpo de
  error con `Retry-After: 30` da 30 y sin encabezado da 60 (RN-MARKETPLACE-06); 500 y 409 lanzan
  `MarketplaceUnavailableError`; `accountCommand` con 204 resuelve.
- `schemas.test.ts`: login del sembrado pasa `authResponseSchema`; registro nuevo también;
  `getMe` pasa `customerSchema`; `listAddresses` y `createAddress` pasan `addressSchema`;
  `listFavorites` tras `addFavorite` de `acetaminofen-500-mg-20-tabletas` y
  `farmacia-central-valencia` pasa `favoritesResponseSchema`; un cuerpo de error de ejemplo pasa
  `accountErrorBodySchema`. `resetMockAccounts()` en `beforeEach`.
- `mock/accounts.test.ts` (`resetMockAccounts()` en `beforeEach`): correo repetido,
  `validation_failed` con `fields.email` "El correo ya está registrado."; login errado,
  `invalid_credentials`; `MOCK_VERIFY_TOKEN` verifica al recién registrado; `MOCK_EXPIRED_TOKEN`
  da `token_expired`; otro token da `token_invalid`; restablecer revoca el token anterior (401
  después); `MOCK_RATE_LIMITED_EMAIL` da 429 con `retryAfter` 42; `updateMe` con correo nuevo sin
  `current_password` da el mensaje de RN-MKT-19; primera dirección predeterminada y cambio de
  predeterminada; `updateAddress` con `is_default: false` sobre la predeterminada la deja
  predeterminada; `listAddresses` da la predeterminada primero; `listFavorites` da primero el
  último marcado; favorito de slug desconocido da 404; sesión desconocida da 401.

**Verificación**

```bash
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/tsc" --noEmit -p "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/tsconfig.json"
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/eslint" --config "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/eslint.config.mjs" <archivos tocados>
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/vitest" run --root "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce" lib/marketplace
```

**Terminada cuando** los tres comandos pasan, los tests existentes de `http.test.ts` siguen sin
editarse, `generate-index.mjs` no deja cambios y el commit contiene sólo los archivos de esta
tarea.

### Task 2: Sesión del comprador y páginas de acceso

repo: posven-ecommerce
model: opus
mechanical: no
review: yes
commit: feat(account): sesión del comprador y páginas de acceso

Lee antes `.claude/rules/app-router.md`, `.claude/rules/seo.md`, `.claude/rules/ui.md`,
`.claude/rules/tests.md`, `posven/.claude/rules/module-readme.md` (creas `features/account/`,
contrato `posven/.claude/docs/conventions/module-readme.md`, plantilla
`docs/conventions/README.template.md`), `docs/conventions/lessons.md` y las Restricciones 2 a 10.
Guías de Next en `node_modules/next/dist/docs/01-app/`: `02-guides/server-actions.md`,
`02-guides/forms.md`, `02-guides/authentication-with-cache-components.md` (pasos 1 y 2),
`03-api-reference/04-functions/{cookies,headers,redirect}.md` (`redirect` fuera del `try`),
`03-api-reference/03-file-conventions/{proxy,route,dynamic-routes}.md`. Patrón de cookie y
Server Action: `features/location/actions.ts` y `actions.test.ts`.

**Produce**

- `features/account/returnPath.ts` (puro, sin `server-only`): `safeReturnPath(raw: unknown,
  fallback = "/cuenta"): string` con la Restricción 6; `loginHref(path: string): string` =
  `` `/entrar?volver=${encodeURIComponent(path)}` ``.
- `features/account/formState.ts` (puro): `type FormState = { status: "idle" | "error" |
  "success"; message: string | null; fields: Record<string, string>; values: Record<string,
  string> }`; `INITIAL_FORM_STATE: FormState` (`idle`, `null`, `{}`, `{}`);
  `formStateFromError(error: unknown, values: Record<string, string>): FormState` que devuelve
  `status: "error"` con: `validation_failed`, `message` de la API y `fields`; `invalid_credentials`,
  `token_invalid`, `token_expired`, `not_found`, `message` de la API; `too_many_attempts`,
  "Demasiados intentos, prueba en {retryAfter} segundos"; `MarketplaceUnavailableError`, "No
  pudimos conectar con el servicio. Intenta de nuevo en unos segundos."; cualquier otro error se
  relanza. `unauthenticated` no llega acá (lo resuelve `withSession`). Va fuera de `actions.ts`
  porque un archivo `"use server"` sólo exporta funciones async.
- `features/account/session.ts` (`import "server-only"`): `SESSION_COOKIE = "mp_session"`;
  `sessionCookieOptions()` con la Restricción 4; `readSession(): Promise<string | null>`;
  `clientIpFrom(forwardedFor: string | null): string | null` (Restricción 7) y `clientIp():
  Promise<string | null>` que lo aplica a `(await headers()).get("x-forwarded-for")`;
  `accountContext(): Promise<AccountContext>`; `getCurrentCustomer(): Promise<Customer | null>`
  envuelta en `cache` de `react` (una lectura por petición): sin sesión, `null`; `getMe`; ante
  `MarketplaceAccountError` `unauthenticated`, `null`; lo demás se propaga.
  `requireCustomer(path: string): Promise<{ customer: Customer; ctx: AccountContext }>`: sin
  sesión, `redirect(loginHref(path))`; con 401 `unauthenticated`,
  `redirect("/api/sesion/vencida?volver=" + encodeURIComponent(path))`. `withSession<T>(returnTo:
  string, run: (ctx: AccountContext) => Promise<T>): Promise<T>` (para Server Actions): sin sesión,
  `redirect(loginHref(returnTo))`; si `run` lanza `unauthenticated`,
  `endSession(loginHref(returnTo))`; lo demás se propaga. `endSession(to: string):
  Promise<never>` (sólo desde Server Actions): borra `mp_session` con `cookies().delete({ name:
  SESSION_COOKIE, path: "/" })` usando el `path` de la Restricción 4 y llama `redirect(to)`. Es
  el único punto que borra la cookie fuera del Route Handler. `redirect` y `endSession` siempre
  fuera del `try`.
- `features/account/actions.ts` (`"use server"`), cada una con `(prev: FormState, formData:
  FormData) => Promise<FormState>` salvo `logout`: `login` (campos `email`, `password`, `volver`;
  éxito: fija `mp_session` y `redirect(safeReturnPath(volver))`); `register` (`name`, `email`,
  `phone`, `password`, `volver`; igual); `logout(): Promise<void>` (llama `logoutCustomer` si hay
  sesión e ignora `MarketplaceUnavailableError` y `MarketplaceAccountError`, después
  `endSession("/")` siempre); `forgotPassword` (`email`; éxito con el texto de abajo);
  `resetPasswordAction` (`token`, `password`; éxito: `endSession("/entrar?aviso=contrasena")`);
  `verifyEmailAction` (`token`; éxito con su texto);
  `resendVerificationAction` (sin campos, con `withSession("/cuenta", ...)`). `values` devuelve lo
  escrito sin `password` ni `current_password`.
- `features/account/FormFeedback.tsx` (Server Component sin estado, usable desde cliente):
  `FormNotice({ state }: { state: FormState })` (nada en `idle`; `role="alert"` en `error` y
  `role="status"` en `success`, `text-warning` y `text-foreground`); `FieldError({ id, state,
  name }: { id: string; state: FormState; name: string })` que pinta, si `state.fields[name]`
  existe, `<p id={id} className="text-sm text-warning">`; `id` = `` `${prefijo}-${name}-error` ``
  (Restricción 9) y es el mismo que el control pone en `aria-describedby`.
- Formularios `"use client"` con `useActionState`, `const prefijo = useId()` y `pending` que
  deshabilita el botón: `LoginForm({ volver }: { volver: string })`, `RegisterForm({ volver }:
  { volver: string })`, `ForgotPasswordForm()` y `ResetPasswordForm({ token }: { token: string })`
  en `RecoveryForms.tsx`, `VerifyEmailForm({ token }: { token: string })` y
  `ResendVerificationForm()` en `VerifyEmailForm.tsx` (sin campos, sobre
  `resendVerificationAction`, botón "Reenviar verificación" y "Enviando..." mientras espera, con
  su `FormNotice`; lo pinta `/cuenta` en la Task 3). Inputs con `required`, `type="email"` y
  `autoComplete` (`email`, `current-password`, `new-password`, `name`, `tel`); contraseña nueva
  con `minLength={8}`.
- Páginas (Server Components, `metadata` de la Restricción 10, lo que lee `searchParams` o
  `params` en un hijo dentro de `<Suspense fallback={<Skeleton className="h-64 w-full max-w-md" />}>`):
  `app/entrar/page.tsx` (lee `volver` con `safeReturnPath` y `aviso`), `app/registro/page.tsx`
  (lee `volver`), `app/recuperar/page.tsx`, `app/restablecer/[token]/page.tsx`,
  `app/verificar/[token]/page.tsx`. El token de la URL no se valida en la página: va al formulario
  y la API responde.
- `app/api/sesion/vencida/route.ts`: `GET(request: Request)` borra `mp_session` y responde 303 a
  `/entrar?volver=<safeReturnPath(volver)>&aviso=sesion`.
- `proxy.ts` en la raíz (guía `proxy.md`): `matcher: ["/cuenta", "/cuenta/:path*"]`; sin la
  cookie `mp_session`, `NextResponse.redirect` a `loginHref(pathname)` sobre `request.url`; con
  cookie, sigue (la validez la resuelve `requireCustomer`).
- `app/robots.ts:8`: `disallow: ["/buscar", "/api/", "/cuenta", "/restablecer/", "/verificar/"]`.
  `/entrar`, `/registro` y `/recuperar` no se excluyen para que se lea su `noindex`.

**Consume**: de la Task 1, `loginCustomer`, `registerCustomer`, `logoutCustomer`,
`requestPasswordReset`, `resetPassword`, `verifyEmail`, `resendVerification`, `getMe`
(`lib/marketplace/client.ts`), `MarketplaceAccountError`, `MarketplaceUnavailableError`
(`errors.ts`), `AccountContext` (`params.ts`), `Customer` (`schemas.ts`). `Button`, `Input`,
`Card`, `Skeleton` de `components/ui/`.

**Valores exactos de UI**

- `/entrar`: título "Entrar"; `h1` "Entrar"; aviso `aviso=contrasena` "Tu contraseña cambió. Entra
  con la nueva."; aviso `aviso=sesion` "Tu sesión terminó. Entra de nuevo."; etiquetas "Correo" y
  "Contraseña"; botón "Entrar" ("Entrando..." mientras espera); enlaces "¿Olvidaste tu
  contraseña?" a `/recuperar` y "¿No tienes cuenta? Crea una" a `/registro?volver=<volver>`.
- `/registro`: título y `h1` "Crear cuenta"; etiquetas "Nombre", "Correo", "Teléfono",
  "Contraseña" con la ayuda "Al menos 8 caracteres."; botón "Crear cuenta" ("Creando..."); enlace
  "¿Ya tienes cuenta? Entra" a `/entrar?volver=<volver>`.
- `/recuperar`: título y `h1` "Recuperar contraseña"; etiqueta "Correo"; botón "Enviar enlace";
  éxito "Si el correo está registrado, te enviamos un enlace para crear una contraseña nueva.
  Vence en 60 minutos.".
- `/restablecer/[token]`: título y `h1` "Nueva contraseña"; etiqueta "Contraseña nueva"; botón
  "Guardar contraseña"; con `token_invalid` o `token_expired`, el mensaje de la API y el enlace
  "Pedir un enlace nuevo" a `/recuperar`.
- `/verificar/[token]`: título y `h1` "Verificar correo"; texto "Confirma que este correo es
  tuyo."; botón "Verificar mi correo" (la verificación va por el botón, no al cargar, para que el
  análisis de enlaces de los clientes de correo no la gaste); éxito "Tu correo quedó verificado."
  con el enlace "Ir a mi cuenta" a `/cuenta`; error, el mensaje de la API y el enlace "Pedir otro
  desde tu cuenta" a `/cuenta`.
- `resendVerificationAction`, éxito: "Te enviamos un enlace nuevo. Revisa tu correo."

**Archivos**

- crea: `features/account/{returnPath,formState,session,actions}.ts`,
  `features/account/{FormFeedback,LoginForm,RegisterForm,RecoveryForms,VerifyEmailForm}.tsx`,
  `app/entrar/page.tsx`, `app/registro/page.tsx`, `app/recuperar/page.tsx`,
  `app/restablecer/[token]/page.tsx`, `app/verificar/[token]/page.tsx`,
  `app/api/sesion/vencida/route.ts`, `proxy.ts`
- modifica: `app/robots.ts:8`
- modifica: `.claude/rules/seo.md:28-31` (regla 3; suma: "Las rutas de acceso (`/entrar`,
  `/registro`, `/recuperar`, `/restablecer/[token]`, `/verificar/[token]`) y `/cuenta/*` exportan
  `robots: { index: false, follow: false }` y no entran al sitemap.") y `:52` ("`app/robots.ts`
  excluye `/buscar`, `/api/`, `/cuenta`, `/restablecer/` y `/verificar/` y lista cada sitemap.")
- crea: `features/account/README.md` (plantilla y contrato citados; `RN-ACCOUNT-01` a `04` con su
  test; capacidad "leer el comprador de la sesión" con `getCurrentCustomer()` y "entrar, crear
  cuenta y recuperar la contraseña" con las acciones; en su sección de despliegue, la nota: "Next
  sólo escribe `x-forwarded-for` si falta: en producción un proxy delante debe reescribirlo con la
  IP real, o el navegador lo controla, `X-Client-IP` miente y el límite de 5 logins por correo e
  IP se esquiva."); después `generate-index.mjs` como en la Task 1 y `docs/CAPABILITIES.md` en el
  mismo commit.
- test: `features/account/returnPath.test.ts`, `session.test.ts`, `actions.test.ts`

**Tests**

- `returnPath.test.ts` (RN-ACCOUNT-02): `/p/x?y=1` pasa; `//evil.test`, `/\evil.test`,
  `https://evil.test`, `cuenta`, `""`, `undefined` y una ruta de 513 caracteres dan `/cuenta`.
- `session.test.ts` (`vi.mock("next/headers")`): `clientIpFrom("1.1.1.1, 10.0.0.2")` da
  `10.0.0.2`; `"::1"` da `::1`; `"basura"` y `null` dan `null` (RN-ACCOUNT-04); `readSession` con
  `"12|abc"` lo devuelve y con `"abc"` o 513 caracteres da `null`; `sessionCookieOptions()` con
  `NODE_ENV` `production` (`vi.stubEnv`) trae `secure: true` y las demás opciones exactas
  (RN-ACCOUNT-01).
- `actions.test.ts` (`vi.mock` de `next/headers`, `next/navigation` con `redirect` que lanza,
  `@/lib/marketplace/client`; `tests.md` regla 4): `login` fija `mp_session` con las opciones
  exactas y redirige a `volver`; con `volver` `//evil.test` redirige a `/cuenta`; con
  `invalid_credentials` devuelve el mensaje de la API, conserva `email` y no devuelve `password`;
  con 429 `retryAfter` 42 devuelve "Demasiados intentos, prueba en 42 segundos"; con
  `MarketplaceUnavailableError` devuelve el aviso de API caída sin tocar la cookie; `logout`
  borra la cookie (con `path: "/"`) aunque `logoutCustomer` lance; `resendVerificationAction` con `unauthenticated`
  borra la cookie y redirige a `/entrar?volver=%2Fcuenta`, y con un 401 que llega como
  `MarketplaceUnavailableError` no la borra (RN-ACCOUNT-03); `forgotPassword` devuelve el mismo
  éxito que se le pase cualquier correo.

**Verificación**

```bash
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/tsc" --noEmit -p "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/tsconfig.json"
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/eslint" --config "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/eslint.config.mjs" <archivos tocados>
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/vitest" run --root "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce" features/account lib/marketplace
MARKETPLACE_MODE=mock "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/next" build "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce" > "<scratchpad>/build.log" 2>&1
grep -E "(○|◐|ƒ) /(p/\[slug\]|tienda/\[slug\]|entrar|cuenta)?( |$)" "<scratchpad>/build.log"
grep -cE "blocking-route|blocking-prerender-client-hook" "<scratchpad>/build.log"
```

El build corre con el servidor de desarrollo detenido y en simulado por la variable de proceso,
que gana sobre `.env` (guía `02-guides/environment-variables.md`, "Environment Variable Load
Order"). Valor esperado: el primer `grep` muestra `◐` (Partial Prerender, "prerendered as static
HTML with dynamic server-streamed content", `node_modules/next/dist/build/utils.js:319` y
`:524-527`) en `/`, `/p/[slug]`, `/tienda/[slug]` y `/entrar`, y ninguna de esas filas con `ƒ`;
el segundo imprime `0`.

**Terminada cuando** los cuatro comandos pasan, `generate-index.mjs` no deja cambios y el commit
contiene sólo los archivos de esta tarea.

### Task 3: Páginas de cuenta, cabecera, favoritos y e2e

repo: posven-ecommerce
model: sonnet
mechanical: no
commit: feat(account): páginas de cuenta, menú en la cabecera, favoritos y e2e

Lee antes `.claude/rules/app-router.md`, `.claude/rules/seo.md` (regla 7: nada de `<Suspense>`
por encima de la página de producto o tienda), `.claude/rules/ui.md`, `.claude/rules/tests.md`
(regla 7), `posven/.claude/rules/module-readme.md`, `docs/conventions/lessons.md` (L-02) y las
Restricciones 2, 5, 8, 9 y 10. Guías: `02-guides/forms.md`, `03-api-reference/04-functions/refresh.md`,
`03-api-reference/03-file-conventions/layout.md`. Patrón de degradar en la cabecera:
`LocationSummary` en `features/location/LocationBar.tsx:17-34`; de geolocalización:
`features/location/LocationPicker.tsx:33-51`; de e2e con geolocalización concedida:
`e2e/search.spec.ts:44-58`; configuración de Playwright: `playwright.config.ts`.

**Consume** (Task 1 y 2): `getMe`, `updateMe`, `changePassword`, `updateSettings`,
`deleteAccount`, `listAddresses`, `createAddress`, `updateAddress`, `deleteAddress`,
`listFavorites`, `addFavorite`, `removeFavorite`, `listLocations` (`lib/marketplace/client.ts`);
`MarketplaceAccountError`, `MarketplaceUnavailableError`; `FavoriteTarget`, `AccountContext`;
`Customer`, `Address`, `FavoritesResponse`; de `features/account/`: `requireCustomer(path)`,
`getCurrentCustomer()`, `accountContext()`, `withSession(returnTo, run)`, `endSession(to)`,
`loginHref(path)`, `safeReturnPath(raw)`, `FormState`, `INITIAL_FORM_STATE`,
`formStateFromError(error, values)`, `FormNotice`, `FieldError({ id, state, name })`, `logout`,
`ResendVerificationForm` (`VerifyEmailForm.tsx`); `isValidCoords` (`features/location/cookie.ts:16`); `ProductThumb`
(`features/search/ProductThumb.tsx`).

**Produce**

- `features/account/accountActions.ts` (`"use server"`), todas con `withSession`:
  `updateProfile(prev, formData)` (campos `name`, `phone`, `email`, `current_email` oculto,
  `current_password`; manda `name` y `phone`, y `email` más `current_password` sólo si `email`
  difiere de `current_email`; éxito con su texto); `changePasswordAction(prev, formData)`
  (`current_password`, `password`); `updateSettingsAction(prev, formData)` (casilla
  `order_status_emails`, `"on"` es verdadero); `deleteAccountAction(prev, formData)` (`password`;
  éxito: `endSession("/")`, fuera del `try`); `saveAddress(prev, formData)` (`address_id` vacío
  crea, si no actualiza; `label`, `recipient_name`, `phone`, `city_slug`, `line`, `reference`
  vacío como `null`, `lat`, `lng`, `coords_changed`, `is_default`; al crear exige `lat`/`lng`
  válidos por `isValidCoords` y si no devuelve el aviso de coordenadas sin llamar a la API; al
  actualizar manda los campos del formulario y `lat`/`lng` sólo con `coords_changed=1`; éxito
  `refresh()` y su texto); `deleteAddressAction(formData): Promise<void>` y
  `setDefaultAddress(formData): Promise<void>` (`address_id`; `refresh()`);
  `toggleFavorite(formData): Promise<void>` (`kind`, `slug`, `mode` `add` o `remove`, `volver`;
  `withSession(safeReturnPath(volver, "/cuenta/favoritos"), ...)`; `not_found` se ignora;
  `refresh()`). Errores de negocio por `formStateFromError`.
- `features/account/AccountMenu.tsx`: `AccountSlot()` async: `getCurrentCustomer()` dentro de
  `try`; ante `MarketplaceUnavailableError` o `MarketplaceAccountError`, invitado (L-02). Invitado:
  `<Link href="/entrar" rel="nofollow">` con `buttonClasses("secondary", "sm")`, ícono `User` y
  "Entrar". Con comprador: `<details>` con `<summary>` "Mi cuenta" (ícono `User`) y una lista con
  "Resumen" (`/cuenta`), "Perfil", "Direcciones", "Favoritos", "Configuración" y un `<form
  action={logout}>` con el botón "Salir". `AccountSlotSkeleton()`: `<Skeleton className="h-9
  w-24" />`.
- `features/account/FavoriteButton.tsx`: `FavoriteButton({ target, returnTo }: { target:
  FavoriteTarget; returnTo: string })` async. Sin sesión o con `unauthenticated`: `<Link
  href={loginHref(returnTo)} rel="nofollow">` "Guardar en favoritos". Con sesión: `listFavorites`
  y un `<form action={toggleFavorite}>` con ocultos `kind`, `slug`, `mode`, `volver` y un `Button`
  `secondary` `sm` con ícono `Heart`, `aria-pressed`, texto "Guardar en favoritos" o "Quitar de
  favoritos". Ante `MarketplaceUnavailableError` o `MarketplaceAccountError` no pinta nada.
  `FavoriteButtonSkeleton()`: `<Skeleton className="h-9 w-44" />`.
- `ProfileForm({ customer }: { customer: Customer })`, `AddressForm({ address, cities }:
  { address: Address | null; cities: { slug: string; name: string; state: string }[] })` y en
  `SettingsForms.tsx` `PasswordChangeForm()`, `NotificationsForm({ enabled }: { enabled: boolean })`,
  `DeleteAccountForm()`, todos `"use client"` con `useActionState` y su prefijo de `useId()`
  (Restricción 9), que pasan a `FieldError` como `id`. `AddressForm` guarda `lat` y
  `lng` en estado, los obtiene con `navigator.geolocation.getCurrentPosition` al tocar "Usar mi
  ubicación" y, si es nueva, deshabilita "Guardar dirección" sin coordenadas; el `<select>` agrupa
  las ciudades por estado con `<optgroup>`.
- `app/cuenta/layout.tsx`: `metadata` `robots: { index: false, follow: false }` y una navegación
  estática (`<nav aria-label="Mi cuenta">` con "Resumen", "Perfil", "Direcciones", "Favoritos",
  "Configuración") sobre `{children}`; no lee la sesión.
- Páginas `app/cuenta/page.tsx`, `perfil`, `direcciones`, `favoritos`, `configuracion`: `metadata`
  con su título y `robots` de la Restricción 10; el cuerpo en un componente async dentro de
  `<Suspense fallback={<Skeleton className="h-64 w-full" />}>` que empieza con
  `requireCustomer("<su ruta>")`. `direcciones` arma `cities` desde `listLocations()`
  (`LocationState[]`, `schemas.ts:36-47`): por cada estado, cada `municipalities[].cities[]` da
  `{ slug, name, state: <nombre del estado> }`, en el orden de la API.
- `app/layout.tsx:44-55`: después del `<Suspense>` de `HeaderSearchSlot` (línea 55), `<div
  className="ml-auto shrink-0"><Suspense fallback={<AccountSlotSkeleton />}><AccountSlot
  /></Suspense></div>`, fuera de `HeaderSearchSlot` para que se vea en todas las rutas; `ml-auto`
  lo empuja al borde derecho también en las rutas donde `HeaderSearchSlot` no pinta nada. `<main>`
  sigue fuera de toda frontera. Se prueba en móvil (caso 9 del e2e, proyecto Pixel 7).
- `app/p/[slug]/page.tsx:98` (después de la marca): `<Suspense fallback={<FavoriteButtonSkeleton />}>
  <FavoriteButton target={{ kind: "product", slug: product.slug }} returnTo={`/p/${product.slug}`} /></Suspense>`.
  `app/tienda/[slug]/page.tsx:55` (después de `StoreHeader`): lo mismo con `kind: "store"`,
  `slug` y `returnTo` `/tienda/${slug}`. Nada más de esas páginas cambia.

**Valores exactos de UI**

- `/cuenta`: título "Mi cuenta"; `h1` "Hola, {name}"; sin verificar: "Tu correo {email} no está
  verificado." con `<ResendVerificationForm />`; con `pending_email`: "Confirma tu correo nuevo
  {pending_email} con el enlace que te enviamos." con `<ResendVerificationForm />`; accesos, cada
  uno un `<Link>` que es la tarjeta con las clases `rounded-2xl border border-border bg-surface p-4
  shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-raised
  motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2
  focus-visible:outline-offset-2 focus-visible:outline-foreground` (tarjeta enlazada de
  `docs/plans/terminados/2026-09-28-visual-moderna.md` Restricción 3), título y descripción: "Perfil" /
  "Nombre, correo y teléfono", "Direcciones" /
  "Dónde recibes tus pedidos", "Favoritos" / "Productos y tiendas guardados", "Configuración" /
  "Contraseña, avisos y eliminar cuenta".
- `/cuenta/perfil`: título y `h1` "Perfil"; etiquetas "Nombre", "Teléfono", "Correo", "Contraseña
  actual" con la ayuda "Sólo si cambias el correo."; botón "Guardar cambios"; éxito "Guardamos tus
  datos."; con `pending_email` tras guardar: "Te enviamos un enlace a {pending_email} para
  confirmar el correo nuevo. Hasta entonces sigues entrando con {email}."
- `/cuenta/direcciones`: título y `h1` "Direcciones"; vacío "Todavía no tienes direcciones
  guardadas." con el enlace "Buscar productos" a `/buscar`; cada dirección con `label`, `line`,
  ciudad, `recipient_name`, `phone`, la insignia "Predeterminada" o el botón "Marcar como
  predeterminada", un `<details>` "Editar" con `AddressForm` y el botón "Eliminar"; el alta va en
  `<section aria-labelledby={<id del h2>}>` con `h2` "Agregar dirección" (así el e2e la ubica como
  región, distinta de los `AddressForm` de edición); etiquetas "Nombre de la dirección" (placeholder "Casa, Trabajo"), "Quién recibe",
  "Teléfono", "Ciudad" (primera opción vacía "Elige tu ciudad"), "Dirección", "Punto de referencia
  (opcional)"; botón "Usar mi ubicación"; estado "Ubicación lista"; sin coordenadas "Toca Usar mi
  ubicación para guardar la dirección. Sin ubicación sólo podrás retirar en tienda."; fallo de
  geolocalización "No pudimos obtener tu ubicación. Revisa el permiso del navegador e intenta de
  nuevo."; casilla "Usar como predeterminada"; botón "Guardar dirección"; éxito "Guardamos la
  dirección.".
- `/cuenta/favoritos`: título y `h1` "Favoritos"; `h2` "Productos" (con `ProductThumb` `"md"` y
  enlace a `/p/{slug}`) y "Tiendas" (enlace a `/tienda/{slug}` con ciudad); cada uno con el botón
  "Quitar" (`toggleFavorite` con `mode` `remove` y `volver` `/cuenta/favoritos`); vacío "Todavía no
  tienes favoritos." con el enlace "Buscar productos" a `/buscar`.
- `/cuenta/configuracion`: título y `h1` "Configuración"; `h2` "Contraseña": "Contraseña actual",
  "Contraseña nueva", botón "Cambiar contraseña", éxito "Cambiamos tu contraseña y cerramos tus
  otras sesiones."; `h2` "Avisos": casilla "Avisarme por correo cuando cambie el estado de mis
  pedidos", botón "Guardar avisos", éxito "Guardamos tus avisos."; `h2` "Eliminar cuenta": "Borraremos
  tus direcciones y favoritos y cerraremos tus sesiones. Tus compras se conservan sin tus datos
  personales.", etiqueta "Contraseña", botón "Eliminar mi cuenta".

**Archivos**

- crea: `features/account/{accountActions}.ts`,
  `features/account/{AccountMenu,FavoriteButton,ProfileForm,AddressForm,SettingsForms}.tsx`,
  `app/cuenta/layout.tsx`, `app/cuenta/page.tsx`, `app/cuenta/perfil/page.tsx`,
  `app/cuenta/direcciones/page.tsx`, `app/cuenta/favoritos/page.tsx`,
  `app/cuenta/configuracion/page.tsx`
- modifica: `app/layout.tsx:1-78`, `app/p/[slug]/page.tsx:1-15` y `:96-103`,
  `app/tienda/[slug]/page.tsx:1-10` y `:55`
- modifica: `features/account/README.md` (`exports`, §4, `RN-ACCOUNT-05` y `06` con su test,
  capacidades "cabecera de la cuenta", "direcciones del comprador", "favoritos del comprador",
  `verified_against`); después `generate-index.mjs` y `docs/CAPABILITIES.md` en el mismo commit.
- test: `features/account/accountActions.test.ts`, `features/account/AccountMenu.test.tsx`,
  crea `e2e/account.spec.ts`
- modifica: `.claude/rules/tests.md:34-35` (la última oración de la regla 7): "El e2e de cierre
  son `e2e/search.spec.ts`, `e2e/product.spec.ts` y `e2e/account.spec.ts`; este último corre en
  serie porque el simulado de cuentas guarda estado en el servidor."

**Tests**

- `accountActions.test.ts` (`vi.mock` de `next/headers`, `next/navigation`, `next/cache` y
  `@/lib/marketplace/client`): `updateProfile` sin cambio de correo no manda `email` ni
  `current_password`; con correo nuevo manda ambos; `saveAddress` nueva sin coordenadas devuelve
  el aviso sin llamar a `createAddress` (RN-ACCOUNT-06); edición sin `coords_changed` no manda
  `lat` ni `lng`; `toggleFavorite` con `unauthenticated` borra `mp_session` y redirige a
  `/entrar?volver=%2Fp%2Facetaminofen-500-mg-20-tabletas`; `toggleFavorite` con `not_found` no
  lanza; `deleteAccountAction` con "La contraseña no es correcta." devuelve el error en
  `fields.password` y no borra la cookie; con éxito borra `mp_session` (`path: "/"`) y redirige a
  `/`.
- `AccountMenu.test.tsx` (`render(await AccountSlot())`, `cleanup()` en `afterEach`, `vi.mock` de
  `./session`): sin comprador muestra el enlace "Entrar"; con `getCurrentCustomer` que lanza
  `MarketplaceUnavailableError` muestra "Entrar" (RN-ACCOUNT-05); con comprador muestra "Mi
  cuenta" y "Salir".

- `e2e/account.spec.ts` con `test.describe.configure({ mode: "serial" })` (el simulado guarda
  estado en memoria del servidor). Un correo único por corrida, fijado una vez al nivel del
  `describe`: `` const email = `e2e-${Date.now()}@posven.test` ``, con nombre "Prueba E2E",
  teléfono "+584141112233" y contraseña "clave-segura-2". Casos:
  1. Sin sesión, `/cuenta/perfil` termina en `/entrar?volver=%2Fcuenta%2Fperfil`.
  2. Registrar con `email`: termina en `/cuenta` con "Hola, Prueba E2E" y "no está verificado";
     `/verificar/verificacion-simulada` y "Verificar mi correo" muestran "Tu correo quedó
     verificado."; `/cuenta` ya no muestra el aviso.
  3. "Mi cuenta" y "Salir" dejan "Entrar" en la cabecera; entrar con `email` desde
     `/entrar?volver=%2Fcuenta%2Ffavoritos` termina en `/cuenta/favoritos`.
  4. Con "comprador@posven.test" / "clave-segura-1": en `/cuenta/perfil` cambiar el nombre a
     "Comprador editado" muestra "Guardamos tus datos."
  5. Entrar con `email`; con geolocalización concedida (`{ latitude: 10.162, longitude: -68.007 }`),
     dentro de `page.getByRole("region", { name: "Agregar dirección" })`: "Nombre de la dirección"
     "Trabajo", "Quién recibe" "Prueba E2E", "Teléfono" "+584141112233", "Ciudad" `valencia`,
     "Dirección" "Calle 1", "Usar mi ubicación", "Usar como predeterminada" y "Guardar
     dirección"; muestra "Guardamos la dirección." y la dirección "Trabajo" con "Predeterminada".
  6. Salir; sin sesión, "Guardar en favoritos" en `/p/acetaminofen-500-mg-20-tabletas` lleva a
     `/entrar?volver=%2Fp%2Facetaminofen-500-mg-20-tabletas`; entrar con `email` vuelve a la ficha,
     donde el botón sigue en "Guardar en favoritos" (el primer toque sólo llevó a entrar); tocarlo
     de nuevo lo pasa a "Quitar de favoritos" y `/cuenta/favoritos` lista el producto.
  7. `/entrar`, `/registro` y `/cuenta` llevan `meta[name="robots"]` con `noindex`;
     `/robots.txt` contiene `Disallow: /cuenta`; `/sitemap/static.xml` no contiene `/entrar` ni
     `/cuenta`.
  8. Login con "limite@posven.test" muestra "Demasiados intentos, prueba en 42 segundos".
  9. En el proyecto Pixel 7, en `/` y en `/p/acetaminofen-500-mg-20-tabletas`, sin sesión y con
     sesión: "Entrar" o "Mi cuenta" es visible y
     `document.documentElement.scrollWidth <= window.innerWidth` (la cabecera no desborda).

**Verificación** (quien coordina, antes de despachar, libera el puerto 3000: si
`netstat -ano | findstr :3000` muestra un servidor, pide al usuario detener su `next dev` en modo
api; no se toca `.env`. `webServer` levanta `npm run dev` con `MARKETPLACE_MODE=mock`, que gana
sobre `.env` por ser variable de proceso; con `reuseExistingServer` un servidor en api no la
recibiría):

1. Los comandos de la Task 2, con `vitest run ... features/account features/location
   lib/marketplace`, el mismo build y los mismos dos `grep` con el mismo valor esperado.
2. Con el build terminado:

```bash
"C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/node_modules/.bin/playwright" test --config "C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce/playwright.config.ts"
```

**Terminada cuando** todo lo anterior pasa con su valor esperado, los tres archivos del e2e de
cierre pasan, el servidor que levantó Playwright queda detenido y el commit contiene sólo los
archivos de esta tarea.

## Verificación manual final contra el Docker

La hace quien coordina con el usuario, después de la Task 3, sin editar ningún `.env`:

1. Requisitos que el usuario confirma en posveapi (sin leer su `.env`): `posveapi_app` arriba en
   `feat/marketplace-cuentas`, migración del plan 1 aplicada, `MAIL_MAILER=log`,
   `MARKETPLACE_STOREFRONT_URL=http://localhost:3000` (sin ella el registro falla al armar el
   enlace) y, si la cola no es `sync`, el worker corriendo.
2. El usuario levanta `npm run dev` con su `.env` (`MARKETPLACE_MODE=api`).
3. Registrar un correo nuevo en `/registro`; sacar el enlace con
   `docker exec posveapi_app sh -c "grep -o 'verificar/[A-Za-z0-9._~%-]*' storage/logs/laravel.log | tail -1"`
   y abrir `http://localhost:3000/<ese enlace>`; "Verificar mi correo".
4. Salir, entrar, guardar una dirección con "Usar mi ubicación", marcar un favorito en
   `/tienda/posvenio-caracas` y verlo en `/cuenta/favoritos`; cambiar el correo en perfil sin la
   contraseña actual muestra "Ingresa tu contraseña actual para cambiar el correo."
5. Detener `posveapi_app` con la sesión abierta: la cabecera muestra "Entrar" y la página de
   producto carga sin el botón de favorito.

## Cierre

### Pendientes del cierre

- Despliegue del ecommerce: Next sólo escribe `x-forwarded-for` si falta
  (`base-server.js:612`); sin un proxy delante que lo reescriba con la IP real, el navegador lo
  controla, `X-Client-IP` miente y el límite de 5 logins por correo e IP se esquiva. Nota en
  `features/account/README.md` (Task 2); el proxy se decide con el despliegue (plan D).
- Destino plan 3 de posveapi: el 429 del límite global (`bootstrap/app.php:88-95`) no trae
  `Retry-After` ni el cuerpo `{ error }` de la spec §4 y §6; el ecommerce cae a 60 s.
- Destino plan 3 de posveapi: los mensajes de validación nombran el campo en inglés ("El campo
  password debe contener al menos 8 caracteres.") porque `lang/es/validation.php` tiene
  `attributes` vacío; el ecommerce los muestra tal cual.
- `MARKETPLACE_STOREFRONT_URL=` en `.env.example` de posveapi: pendiente del usuario (la
  configuración de permisos bloquea `.env*`).
- Destino ejecución local del usuario: el e2e de Playwright (`search`, `product`, `account`) no se
  corrió en el entorno del plan; corre en local con el puerto 3000 libre y en simulado.
- Destino ejecución local del usuario: "Verificación manual final contra el Docker", pasos 1 a 5,
  sin correr.
- Destino ejecución local del usuario: `docs/CAPABILITIES.md` se editó a mano en las Tasks 2 y 3
  porque `generate-index.mjs` no estaba disponible; regenerarlo y confirmar que no deja diff.
- Destino plan 3 de posveapi o siguiente plan del ecommerce: el simulado (`mock/accounts.ts`) no
  compara `pendingVerification.email` en `verifyEmail`, y no limpia `pending_email` ni
  `pendingReset` en `resetPassword`, `changePassword` ni al confirmar `pending_email` (Minor de la
  Task 1).
- Destino siguiente plan del ecommerce, Minor de la revisión de la Task 2:
  - `safeReturnPath` acepta rutas que el navegador normaliza a `//` (`/.//evil.test`,
    `/%2e%2e//evil.test`) y caracteres fuera de ASCII (`/x€` rompe `x-action-redirect` tras fijar
    la sesión). No es un open redirect; con enlaces hechos a mano deja una navegación rota.
  - `logout` no borra `mp_session` si falla la configuración de la API (`http.ts:21-25`).
  - El test de `logout` no afirma que se llamó a `logoutCustomer`.
  - `resetPasswordAction` marca `fields.token` para pintar "Pedir un enlace nuevo" porque
    `FormState` no lleva el código de error; esa rama no tiene test propio.
  - `"mp_session"` duplicado en `proxy.ts` para no arrastrar `server-only` al proxy; se resuelve
    moviendo la constante a un módulo puro.
  - `GET /api/sesion/vencida` borra la cookie a quien lo visite: otro sitio puede cerrar la sesión
    con un enlace (logout CSRF, sin robo de datos).
  - Un `mp_session` mal formado cuenta como sin sesión pero no se borra: el proxy lo deja pasar y
    `requireCustomer` redirige a `/entrar` en cada visita a `/cuenta` hasta el próximo login.
- Destino siguiente plan del ecommerce, Minor de la revisión final de la rama:
  - El menú `<details>` de la cuenta sigue abierto tras navegar y no cierra con Escape ni al
    hacer clic fuera.
  - `AddressForm` en edición toma `is_default` del último guardado y no de `address.is_default`:
    puede devolver la marca de predeterminada sin querer.
  - `features/account/README.md` cita el e2e para "el botón deshabilitado" y el e2e no lo afirma.
  - `FavoriteButton` combina `aria-pressed` con texto que cambia (fijado por el plan).
- Fuera de alcance: `features/location/README.md` quedó rancio (docs-check).
