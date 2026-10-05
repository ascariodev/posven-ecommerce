---
module: "account"
path: "features/account"
type: "feature"
exports: ["safeReturnPath", "loginHref", "FormState", "INITIAL_FORM_STATE", "formStateFromError", "formStateFromZod", "loginSchema", "registerSchema", "forgotPasswordSchema", "resetPasswordSchema", "profileSchema", "changePasswordSchema", "deleteAccountSchema", "addressSchema", "addressCoordsSchema", "billingFormSchema", "SESSION_COOKIE", "sessionCookieOptions", "readSession", "clientIpFrom", "clientIp", "accountContext", "getCurrentCustomer", "requireCustomer", "withSession", "endSession", "login", "register", "logout", "forgotPassword", "resetPasswordAction", "verifyEmailAction", "resendVerificationAction", "FormNotice", "FieldError", "LoginForm", "RegisterForm", "ForgotPasswordForm", "ResetPasswordForm", "VerifyEmailForm", "ResendVerificationForm", "updateProfile", "updateBilling", "clearBilling", "changePasswordAction", "updateSettingsAction", "deleteAccountAction", "saveAddress", "deleteAddressAction", "setDefaultAddress", "toggleFavorite", "AccountSlot", "AccountSlotSkeleton", "AccountDropdown", "AccountNav", "AccountNavSkeleton", "AccountIdentity", "AccountIdentitySkeleton", "AccountQuickLinks", "AccountMenuList", "AccountLink", "accountLinks", "accountQuickLinks", "accountListLinks", "isActiveLink", "FavoriteButton", "FavoriteButtonSkeleton", "ProfileForm", "BillingForm", "BillingFields", "BillingFieldName", "AddressForm", "AddressActionButton", "FavoriteToggleForm", "PasswordChangeForm", "NotificationsForm", "DeleteAccountForm"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "components/ui/button.tsx", "components/ui/input.tsx", "components/ui/card.tsx", "components/ui/skeleton.tsx", "components/ui/badge.tsx", "components/ui/select.tsx", "components/ui/dropdown-menu.tsx", "features/cart/lib/flag.ts", "features/purchases/components/RecentPurchases.tsx", "features/purchases/components/BuyAgain.tsx", "features/search/components/ProductThumb.tsx", "features/cart/lib/flag.ts", "features/cart/server/cart.ts", "components/EmptyState.tsx"]
tests: "features/account/__tests__/*.test.{ts,tsx}"
verified_against: ["features/account/lib/returnPath.ts", "features/account/lib/formState.ts", "features/account/lib/formSchemas.ts", "features/account/__tests__/formState.test.ts", "features/account/__tests__/formSchemas.test.ts", "hooks/useFormValidation.ts", "hooks/__tests__/useFormValidation.test.tsx", "features/account/server/session.ts", "features/account/server/actions.ts", "features/account/components/FormFeedback.tsx", "features/account/components/LoginForm.tsx", "features/account/components/RegisterForm.tsx", "features/account/components/RecoveryForms.tsx", "features/account/components/VerifyEmailForm.tsx", "features/account/__tests__/returnPath.test.ts", "features/account/__tests__/session.test.ts", "features/account/__tests__/actions.test.ts", "features/account/server/accountActions.ts", "features/account/components/AccountMenu.tsx", "features/account/components/AccountDropdown.tsx", "features/account/components/AccountNav.tsx", "features/account/components/AccountIdentity.tsx", "features/account/lib/accountLinks.ts", "features/account/components/AccountOverviewMenu.tsx", "features/account/__tests__/accountLinks.test.ts", "features/account/components/FavoriteButton.tsx", "features/account/components/FavoriteToggleForm.tsx", "features/account/__tests__/FavoriteToggleForm.test.tsx", "features/account/components/ProfileForm.tsx", "features/account/components/BillingForm.tsx", "features/account/components/BillingFields.tsx", "features/account/components/AddressForm.tsx", "features/account/components/AddressActionButton.tsx", "features/account/__tests__/AddressActionButton.test.tsx", "app/cuenta/direcciones/page.tsx", "features/account/components/SettingsForms.tsx", "features/account/__tests__/accountActions.test.ts", "features/account/__tests__/AccountMenu.test.tsx", "features/account/__tests__/AddressForm.test.tsx", "features/cart/lib/flag.ts", "features/purchases/components/RecentPurchases.tsx", "app/cuenta/layout.tsx", "app/cuenta/page.tsx", "features/purchases/components/BuyAgain.tsx", "app/cuenta/perfil/page.tsx", "app/cuenta/direcciones/page.tsx", "app/cuenta/favoritos/page.tsx", "app/cuenta/configuracion/page.tsx", "app/layout.tsx", "app/p/[slug]/page.tsx", "app/tienda/[slug]/page.tsx", "e2e/account.spec.ts", "e2e/registration.ts", "app/entrar/page.tsx", "app/registro/page.tsx", "app/recuperar/page.tsx", "app/restablecer/[token]/page.tsx", "app/verificar/[token]/page.tsx", "app/api/sesion/vencida/route.ts", "proxy.ts", "app/robots.ts", "lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "features/site/components/SiteHeader.tsx", "features/store/components/StoreHeader.tsx", "components/EmptyState.tsx"]
capabilities:
  - intent: "leer el comprador de la sesión"
    intent_aliases: ["comprador actual", "usuario logueado", "sesion del comprador", "esta logueado", "cookie mp_session", "exigir sesion"]
    entrypoint: "getCurrentCustomer()"
    file: "features/account/server/session.ts"
    input: "sin parámetros; lee la cookie mp_session y x-forwarded-for de la petición"
    output: "Customer ({ name, email, phone, email_verified, pending_email, settings: { order_status_emails } }) o null sin sesión, con sesión inválida o con 401 unauthenticated; requireCustomer(path) devuelve { customer, ctx } o redirige"
    source: "cookie mp_session y getMe() de lib/marketplace"
    rules: ["RN-ACCOUNT-01", "RN-ACCOUNT-03", "RN-ACCOUNT-04"]
  - intent: "entrar, crear cuenta y recuperar la contraseña"
    intent_aliases: ["login", "iniciar sesion", "registro", "crear cuenta", "olvide mi contrasena", "restablecer contrasena", "verificar correo", "cerrar sesion"]
    entrypoint: "login() / register() / logout() / forgotPassword() / resetPasswordAction() / verifyEmailAction() / resendVerificationAction()"
    file: "features/account/server/actions.ts"
    input: "(prev: FormState, formData: FormData) con email, password, name, phone, token o volver según la acción; logout sin parámetros"
    output: "FormState { status: idle | error | success; message; fields; values sin password ni current_password }; login y register fijan mp_session y redirigen a safeReturnPath(volver)"
    source: "API de posveapi vía lib/marketplace/client.ts; cookie mp_session"
    rules: ["RN-ACCOUNT-01", "RN-ACCOUNT-02", "RN-ACCOUNT-03"]
  - intent: "mostrar el acceso o el menú de la cuenta en la cabecera"
    intent_aliases: ["cabecera de la cuenta", "boton entrar", "menu de la cuenta", "mi cuenta", "salir"]
    entrypoint: "<AccountSlot />"
    file: "features/account/components/AccountMenu.tsx"
    input: "sin props; se monta dentro de <Suspense fallback={<AccountSlotSkeleton />}> en features/site/components/SiteHeader.tsx"
    output: "enlace Entrar sin comprador o con la API caída (L-02); con comprador, AccountDropdown: botón Mi cuenta que abre un DropdownMenu de shadcn con los enlaces de accountLinks (Resumen, Compras con el carrito encendido, Favoritos, Direcciones, Perfil y facturación, Configuración, Ayuda) y Salir"
    source: "getCurrentCustomer() de features/account/server/session.ts"
    rules: ["RN-ACCOUNT-05"]
  - intent: "editar o borrar los datos de facturación del comprador"
    intent_aliases: ["datos fiscales", "facturar a mi nombre", "rif del comprador", "cedula del comprador", "razon social", "borrar datos de facturacion"]
    entrypoint: "<BillingForm billing={customer.billing} /> / updateBilling() / clearBilling()"
    file: "features/account/components/BillingForm.tsx"
    input: "billing: Billing | null; updateBilling recibe (prev, formData) con billing.document_type, billing.document, billing.name, billing.phone, billing.address y billing.taxpayer_type; clearBilling no lee campos"
    output: "FormState; updateBilling manda updateMe con billing completo y recortado, clearBilling con billing null; errores de campo con clave billing.<campo>"
    source: "updateMe de lib/marketplace/client.ts; reglas de billingFormSchema en features/account/lib/formSchemas.ts"
    rules: ["RN-ACCOUNT-07"]
  - intent: "editar el perfil, la contraseña, los avisos, las direcciones del comprador o eliminar su cuenta"
    intent_aliases: ["direcciones del comprador", "guardar direccion", "cambiar contrasena", "editar perfil", "eliminar cuenta", "avisos por correo"]
    entrypoint: "updateProfile() / changePasswordAction() / updateSettingsAction() / deleteAccountAction() / saveAddress() / deleteAddressAction() / setDefaultAddress()"
    file: "features/account/server/accountActions.ts"
    input: "(prev: FormState, formData: FormData) con los campos de cada formulario; deleteAddressAction y setDefaultAddress reciben igual (prev, formData) con address_id"
    output: "FormState { status; message; fields; values } con lo escrito sin contraseñas; una dirección nueva sólo se envía con lat y lng válidas"
    source: "API de posveapi vía lib/marketplace/client.ts (updateMe, changePassword, updateSettings, deleteAccount, createAddress, updateAddress, deleteAddress)"
    rules: ["RN-ACCOUNT-03", "RN-ACCOUNT-06"]
  - intent: "marcar o quitar un producto o una tienda de favoritos"
    intent_aliases: ["favoritos del comprador", "guardar en favoritos", "quitar de favoritos", "corazon"]
    entrypoint: "<FavoriteButton /> / toggleFavorite()"
    file: "features/account/components/FavoriteButton.tsx"
    input: "target: { kind: \"product\" | \"store\"; slug: string } y returnTo: string; se monta dentro de <Suspense fallback={<FavoriteButtonSkeleton />}>"
    output: "sin sesión, enlace a /entrar?volver=<returnTo>; con sesión, botón Guardar en favoritos o Quitar de favoritos; con la API caída no pinta nada"
    source: "listFavorites() de lib/marketplace y toggleFavorite() de features/account/server/accountActions.ts"
    rules: ["RN-ACCOUNT-03", "RN-ACCOUNT-05"]
---

# Módulo `account`

## 1. Propósito

Sesión del comprador del marketplace: la cookie `mp_session` con el token de posveapi, su lectura
en el servidor y las acciones de entrar, crear cuenta, salir, recuperar la contraseña y verificar
el correo. Sobre esa sesión, las pantallas de `/cuenta` (perfil, direcciones, favoritos y
configuración), el acceso o menú de la cuenta en la cabecera y el botón de favorito de las fichas
de producto y de tienda. No guarda datos del comprador fuera de la cookie. Las acciones validan la
forma con un espejo de las reglas de la API; credenciales y unicidad las valida la API.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-ACCOUNT-01` | `mp_session` es `httpOnly`, `SameSite=Lax`, `Path=/`, de 30 días y `Secure` en producción; un valor sin la forma del token de posveapi o de más de 512 caracteres equivale a no tener sesión. | `features/account/__tests__/session.test.ts` ("trata un valor sin la forma del token como sin sesión", "en producción trae secure y las demás opciones exactas"); `features/account/__tests__/actions.test.ts` ("fija mp_session con las opciones exactas y redirige a volver") |
| `RN-ACCOUNT-02` | `volver` sólo acepta rutas internas: empieza con `/` y no con `//` ni `/\`; cualquier otro valor vuelve a `/cuenta`. | `features/account/__tests__/returnPath.test.ts` ("acepta una ruta interna con consulta", "devuelve /cuenta ante %j"); `features/account/__tests__/actions.test.ts` ("con volver externo redirige a /cuenta") |
| `RN-ACCOUNT-03` | Un 401 `unauthenticated` borra `mp_session` y lleva a `/entrar?volver=`; un 401 sin esa forma es API caída y conserva la cookie. | `features/account/__tests__/actions.test.ts` ("con unauthenticated borra la cookie y lleva a entrar", "con un 401 que llega como API caída conserva la cookie") |
| `RN-ACCOUNT-04` | La IP del cliente es el último valor de `x-forwarded-for` si `isIP` lo acepta; si no, no se manda `X-Client-IP`. | `features/account/__tests__/session.test.ts` ("toma el último valor de x-forwarded-for", "devuelve null ante un valor que no es IP o sin encabezado") |
| `RN-ACCOUNT-05` | La cabecera y el botón de favorito leen la sesión en su `<Suspense>`; con la API caída la cabecera muestra "Entrar" y el botón no se pinta. | `features/account/__tests__/AccountMenu.test.tsx` ("con la API caída muestra Entrar (RN-ACCOUNT-05)"); el botón de favorito lo cubren `next build` (◐ en `/p/[slug]` y `/tienda/[slug]`) y `e2e/account.spec.ts` |
| `RN-ACCOUNT-06` | Una dirección nueva sólo se envía con las coordenadas de "Usar mi ubicación"; sin ellas el botón de guardar queda deshabilitado. | `features/account/__tests__/accountActions.test.ts` ("una dirección nueva sin coordenadas devuelve el aviso sin llamar a la API (RN-ACCOUNT-06)"); el botón deshabilitado, `e2e/account.spec.ts` |
| `RN-ACCOUNT-07` | Los datos de facturación viajan completos o como `null`: documento de 5 a 9 dígitos, nombre hasta 100, dirección de 8 a 250, teléfono venezolano de 11 dígitos con prefijo del catálogo, tipos V/E/J/G y special/ordinary. | `features/account/__tests__/formSchemas.test.ts` ("billingFormSchema"); `features/account/__tests__/accountActions.test.ts` ("updateBilling y clearBilling") |
| `RN-ACCOUNT-08` | El registro exige los datos del cliente del TPV: documento V/E/J/G, nombre hasta 100, teléfono venezolano de 11 dígitos, dirección de 8 a 250 y contribuyente; sin ellos no llama a la API. | `features/account/__tests__/formSchemas.test.ts` (RN-ACCOUNT-08); `features/account/__tests__/actions.test.ts` (RN-ACCOUNT-08); `e2e/account.spec.ts` |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Opciones o forma válida de la cookie | `sessionCookieOptions` y `readSession` en `server/session.ts` | el `toHaveBeenCalledWith` de `__tests__/actions.test.ts` y los casos de `__tests__/session.test.ts`; la constante `SESSION_COOKIE` de `proxy.ts` repite el nombre |
| Qué rutas de vuelta se aceptan | `safeReturnPath` en `lib/returnPath.ts` | sus casos en `__tests__/returnPath.test.ts` |
| Reglas de forma de un campo de formulario | su esquema en `lib/formSchemas.ts`, espejo del FormRequest de `posveapi/app/Http/Requests/Marketplace/Customer/` y nunca más estricto | la clave del campo es la de la API; `formStateFromZod` la deja en `fields`; los bordes en `__tests__/formSchemas.test.ts` |
| Traducción de un error de la API a mensaje de formulario | `formStateFromError` en `lib/formState.ts` | los casos de error de `__tests__/actions.test.ts` |
| Una acción nueva de cuenta con sesión | `server/actions.ts`, envuelta en `withSession(returnTo, run)` | el 401 `unauthenticated` lo resuelve `withSession`; `formStateFromError` lo relanza |
| Textos o campos de un formulario | `components/LoginForm.tsx`, `components/RegisterForm.tsx`, `components/RecoveryForms.tsx`, `components/VerifyEmailForm.tsx` | el `pick` de su acción en `server/actions.ts` (qué valores vuelven al formulario) |
| Rutas que exigen sesión | `matcher` de `proxy.ts` y `requireCustomer(path)` en la página | `disallow` de `app/robots.ts` si la ruta no se indexa |
| Una pantalla nueva de `/cuenta` | `app/cuenta/<ruta>/page.tsx`, con `metadata` `noindex` y el cuerpo async en un `<Suspense>` que empieza con `requireCustomer("<su ruta>")` | el enlace sólo en `accountLinks` de `lib/accountLinks.ts` (lo usan `AccountNav`, `AccountDropdown` y `AccountOverviewMenu`; decide si es acceso rápido o fila de la lista); las de compras (`/cuenta/compras*`, módulo `features/purchases`) sólo con `cartEnabled()` |
| Una mutación de cuenta | `server/accountActions.ts`, envuelta en `withSession(returnTo, ...)`; errores de negocio por `formStateFromError` | su formulario `"use client"` con `useActionState` y su prefijo de `useId()`; el caso en `__tests__/accountActions.test.ts` |
| Campos o textos de perfil, dirección o configuración | `components/ProfileForm.tsx`, `components/BillingForm.tsx`, `components/AddressForm.tsx`, `components/AddressActionButton.tsx`, `components/SettingsForms.tsx` | el `pick` o los campos que lee su acción en `server/accountActions.ts` |
| Dónde se ofrece el favorito | `<FavoriteButton />` dentro de su propio `<Suspense fallback={<FavoriteButtonSkeleton />}>` en la ficha | nada de `<Suspense>` por encima de la página (`seo.md` regla 7) |

## 4. API pública

Ruta de vuelta, `features/account/lib/returnPath.ts` (puro, usable en cliente y en `proxy.ts`):

- `safeReturnPath(raw: unknown, fallback = "/cuenta"): string` (RN-ACCOUNT-02; además rechaza `\`, caracteres de control y más de 512 caracteres)
- `loginHref(path: string): string`: `/entrar?volver=<path codificado>`

Estado de formulario, `features/account/lib/formState.ts` (puro):

- `type FormState = { status: "idle" | "error" | "success"; message: string | null; fields: Record<string, string>; values: Record<string, string> }`
- `INITIAL_FORM_STATE: FormState`: `idle`, `null`, `{}`, `{}`
- `formStateFromError(error: unknown, values: Record<string, string>): FormState`: `validation_failed` da el mensaje y `fields` de la API; `invalid_credentials`, `token_invalid`, `token_expired`, `not_found` y `open_orders` (eliminar la cuenta con pedidos en curso), el mensaje de la API; `too_many_attempts`, "Demasiados intentos, prueba en {retryAfter} segundos"; `MarketplaceUnavailableError`, "No pudimos conectar con el servicio. Intenta de nuevo en unos segundos."; `unauthenticated` se relanza para que `withSession` redirija; cualquier otro código, "No pudimos completar la acción. Intenta de nuevo."; un error que no es de la API se relanza.
- `formStateFromZod(error: ZodError, values: Record<string, string>): FormState`: "Revisa los datos del formulario." y en `fields` el primer mensaje de cada campo, con la clave del campo de la API.
- `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `profileSchema` (`email` y `current_password` opcionales: sólo viajan si cambia el correo), `changePasswordSchema`, `deleteAccountSchema`, `addressSchema` (sin coordenadas), `addressCoordsSchema` (`lat` entre -90 y 90, `lng` entre -180 y 180) `billingFormSchema` (claves planas `billing.<campo>` de RN-ACCOUNT-07) y `registerSchema` (suma `billing.document_type`, `billing.document`, `billing.address` y `billing.taxpayer_type`; nombre y teléfono con las reglas de RN-ACCOUNT-08): esquemas zod de `lib/formSchemas.ts`, con los máximos, la regex de teléfono y la contraseña de 8 a 72 caracteres de la API; validan el texto recortado salvo las contraseñas.

Sesión, `features/account/server/session.ts` (`import "server-only"`):

- `SESSION_COOKIE = "mp_session"`
- `sessionCookieOptions(): { httpOnly: true; secure: boolean; sameSite: "lax"; path: "/"; maxAge: number }`
- `readSession(): Promise<string | null>` (RN-ACCOUNT-01)
- `clientIpFrom(forwardedFor: string | null): string | null` (RN-ACCOUNT-04)
- `clientIp(): Promise<string | null>`: `clientIpFrom` sobre `x-forwarded-for` de `headers()`
- `accountContext(): Promise<AccountContext>`
- `getCurrentCustomer(): Promise<Customer | null>`, envuelta en `cache` de React: una lectura de `getMe` por petición
- `requireCustomer(path: string): Promise<{ customer: Customer; ctx: AccountContext }>`: sin sesión, `redirect(loginHref(path))`; con 401 `unauthenticated`, `redirect("/api/sesion/vencida?volver=<path>")`
- `withSession<T>(returnTo: string, run: (ctx: AccountContext) => Promise<T>): Promise<T>`: sin sesión, `redirect(loginHref(returnTo))`; si `run` lanza `unauthenticated`, `endSession(loginHref(returnTo))`
- `endSession(to: string): Promise<never>`: borra `mp_session` con `path: "/"` y redirige; sólo desde una Server Action

Acciones de servidor, `features/account/server/actions.ts` (`"use server"`), `(prev: FormState, formData: FormData) => Promise<FormState>` salvo `logout`:

- `login`: `email`, `password`, `volver`; éxito, fija `mp_session`, fusiona el carrito de invitado (`mergeGuestCart` de `features/cart/server/cart.ts` con el token nuevo, si el carrito está encendido; `RN-CART-02`) y `redirect(safeReturnPath(volver))`
- `register`: `name`, `email`, `phone`, `password`, `billing.document_type`, `billing.document`, `billing.address`, `billing.taxpayer_type`, `volver` (la API aún recibe sólo los cuatro primeros); éxito, igual que `login`
- `logout(): Promise<void>`: `logoutCustomer` si hay sesión, ignorando `MarketplaceUnavailableError` y `MarketplaceAccountError`; después `endSession("/")`
- `forgotPassword`: `email`; éxito, el mismo mensaje para cualquier correo
- `resetPasswordAction`: `token`, `password`; éxito, `endSession("/entrar?aviso=contrasena")`; con `token_invalid` o `token_expired` devuelve además `fields.token` con el mensaje de la API
- `verifyEmailAction`: `token`; éxito, "Tu correo quedó verificado."
- `resendVerificationAction`: sin campos, dentro de `withSession("/cuenta", ...)`; éxito, "Te enviamos un enlace nuevo. Revisa tu correo."

Componentes, `features/account/components/FormFeedback.tsx` (sin estado, usable desde cliente):

- `FormNotice({ state }: { state: FormState })`: no pinta nada; en `error` y `success` dispara el toast con `useActionToast` (nada en `idle`)
- `FieldError({ id, state, name }: { id: string; state: FormState; name: string })`: `<p id={id}>` con `state.fields[name]` si existe

Acciones de cuenta, `features/account/server/accountActions.ts` (`"use server"`), todas con `withSession`:

- `updateProfile`: `name`, `phone`, `email`, `current_email` (oculto), `current_password`; manda `name` y `phone`, y `email` con `current_password` sólo si `email` difiere de `current_email`
- `updateBilling`: los seis campos `billing.*`; valida con `billingFormSchema`, recorta y manda `updateMe(ctx, { billing })`
- `clearBilling`: sin campos; manda `updateMe(ctx, { billing: null })`
- `changePasswordAction`: `current_password`, `password`
- `updateSettingsAction`: casilla `order_status_emails` (`"on"` es verdadero)
- `deleteAccountAction`: `password`; éxito, `endSession("/")`; 409 `open_orders`, el mensaje de la API en el formulario
- `saveAddress`: `address_id` vacío crea y si no actualiza; `label`, `recipient_name`, `phone`, `city_slug`, `line`, `reference` (vacío es `null`), `lat`, `lng`, `coords_changed`, `is_default`; una dirección nueva exige `lat` y `lng` válidos por `addressCoordsSchema` (RN-ACCOUNT-06) y una edición manda `lat` y `lng` sólo con `coords_changed=1`
- `deleteAddressAction(prev, formData)` y `setDefaultAddress(prev, formData)`: `address_id`; devuelven `FormState` ("Eliminamos la dirección." o "Marcamos la dirección como predeterminada."); un `address_id` inválido o `not_found` dan error "No encontrado."; refrescan la lista aun con error
- `toggleFavorite(prev, formData)`: `kind`, `slug`, `mode` (`add` o `remove`), `volver`; devuelve `FormState` ("Guardamos el favorito." o "Quitamos el favorito."); un dato inválido o `not_found` dan error "No encontrado."; `unauthenticated` redirige a entrar con `volver`; refresca aun con error

Cabecera y favoritos, componentes async que van dentro de su `<Suspense>`:

- `AccountSlot()` y `AccountSlotSkeleton()`, `features/account/components/AccountMenu.tsx`: enlace "Entrar" sin comprador o con la API caída; con comprador, `<AccountDropdown showPurchases={cartEnabled()} />` (RN-ACCOUNT-05)
- `AccountDropdown({ showPurchases }: { showPurchases: boolean })`, `features/account/components/AccountDropdown.tsx` (`"use client"`): `DropdownMenu` de shadcn con el disparador "Mi cuenta" (`Button` outline `sm`), los enlaces de `accountLinks(showPurchases)` (`showPurchases` lo decide el servidor con el interruptor del carrito; enlaces `menuitem`) y "Salir". "Salir" envía con `requestSubmit()` un `<form action={logout} hidden>` que vive fuera del menú: al elegir un ítem Radix cierra el menú y, con movimiento reducido (sin animación de salida), desmonta el contenido en el mismo evento, así que un botón `submit` dentro del menú quedaría en un formulario desconectado y no enviaría (L-05). Sin JavaScript el menú no abre (decisión 4 del plan 5)
- `AccountLink = { href: string; label: string; icon: LucideIcon }`, `accountLinks(showPurchases: boolean): AccountLink[]`, `accountQuickLinks(showPurchases: boolean): AccountLink[]`, `accountListLinks(): AccountLink[]` e `isActiveLink(href: string, pathname: string): boolean`, `features/account/lib/accountLinks.ts` (puro): la única lista de enlaces de la cuenta, en el orden de W11/P11: Resumen, los accesos rápidos (Compras sólo con `showPurchases`, Favoritos y Direcciones) y la lista (Perfil y facturación, Configuración y Ayuda, que va a `/ayuda`), que comparten `AccountNav`, `AccountDropdown` y `AccountOverviewMenu`; `isActiveLink` marca Resumen sólo en `/cuenta` exacto y cualquier otro enlace también en sus subrutas (`/cuenta/compras/<código>` activa Mis compras)
- `AccountNav({ showPurchases, identity, compactIdentity }: { showPurchases: boolean; identity: ReactNode; compactIdentity: ReactNode })` y `AccountNavSkeleton()`, `features/account/components/AccountNav.tsx` (`"use client"`): desde `lg`, barra lateral con ítems de ícono, flecha y "Cerrar sesión" al pie (un `<form action={logout}>` con botón `submit`, fuera de un menú, así que L-05 no aplica); por debajo de `lg`, pestañas subrayadas desplazables con "Cerrar sesión" al final, salvo en `/cuenta` exacto, donde no se pintan porque el resumen trae sus accesos y su lista (la cabecera ya no trae "Mi cuenta" bajo `md`). La activa lleva `aria-current="page"` según `usePathname()` y en el teléfono se desplaza a la vista al montar. Va en `<Suspense fallback={<AccountNavSkeleton />}>` porque `/cuenta/compras/[codigo]` tiene un parámetro que `usePathname` sólo resuelve en la petición
- `AccountIdentity({ compact? }: { compact?: boolean })` y `AccountIdentitySkeleton({ compact? })`, `features/account/components/AccountIdentity.tsx` (async, servidor): ficha del comprador con iniciales sobre `bg-primary-soft`, nombre, correo y un chip "Correo verificado" (`success-soft`) o "Correo sin verificar" (`warning-soft`) según `email_verified`; sin comprador no pinta nada. El layout la pasa a `AccountNav` como `identity` (cabecera de la tarjeta lateral, `lg`) y como `compactIdentity` (franja sobre las pestañas, por debajo de `lg`), cada una en su `<Suspense>`. Se actualiza porque las acciones de perfil llaman a `refresh()`, que vuelve a pintar la ruta con sus layouts, y `getCurrentCustomer` lee `getMe` en cada petición
- `AccountQuickLinks({ showPurchases }: { showPurchases: boolean })` y `AccountMenuList()`, `features/account/components/AccountOverviewMenu.tsx` (servidor, sólo bajo `lg`): los accesos rápidos de `accountQuickLinks` (`<nav aria-label="Accesos">`, tres tarjetas con ícono) y la lista de `accountListLinks` con "Cerrar sesión" al final (un `<form action={logout}>` con botón `submit`, fuera de un menú: L-05 no aplica). `app/cuenta/page.tsx` los pone al inicio y al final del resumen, como P11; el interruptor de modo oscuro del lienzo no está
- `FavoriteButton({ target, returnTo }: { target: FavoriteTarget; returnTo: string })` y `FavoriteButtonSkeleton()`, `features/account/components/FavoriteButton.tsx`: sin sesión o con `unauthenticated`, enlace a `loginHref(returnTo)`; con sesión, un `FavoriteToggleForm` con "Guardar en favoritos" o "Quitar de favoritos"; con la API caída no pinta nada
- `FavoriteToggleForm({ target, mode, returnTo, children, className?, pressed?, ariaLabel? })`, `features/account/components/FavoriteToggleForm.tsx` (`"use client"`): formulario de un botón con `useActionState` sobre `toggleFavorite`, usado por `FavoriteButton` y por `/cuenta/favoritos`; dispara el toast dentro de la acción porque el `refresh()` quita la tarjeta del favorito (L-06)

Formularios `"use client"` con `useActionState`:

- `ProfileForm({ customer }: { customer: Customer })`, `features/account/components/ProfileForm.tsx`
- `BillingFields({ state, billing, fields?, selectKey? })`, `features/account/components/BillingFields.tsx`: los campos `billing.<campo>` sin `<form>`; `fields` elige cuáles pinta (todos por omisión; el registro omitirá `name` y `phone`) y `selectKey` es la `key` de los `Select` (L-04). Lo usa `BillingForm`. `BillingFieldName` (`keyof Billing`) es el tipo de los nombres de `fields`.
- `BillingForm({ billing }: { billing: Billing | null })`, `features/account/components/BillingForm.tsx`: sección "Datos de facturación" de `/cuenta/perfil`; sus campos se llaman `billing.<campo>` para que coincidan con `billingFormSchema` y con los errores de la API. Tipo de documento y de contribuyente son `Select` de shadcn que se montan de nuevo con cada respuesta (`key`, L-04). "Borrar mis datos de facturación" es un formulario aparte, siempre montado y deshabilitado sin datos, para que el toast sobreviva al `refresh()` (L-06); al borrar con éxito los campos se montan en blanco
- `AddressForm({ address, cities }: { address: Address | null; cities: { slug: string; name: string; state: string }[] })`, `features/account/components/AddressForm.tsx`: obtiene `lat` y `lng` con `navigator.geolocation` al tocar "Usar mi ubicación"; si es nueva, "Guardar dirección" queda deshabilitado sin coordenadas. La ciudad es un `Select` de shadcn agrupado por estado (`SelectGroup` y `SelectLabel`) con `name="city_slug"`; se monta de nuevo con cada respuesta de la acción (`key`), porque Radix vuelve al valor con que se montó cuando React 19 resetea el formulario y así perdería la ciudad elegida tras un error
- `AddressActionButton({ kind, addressId, addressLabel }: { kind: "default" | "delete"; addressId: number; addressLabel: string })`, `features/account/components/AddressActionButton.tsx`: formulario de un botón con `useActionState` sobre `setDefaultAddress` o `deleteAddressAction`; dispara el toast dentro de la acción y no en un efecto, porque el `refresh()` de la respuesta quita la tarjeta y el efecto no correría con el componente desmontado
- `PasswordChangeForm()`, `NotificationsForm({ enabled }: { enabled: boolean })` y `DeleteAccountForm()`, `features/account/components/SettingsForms.tsx`
- `LoginForm({ volver }: { volver: string })`, `features/account/components/LoginForm.tsx`
- `RegisterForm({ volver }: { volver: string })`, `features/account/components/RegisterForm.tsx`
- `ForgotPasswordForm()` y `ResetPasswordForm({ token }: { token: string })`, `features/account/components/RecoveryForms.tsx`
- `VerifyEmailForm({ token }: { token: string })` y `ResendVerificationForm()`, `features/account/components/VerifyEmailForm.tsx`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `startSession` | `features/account/server/actions.ts` | escribe `mp_session` con `sessionCookieOptions()` tras `login` o `register` y fusiona `mp_cart` (`RN-CART-02`) |
| `pick` | `features/account/server/actions.ts` | arma `values` sólo con los campos nombrados, así las contraseñas nunca vuelven al formulario |
| `useFormValidation` | `hooks/useFormValidation.ts` | `useFormValidation(schema, actionState, prepare?) -> { onSubmit, onChange, state }`: valida el `FormData` (o lo que devuelva `prepare(values)`) con el esquema en `onSubmit`; si falla cancela el envío con `preventDefault` (la acción de `useActionState` no corre), mueve el foco al primer campo inválido (si es el `select` oculto de un Select de Radix, al `combobox` de su contenedor) y devuelve `state` con `fields` donde los errores del cliente pisan a los del servidor. `onChange` va en el `<form>` y vuelve a validar al editar: quita los errores del cliente que ya pasan, actualiza el mensaje de los que siguen fallando y quita el del servidor sólo en el campo editado si pasa el esquema; nunca agrega errores antes de enviar, y una respuesta nueva del servidor vuelve a mostrar los suyos. Lo usan `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `ProfileForm` (con `prepare`: sólo manda `email` y `current_password` si el correo cambió), `BillingForm`, `PasswordChangeForm`, `DeleteAccountForm` y `AddressForm` |
| Guardia de `/cuenta` | `proxy.ts` | sin la cookie `mp_session` redirige a `loginHref(pathname)`; con cookie sigue y la validez la resuelve `requireCustomer` |
| Sesión vencida | `app/api/sesion/vencida/route.ts` | `GET` borra `mp_session` y responde 303 a `/entrar?volver=<safeReturnPath(volver)>&aviso=sesion` |
| Pantallas de cuenta | `app/cuenta/layout.tsx`, `app/cuenta/page.tsx` (saludo, avisos de correo, `LastPurchase`, `BuyAgain` y `RecentPurchases`, en ese orden y cada uno en su `<Suspense>`), `app/cuenta/{perfil,direcciones,favoritos,configuracion}/page.tsx` | `metadata` `noindex, nofollow`; el layout pinta `AccountNav` (en su `<Suspense>`, con `AccountIdentity` en el suyo) y los hijos en un panel, sin leer la sesión él mismo; cada página empieza con `requireCustomer("<su ruta>")` en un hijo dentro de `<Suspense>`; sin favoritos o sin direcciones, `EmptyState` (`components/EmptyState.tsx`, `h2`) con 'Buscar productos' |
| Montaje en la cabecera y las fichas | `features/site/components/SiteHeader.tsx`, `app/p/[slug]/page.tsx`, `app/tienda/[slug]/page.tsx` | `<AccountSlot />` dentro de `SiteHeader` (`features/site/components/SiteHeader.tsx`), después del `<Suspense>` de `HeaderSearchSlot`; `<FavoriteButton />` en su propio `<Suspense>` (en la tienda, como hijo de `StoreHeader`); `<main>` y la resolución del 404 quedan fuera de toda frontera |
| Páginas de acceso | `app/entrar/page.tsx`, `app/registro/page.tsx`, `app/recuperar/page.tsx`, `app/restablecer/[token]/page.tsx`, `app/verificar/[token]/page.tsx` | `metadata` con `noindex, nofollow`; leen `searchParams` o `params` en un hijo dentro de `<Suspense>` |

## 6. Dependencias

- `lib/marketplace/client.ts`: `loginCustomer`, `registerCustomer`, `logoutCustomer`, `requestPasswordReset`, `resetPassword`, `verifyEmail`, `resendVerification`, `getMe`, `updateMe`, `changePassword`, `updateSettings`, `deleteAccount`, `listAddresses`, `createAddress`, `updateAddress`, `deleteAddress`, `listFavorites`, `addFavorite`, `removeFavorite` y `listLocations`.
- `lib/marketplace/errors.ts`: `MarketplaceAccountError` y `MarketplaceUnavailableError`.
- `lib/marketplace/params.ts` (`AccountContext`, `FavoriteTarget`) y `lib/marketplace/schemas.ts` (`Customer`, `Address`, `FavoritesResponse`, `AddressInput`, `AddressPatch`, `ProfilePatch`), sólo tipos.
- `zod` (`lib/formSchemas.ts`) y `features/search/components/ProductThumb.tsx`.
- `next/headers` (`cookies`, `headers`), `next/navigation` (`redirect`), `next/cache` (`refresh`), `next/server` (`NextResponse`) y `node:net` (`isIP`).
- `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/select.tsx` (ciudad de `AddressForm`), `components/ui/dropdown-menu.tsx` (menú de cuenta) y `components/ui/skeleton.tsx`; íconos de `lucide-react`.

## 7. Ejemplo de uso

```tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/account/components/LoginForm";
import { safeReturnPath } from "@/features/account/lib/returnPath";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function LoginPanel({ searchParams }: { searchParams: SearchParams }) {
  const volver = safeReturnPath((await searchParams).volver);
  return <LoginForm volver={volver} />;
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full max-w-md" />}>
      <LoginPanel searchParams={searchParams} />
    </Suspense>
  );
}
```

## 8. Restricciones

- Sólo una Server Action o un Route Handler escriben o borran `mp_session`: `startSession` y `endSession` en las acciones, y `app/api/sesion/vencida/route.ts`; por eso `requireCustomer`, que corre en el render, redirige a ese Route Handler en vez de borrarla.
- `getCurrentCustomer`, `requireCustomer`, `readSession`, `clientIp` y `accountContext` leen `cookies()` o `headers()`: quien los usa los envuelve en `<Suspense>` (`cacheComponents: true`) y nunca dentro de `'use cache'` ni `generateMetadata`.
- `redirect` y `endSession` se llaman fuera del `try`, porque lanzan para cortar la acción.
- `proxy.ts` sólo mira que la cookie exista: no llama a la API, así una cookie inválida llega a `requireCustomer`, que la trata como sin sesión.
- La verificación del correo va por botón y no al cargar `/verificar/[token]`, para que el análisis de enlaces de los clientes de correo no gaste el token.
- Las rutas de acceso y `/cuenta/*` exportan `robots: { index: false, follow: false }` y no entran al sitemap; `app/robots.ts` excluye `/cuenta`, `/restablecer/` y `/verificar/`.
- `AccountSlot` y `FavoriteButton` atrapan `MarketplaceUnavailableError` y `MarketplaceAccountError` y degradan, porque `app/error.tsx` no cubre el layout raíz (L-02) y una falla del favorito no debe tumbar la ficha; el resto de las pantallas de `/cuenta` dejan que la falla llegue a `app/error.tsx`.
- Los formularios de cuenta usan el prefijo de `useId()` en los `id` de sus controles y errores, porque una página tiene varios con el mismo campo (dos `password` en configuración, un `AddressForm` por dirección).
- Las contraseñas nunca vuelven en `values`.
- Los formularios con `useFormValidation` llevan `noValidate` para que se vean los mensajes en español del esquema y no los del navegador; `FormNotice` recibe el estado crudo de la acción (`actionState`), no el de `useFormValidation`, porque su objeto cambia con cada error de cliente y repetiría el toast. `AddressForm` cuenta las respuestas (`key` del Select, L-04) sobre `actionState` por lo mismo: con el estado de la vista, un error de cliente remontaría el Select y perdería la ciudad.
- `FavoriteButton` al pintarse no toca la cookie (corre en el render): ante un 401 `unauthenticated` ofrece el enlace a entrar, y `toggleFavorite`, al enviarse, lo resuelve con `withSession`.
- Despliegue: Next sólo escribe `x-forwarded-for` si falta: en producción un proxy delante debe reescribirlo con la IP real, o el navegador lo controla, `X-Client-IP` miente y el límite de 5 logins por correo e IP se esquiva.

## 9. Pruebas

- Comando: `npx vitest run features/account`
- `features/account/__tests__/returnPath.test.ts`: ruta interna aceptada y los valores que vuelven a `/cuenta`.
- `features/account/__tests__/session.test.ts`: IP de `x-forwarded-for`, validez del valor de `mp_session` y opciones de la cookie en producción.
- `features/account/__tests__/actions.test.ts`: `login` con cookie y redirección, `volver` externo, credenciales inválidas, 429 y API caída; `logout` con la API caída; `resendVerificationAction` con 401 `unauthenticated` y con API caída; `forgotPassword` con cualquier correo.
- `features/account/__tests__/formSchemas.test.ts`: bordes válidos para la API que los esquemas no rechazan (contraseña de 72 y sin recortar, teléfono con símbolos, correo sin dominio de nivel superior, perfil sin email, referencia vacía, coordenadas en los límites).
- `hooks/__tests__/useFormValidation.test.tsx`: envío inválido cancelado sin llamar a la acción, foco al primer campo inválido, envío válido que llega a la acción, `prepare` del perfil (correo sin cambio no se valida) y foco al `combobox` cuando el control con nombre está oculto.
- `features/account/__tests__/formState.test.ts`: `formStateFromZod` (primer mensaje por campo con la clave de la API) y `formStateFromError` con un código sin mapear, `unauthenticated` y un error ajeno.
- `features/account/__tests__/accountActions.test.ts`: `updateProfile` con y sin cambio de correo, `saveAddress` nueva sin coordenadas y edición sin `coords_changed`, `toggleFavorite` con `unauthenticated`, éxito, `not_found`, código sin mapear y datos inválidos, `deleteAddressAction` y `setDefaultAddress` con éxito, `not_found`, código sin mapear, id inválido y `unauthenticated`, `deleteAccountAction` con contraseña errada, con pedidos en curso (`open_orders`) y con éxito.
- `features/account/__tests__/formSchemas.test.ts` y `accountActions.test.ts` también cubren `billingFormSchema` (bordes, siete prefijos de teléfono y catálogos) y `updateBilling`/`clearBilling` (billing recortado, error con clave `billing.phone`, `billing: null`).
- `features/account/__tests__/AddressActionButton.test.tsx`: eliminar envía `address_id` y avisa el éxito en un toast; `not_found` se avisa como error.
- `features/account/__tests__/FavoriteToggleForm.test.tsx`: envía `kind`, `slug`, `mode` y `volver` y avisa el éxito en un toast; un error se avisa como error.
- `features/account/__tests__/AccountMenu.test.tsx`: `AccountSlot` sin comprador, con la API caída y con comprador (abre el menú con Enter y comprueba los siete enlaces `menuitem` y sus `href`). "Cerrar sesión" (lista y pestañas) lo cubre `e2e/account.spec.ts` con movimiento normal; con movimiento reducido se comprobó a mano al cerrar el plan 5 y no queda en el e2e.
- `features/account/__tests__/accountLinks.test.ts`: orden de `accountLinks`, sin Compras con el carrito apagado, accesos y lista sin repetirse y `isActiveLink`.
- `e2e/account.spec.ts` (en serie, `npx playwright test`): el recorrido de la cuenta en simulado, de registrarse a favoritos (con el toast al eliminar una dirección), los accesos rápidos y la lista del resumen en móvil, `noindex` y cabecera en móvil.
