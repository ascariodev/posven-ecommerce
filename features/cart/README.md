---
module: "cart"
path: "features/cart"
type: "feature"
exports: ["cartEnabled", "CART_COOKIE", "cartCookieOptions", "parseCartCookie", "serializeCart", "readGuestCart", "writeGuestCart", "getSessionCart", "getCurrentCart", "mergeGuestCart", "addToCart", "setQuantity", "removeLine", "AddToCartState", "INITIAL_ADD_TO_CART_STATE", "AddToCartButton", "CartLink", "CartLinkSkeleton", "CartView", "CartContent", "CartViewSkeleton"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/utils.ts", "features/account/session.ts", "features/search/ProductThumb.tsx", "components/ui/button.tsx", "components/ui/badge.tsx", "components/ui/card.tsx", "components/ui/skeleton.tsx"]
tests: "features/cart/*.test.{ts,tsx}"
verified_against: ["features/cart/flag.ts", "features/cart/cookie.ts", "features/cart/server.ts", "features/cart/actions.ts", "features/cart/addToCartState.ts", "features/cart/AddToCartButton.tsx", "features/cart/CartLink.tsx", "features/cart/CartView.tsx", "features/cart/flag.test.ts", "features/cart/cookie.test.ts", "features/cart/actions.test.ts", "features/cart/AddToCartButton.test.tsx", "features/cart/CartLink.test.tsx", "features/cart/CartView.test.tsx", "features/account/actions.ts", "features/product/OfferCard.tsx", "features/store/StoreProducts.tsx", "app/carrito/page.tsx", "app/layout.tsx", "app/robots.ts", "e2e/cart.spec.ts", "lib/marketplace/client.ts", "lib/marketplace/schemas.ts"]
capabilities:
  - intent: "agregar un producto de una tienda al carrito"
    intent_aliases: ["agregar al carrito", "comprar", "anadir al carrito", "boton agregar"]
    entrypoint: "<AddToCartButton />"
    file: "features/cart/AddToCartButton.tsx"
    input: "storeSlug, storeName, productSlug, productName; se pinta sólo con cartEnabled(), store.accepts_orders y restriction none"
    output: "formulario con la Server Action addToCart (suma 1 y se queda); 'Agregado' con 'Ver carrito' o el mensaje de error en un role=status"
    source: "mp_cart del invitado o PUT /me/cart/items del comprador vía BFF"
    rules: ["RN-CART-01", "RN-CART-03", "RN-CART-04"]
  - intent: "leer el carrito de la petición"
    intent_aliases: ["carrito actual", "carrito del comprador", "carrito de invitado"]
    entrypoint: "getCurrentCart()"
    file: "features/cart/server.ts"
    input: "sin argumentos; lee mp_session y mp_cart dentro de un <Suspense>"
    output: "Cart del comprador, la cotización de mp_cart del invitado, o null sin entradas (sin llamar a la API)"
    source: "GET /me/cart o POST /cart/quote de posveapi vía BFF"
    rules: ["RN-CART-01"]
  - intent: "mostrar el contador del carrito en la cabecera"
    intent_aliases: ["contador del carrito", "icono del carrito", "cuantos productos"]
    entrypoint: "<CartLink />"
    file: "features/cart/CartLink.tsx"
    input: "sin props; en app/layout.tsx dentro de <Suspense fallback={<CartLinkSkeleton />}>"
    output: "enlace a /carrito con line_count (comprador) o las entradas de mp_cart (invitado, sin API); 'Carrito' sin número si la API falla; null con el interruptor apagado"
    source: "GET /me/cart o la cookie mp_cart"
    rules: ["RN-CART-04"]
  - intent: "ver y cambiar el carrito"
    intent_aliases: ["pagina del carrito", "mi carrito", "cambiar cantidad", "quitar del carrito"]
    entrypoint: "<CartView />"
    file: "features/cart/CartView.tsx"
    input: "sin props; en app/carrito/page.tsx dentro de <Suspense>"
    output: "tiendas con sus líneas (cantidad, Quitar uno, Agregar uno, Quitar; las no disponibles con su motivo), subtotales, total en USD y Bs y la tasa; vacío con 'Buscar productos'"
    source: "getCurrentCart(); las Server Actions setQuantity y removeLine"
    rules: ["RN-CART-01"]
---

# Módulo `cart`

## 1. Propósito

Carrito del comprador en el ecommerce (plan 4a de cuentas y compras): agregar desde la ficha y la
tienda, el carrito de invitado en la cookie `mp_cart`, su fusión al entrar o registrarse, la página
`/carrito` y el contador de la cabecera. No calcula montos: muestra los de la API. El checkout y las
compras llegan con el plan 4b.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-CART-01` | `mp_cart` es JSON de `[{ store_slug, product_slug, quantity }]`, sin precios, `httpOnly`, `SameSite=Lax`, raíz y 30 días; hasta 20 líneas, cantidades de 1 a 99, slugs de hasta 120 caracteres, sin claves de más ni repetidos, y no más de 3800 bytes codificados (medido con todas las líneas en 99). Un valor inválido se ignora y se reescribe en la siguiente escritura. | `features/cart/cookie.test.ts`; `features/cart/actions.test.ts` ("suma sobre la línea existente y topa en 99", "la línea 21 responde carrito lleno sin escribir") |
| `RN-CART-02` | Al entrar o registrarse, `mp_cart` se fusiona con el carrito del comprador (`mergeCart` con el token nuevo) y se borra. Con la API caída o un 429 se conserva para el próximo login; ante otro error de la API se borra. Nunca impide el acceso. | `features/account/actions.test.ts` (describe "fusión del carrito de invitado al entrar") |
| `RN-CART-03` | "Agregar al carrito" sale sólo si el carrito está encendido, la tienda tiene `accepts_orders` y el producto `restriction: "none"`; los `recipe` y `controlled` muestran su nota en la ficha. | `features/product/ProductOffers.test.tsx` y `features/store/StoreProducts.test.tsx` (describe "botón Agregar al carrito"); `e2e/cart.spec.ts` |
| `RN-CART-04` | El carrito existe con `MARKETPLACE_CART_ENABLED=1` o en modo simulado (`MARKETPLACE_MODE` ausente o `mock`); apagado no hay botón, contador ni fusión, y `/carrito` da 404. | `features/cart/flag.test.ts`; `features/cart/CartLink.test.tsx` y `actions.test.ts` ("con el interruptor apagado...") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Límites de la cookie | `cookie.ts` (`MAX_ENCODED_BYTES`) y `cartItemsSchema` en `lib/marketplace/schemas.ts` | la spec cuentas-y-compras §5.2 primero; sus casos en `cookie.test.ts` |
| Una acción nueva del carrito | `actions.ts` (sólo acciones de formulario: todo export es un endpoint público) | lo que reciba contexto o token, en `server.ts`; su prueba en `actions.test.ts` |
| Cuándo sale "Agregar" | `features/product/OfferCard.tsx` y `features/store/StoreProducts.tsx` | sus pruebas y `RN-CART-03` |
| Textos de motivos no disponibles | `UNAVAILABLE_TEXT` en `CartView.tsx` | `CartView.test.tsx` y `e2e/cart.spec.ts` |

## 4. API pública

- `cartEnabled(): boolean`, `features/cart/flag.ts`: interruptor (RN-CART-04); lo prerenderizado lo fija al construir.
- `CART_COOKIE`, `cartCookieOptions()`, `parseCartCookie(value: string | undefined): CartItem[]`, `serializeCart(items: CartItem[]): string | null` (`null` si pasa de 3800 bytes codificados), `readGuestCart(): Promise<CartItem[]>` y `writeGuestCart(items: CartItem[]): Promise<boolean>` (sólo desde una Server Action), `features/cart/cookie.ts` (`server-only`).
- `getSessionCart(): Promise<Cart | null>` (`cache` de React; `null` sin sesión; una sola lectura por petición para `/carrito` y el contador), `getCurrentCart(): Promise<Cart | null>` (`cache` de React) y `mergeGuestCart(ctx: AccountContext): Promise<void>` (sólo desde una Server Action), `features/cart/server.ts` (`server-only`, sin `"use server"`).
- `addToCart(prev: AddToCartState, formData: FormData): Promise<AddToCartState>`, `setQuantity(formData: FormData): Promise<void>` y `removeLine(formData: FormData): Promise<void>`, `features/cart/actions.ts` (`"use server"`): campos `store_slug`, `product_slug` y `quantity`.
- `AddToCartState` e `INITIAL_ADD_TO_CART_STATE`, `features/cart/addToCartState.ts`.
- `AddToCartButton({ storeSlug, storeName, productSlug, productName })`, Client Component; nombre accesible "Agregar al carrito: {producto} de {tienda}".
- `CartLink()` y `CartLinkSkeleton()`, `CartView()`, `CartContent({ cart }: { cart: Cart | null })` y `CartViewSkeleton()`.

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Interruptor | `flag.ts` | misma regla que `usesMock()` de `lib/marketplace/client.ts` más `MARKETPLACE_CART_ENABLED` |
| Cookie | `cookie.ts` | parseo estricto, tope de bytes, escritura y borrado |
| Lectura y fusión | `server.ts` | carrito de la petición (401 sigue como invitado) y fusión al entrar |
| Acciones | `actions.ts` | agregar (+1), fijar cantidad y quitar, repartidas entre comprador (API) e invitado (cookie); 401 borra `mp_session` y sigue como invitado; `refresh()` tras escribir |
| Botón | `AddToCartButton.tsx` | `useActionState`; vuelve a montar el aviso en cada respuesta para que se anuncie |
| Contador | `CartLink.tsx` | L-02: degrada a "Carrito" ante cualquier error de la API |
| Página | `CartView.tsx` | agrupación por tienda tal como llega; formularios por línea; la línea no disponible atenúa sólo la imagen (el texto conserva el contraste AA) |

## 6. Dependencias

- `lib/marketplace/client.ts` (`quoteGuestCart`, `getCart`, `setCartItem`, `mergeCart`), `errors.ts`, `schemas.ts`, `params.ts`.
- `features/account/session.ts` (`accountContext`, `SESSION_COOKIE`, `sessionCookieOptions`); `features/account/actions.ts` llama a `mergeGuestCart`.
- `features/search/ProductThumb.tsx`; `lib/format.ts`; `components/ui/` (`Button`, `buttonVariants`, `Badge`, `Card`, `Skeleton`); `lucide-react`.

## 7. Ejemplo de uso

```tsx
import { Suspense } from "react";
import { CartView, CartViewSkeleton } from "@/features/cart/CartView";

export default function Page() {
  return (
    <Suspense fallback={<CartViewSkeleton />}>
      <CartView />
    </Suspense>
  );
}
```

## 8. Restricciones

- El módulo no calcula montos: los de la API o el simulado se muestran con `lib/format.ts`. Sólo cuenta y suma cantidades (enteros), nunca montos.
- El navegador nunca llama a posveapi: todo pasa por Server Actions y Server Components.
- Nada de un comprador en `'use cache'`.
- `actions.ts` sólo exporta acciones de formulario; lo que recibe un `AccountContext` vive en `server.ts`.
- Lectura y escritura no son atómicas: dos pestañas de invitado que agregan a la vez se pisan (gana la última); con sesión, dos clics simultáneos en "Agregar" suman uno (`getCart` y luego `PUT` actual + 1); "Quitar uno" desde una pestaña vieja sobre una línea ya quitada la vuelve a crear, porque el `PUT` es un upsert. Arreglarlo exige cambiar el contrato.
- La fusión puede sumar dos veces si posveapi la aplica pero la respuesta pasa del tope de 5 s: la cookie se conserva y el siguiente login vuelve a sumar (con techo de stock).
- El invitado no valida contra la API al agregar: una entrada con un slug inexistente cuenta en el contador, ocupa cupo y no sale en `/carrito` (la cotización la omite) hasta el login.
- Sin JavaScript, la ficha, la tienda y `/carrito` no muestran lo que llega por streaming en un `<Suspense>` (ofertas, productos, líneas del carrito y el contador; con PPR lo revela un script), así que el botón y los controles del carrito no se ven aunque sean formularios. `e2e/cart.spec.ts` lo deja en un `test.fixme`.

## 9. Pruebas

- Comando: el de la sección Verificación de `posven-ecommerce/CLAUDE.md` (`npx vitest run features/cart`).
- `features/cart/flag.test.ts`: interruptor con y sin `MARKETPLACE_MODE` y `MARKETPLACE_CART_ENABLED`.
- `features/cart/cookie.test.ts`: opciones de la cookie, ida y vuelta, valores inválidos y el tope de bytes.
- `features/cart/actions.test.ts`: agregar como invitado y con sesión, topes, errores de la API, 401 en `addToCart` y `setQuantity`, `removeLine` y cantidades fuera de rango.
- `features/cart/AddToCartButton.test.tsx`: nombre accesible, estado agregado y error.
- `features/cart/CartView.test.tsx`: vacío, montos formateados que no salen de la aritmética (subtotal y total incluidos), una línea `ok` y una no disponible en la misma tienda (grupo "Cantidad de X" sólo en la `ok`), topes de cantidad y tienda cerrada.
- `features/cart/CartLink.test.tsx`: `line_count`, invitado sin API, degradación y el interruptor.
- `e2e/cart.spec.ts` (en serie): invitado en ficha, tienda y `/carrito`; sin botón en tienda que no vende ni en restringidos; fusión al registrarse y al entrar; `noindex`, `robots.txt` y sitemap; y un `test.fixme` sin JavaScript.
