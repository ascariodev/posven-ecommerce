---
module: "account"
path: "features/account"
type: "feature"
exports: ["safeReturnPath", "loginHref", "FormState", "INITIAL_FORM_STATE", "formStateFromError", "SESSION_COOKIE", "sessionCookieOptions", "readSession", "clientIpFrom", "clientIp", "accountContext", "getCurrentCustomer", "requireCustomer", "withSession", "endSession", "login", "register", "logout", "forgotPassword", "resetPasswordAction", "verifyEmailAction", "resendVerificationAction", "FormNotice", "FieldError", "LoginForm", "RegisterForm", "ForgotPasswordForm", "ResetPasswordForm", "VerifyEmailForm", "ResendVerificationForm"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "components/ui/button.tsx", "components/ui/input.tsx", "components/ui/card.tsx", "components/ui/skeleton.tsx"]
tests: "features/account/*.test.ts"
verified_against: ["features/account/returnPath.ts", "features/account/formState.ts", "features/account/session.ts", "features/account/actions.ts", "features/account/FormFeedback.tsx", "features/account/LoginForm.tsx", "features/account/RegisterForm.tsx", "features/account/RecoveryForms.tsx", "features/account/VerifyEmailForm.tsx", "features/account/returnPath.test.ts", "features/account/session.test.ts", "features/account/actions.test.ts", "app/entrar/page.tsx", "app/registro/page.tsx", "app/recuperar/page.tsx", "app/restablecer/[token]/page.tsx", "app/verificar/[token]/page.tsx", "app/api/sesion/vencida/route.ts", "proxy.ts", "app/robots.ts", "lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts"]
capabilities:
  - intent: "leer el comprador de la sesión"
    intent_aliases: ["comprador actual", "usuario logueado", "sesion del comprador", "esta logueado", "cookie mp_session", "exigir sesion"]
    entrypoint: "getCurrentCustomer()"
    file: "features/account/session.ts"
    input: "sin parámetros; lee la cookie mp_session y x-forwarded-for de la petición"
    output: "Customer ({ name, email, phone, email_verified, pending_email, settings: { order_status_emails } }) o null sin sesión, con sesión inválida o con 401 unauthenticated; requireCustomer(path) devuelve { customer, ctx } o redirige"
    source: "cookie mp_session y getMe() de lib/marketplace"
    rules: ["RN-ACCOUNT-01", "RN-ACCOUNT-03", "RN-ACCOUNT-04"]
  - intent: "entrar, crear cuenta y recuperar la contraseña"
    intent_aliases: ["login", "iniciar sesion", "registro", "crear cuenta", "olvide mi contrasena", "restablecer contrasena", "verificar correo", "cerrar sesion"]
    entrypoint: "login() / register() / logout() / forgotPassword() / resetPasswordAction() / verifyEmailAction() / resendVerificationAction()"
    file: "features/account/actions.ts"
    input: "(prev: FormState, formData: FormData) con email, password, name, phone, token o volver según la acción; logout sin parámetros"
    output: "FormState { status: idle | error | success; message; fields; values sin password ni current_password }; login y register fijan mp_session y redirigen a safeReturnPath(volver)"
    source: "API de posveapi vía lib/marketplace/client.ts; cookie mp_session"
    rules: ["RN-ACCOUNT-01", "RN-ACCOUNT-02", "RN-ACCOUNT-03"]
---

# Módulo `account`

## 1. Propósito

Sesión del comprador del marketplace: la cookie `mp_session` con el token de posveapi, su lectura
en el servidor y las acciones de entrar, crear cuenta, salir, recuperar la contraseña y verificar
el correo. No guarda datos del comprador fuera de la cookie ni valida credenciales: lo hace la API.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-ACCOUNT-01` | `mp_session` es `httpOnly`, `SameSite=Lax`, `Path=/`, de 30 días y `Secure` en producción; un valor sin la forma del token de posveapi o de más de 512 caracteres equivale a no tener sesión. | `features/account/session.test.ts` ("trata un valor sin la forma del token como sin sesión", "en producción trae secure y las demás opciones exactas"); `features/account/actions.test.ts` ("fija mp_session con las opciones exactas y redirige a volver") |
| `RN-ACCOUNT-02` | `volver` sólo acepta rutas internas: empieza con `/` y no con `//` ni `/\`; cualquier otro valor vuelve a `/cuenta`. | `features/account/returnPath.test.ts` ("acepta una ruta interna con consulta", "devuelve /cuenta ante %j"); `features/account/actions.test.ts` ("con volver externo redirige a /cuenta") |
| `RN-ACCOUNT-03` | Un 401 `unauthenticated` borra `mp_session` y lleva a `/entrar?volver=`; un 401 sin esa forma es API caída y conserva la cookie. | `features/account/actions.test.ts` ("con unauthenticated borra la cookie y lleva a entrar", "con un 401 que llega como API caída conserva la cookie") |
| `RN-ACCOUNT-04` | La IP del cliente es el último valor de `x-forwarded-for` si `isIP` lo acepta; si no, no se manda `X-Client-IP`. | `features/account/session.test.ts` ("toma el último valor de x-forwarded-for", "devuelve null ante un valor que no es IP o sin encabezado") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Opciones o forma válida de la cookie | `sessionCookieOptions` y `readSession` en `session.ts` | el `toHaveBeenCalledWith` de `actions.test.ts` y los casos de `session.test.ts`; la constante `SESSION_COOKIE` de `proxy.ts` repite el nombre |
| Qué rutas de vuelta se aceptan | `safeReturnPath` en `returnPath.ts` | sus casos en `returnPath.test.ts` |
| Traducción de un error de la API a mensaje de formulario | `formStateFromError` en `formState.ts` | los casos de error de `actions.test.ts` |
| Una acción nueva de cuenta con sesión | `actions.ts`, envuelta en `withSession(returnTo, run)` | el 401 `unauthenticated` lo resuelve `withSession`; `formStateFromError` lo relanza |
| Textos o campos de un formulario | `LoginForm.tsx`, `RegisterForm.tsx`, `RecoveryForms.tsx`, `VerifyEmailForm.tsx` | el `pick` de su acción en `actions.ts` (qué valores vuelven al formulario) |
| Rutas que exigen sesión | `matcher` de `proxy.ts` y `requireCustomer(path)` en la página | `disallow` de `app/robots.ts` si la ruta no se indexa |

## 4. API pública

Ruta de vuelta, `features/account/returnPath.ts` (puro, usable en cliente y en `proxy.ts`):

- `safeReturnPath(raw: unknown, fallback = "/cuenta"): string` (RN-ACCOUNT-02; además rechaza `\`, caracteres de control y más de 512 caracteres)
- `loginHref(path: string): string`: `/entrar?volver=<path codificado>`

Estado de formulario, `features/account/formState.ts` (puro):

- `type FormState = { status: "idle" | "error" | "success"; message: string | null; fields: Record<string, string>; values: Record<string, string> }`
- `INITIAL_FORM_STATE: FormState`: `idle`, `null`, `{}`, `{}`
- `formStateFromError(error: unknown, values: Record<string, string>): FormState`: `validation_failed` da el mensaje y `fields` de la API; `invalid_credentials`, `token_invalid`, `token_expired` y `not_found`, el mensaje de la API; `too_many_attempts`, "Demasiados intentos, prueba en {retryAfter} segundos"; `MarketplaceUnavailableError`, "No pudimos conectar con el servicio. Intenta de nuevo en unos segundos."; lo demás se relanza.

Sesión, `features/account/session.ts` (`import "server-only"`):

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

Acciones de servidor, `features/account/actions.ts` (`"use server"`), `(prev: FormState, formData: FormData) => Promise<FormState>` salvo `logout`:

- `login`: `email`, `password`, `volver`; éxito, fija `mp_session` y `redirect(safeReturnPath(volver))`
- `register`: `name`, `email`, `phone`, `password`, `volver`; éxito, igual que `login`
- `logout(): Promise<void>`: `logoutCustomer` si hay sesión, ignorando `MarketplaceUnavailableError` y `MarketplaceAccountError`; después `endSession("/")`
- `forgotPassword`: `email`; éxito, el mismo mensaje para cualquier correo
- `resetPasswordAction`: `token`, `password`; éxito, `endSession("/entrar?aviso=contrasena")`; con `token_invalid` o `token_expired` devuelve además `fields.token` con el mensaje de la API
- `verifyEmailAction`: `token`; éxito, "Tu correo quedó verificado."
- `resendVerificationAction`: sin campos, dentro de `withSession("/cuenta", ...)`; éxito, "Te enviamos un enlace nuevo. Revisa tu correo."

Componentes, `features/account/FormFeedback.tsx` (sin estado, usable desde cliente):

- `FormNotice({ state }: { state: FormState })`: nada en `idle`; `role="alert"` en `error` y `role="status"` en `success`
- `FieldError({ id, state, name }: { id: string; state: FormState; name: string })`: `<p id={id}>` con `state.fields[name]` si existe

Formularios `"use client"` con `useActionState`:

- `LoginForm({ volver }: { volver: string })`, `features/account/LoginForm.tsx`
- `RegisterForm({ volver }: { volver: string })`, `features/account/RegisterForm.tsx`
- `ForgotPasswordForm()` y `ResetPasswordForm({ token }: { token: string })`, `features/account/RecoveryForms.tsx`
- `VerifyEmailForm({ token }: { token: string })` y `ResendVerificationForm()`, `features/account/VerifyEmailForm.tsx`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `startSession` | `features/account/actions.ts` | escribe `mp_session` con `sessionCookieOptions()` tras `login` o `register` |
| `pick` | `features/account/actions.ts` | arma `values` sólo con los campos nombrados, así las contraseñas nunca vuelven al formulario |
| Guardia de `/cuenta` | `proxy.ts` | sin la cookie `mp_session` redirige a `loginHref(pathname)`; con cookie sigue y la validez la resuelve `requireCustomer` |
| Sesión vencida | `app/api/sesion/vencida/route.ts` | `GET` borra `mp_session` y responde 303 a `/entrar?volver=<safeReturnPath(volver)>&aviso=sesion` |
| Páginas de acceso | `app/entrar/page.tsx`, `app/registro/page.tsx`, `app/recuperar/page.tsx`, `app/restablecer/[token]/page.tsx`, `app/verificar/[token]/page.tsx` | `metadata` con `noindex, nofollow`; leen `searchParams` o `params` en un hijo dentro de `<Suspense>` |

## 6. Dependencias

- `lib/marketplace/client.ts`: `loginCustomer`, `registerCustomer`, `logoutCustomer`, `requestPasswordReset`, `resetPassword`, `verifyEmail`, `resendVerification` y `getMe`.
- `lib/marketplace/errors.ts`: `MarketplaceAccountError` y `MarketplaceUnavailableError`.
- `lib/marketplace/params.ts` (`AccountContext`) y `lib/marketplace/schemas.ts` (`Customer`), sólo tipos.
- `next/headers` (`cookies`, `headers`), `next/navigation` (`redirect`), `next/server` (`NextResponse`) y `node:net` (`isIP`).
- `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/card.tsx` y `components/ui/skeleton.tsx`.

## 7. Ejemplo de uso

```tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/account/LoginForm";
import { safeReturnPath } from "@/features/account/returnPath";

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
- Despliegue: Next sólo escribe `x-forwarded-for` si falta: en producción un proxy delante debe reescribirlo con la IP real, o el navegador lo controla, `X-Client-IP` miente y el límite de 5 logins por correo e IP se esquiva.

## 9. Pruebas

- Comando: `npx vitest run features/account`
- `features/account/returnPath.test.ts`: ruta interna aceptada y los valores que vuelven a `/cuenta`.
- `features/account/session.test.ts`: IP de `x-forwarded-for`, validez del valor de `mp_session` y opciones de la cookie en producción.
- `features/account/actions.test.ts`: `login` con cookie y redirección, `volver` externo, credenciales inválidas, 429 y API caída; `logout` con la API caída; `resendVerificationAction` con 401 `unauthenticated` y con API caída; `forgotPassword` con cualquier correo.
