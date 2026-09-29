---
module: "marketplace"
path: "lib/marketplace"
type: "integration"
exports: ["searchProducts", "listNearbyStores", "listCategories", "listLocations", "getProduct", "getProductOffers", "getStore", "listSitemap", "sendEvent", "registerCustomer", "loginCustomer", "logoutCustomer", "requestPasswordReset", "resetPassword", "verifyEmail", "resendVerification", "getMe", "updateMe", "changePassword", "updateSettings", "deleteAccount", "listAddresses", "createAddress", "updateAddress", "deleteAddress", "listFavorites", "addFavorite", "removeFavorite", "MarketplaceUnavailableError", "MarketplaceAccountError", "RADIUS_OPTIONS", "RadiusKm", "DEFAULT_RADIUS_KM", "GeoFilter", "OfferSort", "searchQuery", "storesQuery", "productQuery", "pageQuery", "AccountContext", "FavoriteTarget", "moneySchema", "Money", "rateSchema", "Rate", "availabilitySchema", "restrictionSchema", "Restriction", "categorySchema", "Category", "categoryNodeSchema", "CategoryNode", "cityRefSchema", "CityRef", "locationStateSchema", "LocationState", "storeSummarySchema", "StoreSummary", "productSchema", "Product", "offerSchema", "Offer", "searchItemSchema", "SearchItem", "pageMetaSchema", "PageMeta", "searchResponseSchema", "SearchResponse", "FeaturedProduct", "nearbyStoreSchema", "NearbyStore", "storesResponseSchema", "StoresResponse", "categoriesResponseSchema", "locationsResponseSchema", "scheduleEntrySchema", "ScheduleEntry", "storeSchema", "Store", "storeProductSchema", "StoreProduct", "storeResponseSchema", "StoreResponse", "productOfferSchema", "ProductOffer", "offersSummarySchema", "OffersSummary", "productDetailSchema", "ProductDetail", "productRedirectSchema", "productPageSchema", "ProductPage", "productResponseSchema", "ProductResponse", "sitemapTypeSchema", "SitemapType", "sitemapResponseSchema", "SitemapResponse", "eventTypeSchema", "EventType", "eventInputSchema", "EventInput", "marketplaceEventSchema", "MarketplaceEvent", "accountErrorCodeSchema", "AccountErrorCode", "accountErrorBodySchema", "customerSchema", "Customer", "customerEnvelopeSchema", "authResponseSchema", "AuthResponse", "addressSchema", "Address", "addressEnvelopeSchema", "addressListSchema", "addressInputSchema", "AddressInput", "addressPatchSchema", "AddressPatch", "registerInputSchema", "RegisterInput", "profilePatchSchema", "ProfilePatch", "favoritesResponseSchema", "FavoritesResponse"]
depends_on: ["package.json", "next.config.ts", "vitest.config.mts", ".env.example"]
tests: "lib/marketplace/**/*.test.ts"
verified_against: ["lib/marketplace/schemas.ts", "lib/marketplace/params.ts", "lib/marketplace/errors.ts", "lib/marketplace/http.ts", "lib/marketplace/client.ts", "lib/marketplace/mock/fixtures.ts", "lib/marketplace/mock/adapter.ts", "lib/marketplace/mock/accounts.ts", "next.config.ts", "vitest.config.mts", ".env.example"]
capabilities:
  - intent: "buscar productos por texto, categoría y ubicación con su precio mínimo y los destacados"
    intent_aliases: ["buscar productos", "resultados de busqueda", "search de posveapi", "productos cerca"]
    entrypoint: "searchProducts()"
    file: "lib/marketplace/client.ts"
    input: "{ q: string, category: string|null, geo: GeoFilter, radiusKm: RadiusKm|null, page: number }"
    output: "SearchResponse { data: SearchItem[], featured: { product: Product, offer: Offer }[] (máx. 2), meta: PageMeta, rate: Rate }"
    source: "GET /search de posveapi vía BFF, o el simulado con MARKETPLACE_MODE=mock"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-03"]
  - intent: "listar las tiendas cercanas o de una ciudad con su distancia y las premium destacadas"
    intent_aliases: ["tiendas cercanas", "comercios", "stores de posveapi"]
    entrypoint: "listNearbyStores()"
    file: "lib/marketplace/client.ts"
    input: "{ geo: GeoFilter, radiusKm: RadiusKm|null, page: number }"
    output: "StoresResponse { data: NearbyStore[], featured: NearbyStore[] (máx. 2), meta: PageMeta }"
    source: "GET /stores de posveapi vía BFF, o el simulado con MARKETPLACE_MODE=mock"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-03"]
  - intent: "obtener el árbol de categorías globales"
    intent_aliases: ["categorias", "taxonomia", "arbol de categorias"]
    entrypoint: "listCategories()"
    file: "lib/marketplace/client.ts"
    input: "sin parámetros"
    output: "CategoryNode[] { slug, name, parent_slug: string|null, children: CategoryNode[] }"
    source: "GET /categories de posveapi vía BFF, o el simulado; cache 'hours' con tag marketplace:categories"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02"]
  - intent: "obtener estados, municipios y ciudades con tiendas"
    intent_aliases: ["ubicaciones", "ciudades", "selector de ciudad", "locations"]
    entrypoint: "listLocations()"
    file: "lib/marketplace/client.ts"
    input: "sin parámetros"
    output: "LocationState[] { slug, name, municipalities: { slug, name, cities: CityRef[] }[] }"
    source: "GET /locations de posveapi vía BFF, o el simulado; cache 'hours' con tag marketplace:locations"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02"]
  - intent: "obtener la ficha de un producto con el resumen nacional de sus ofertas, o su slug nuevo"
    intent_aliases: ["ficha de producto", "pagina de producto", "detalle de producto", "redirect de slug"]
    entrypoint: "getProduct()"
    file: "lib/marketplace/client.ts"
    input: "slug: string"
    output: "ProductResponse | null: { redirect_to: string } o ProductPage { data: ProductDetail (Product + offers_summary { offer_count, low_price_usd: Money|null, high_price_usd: Money|null }), featured: ProductOffer[] (máx. 2), offers: ProductOffer[] (máx. 50), rate: Rate }; null si la API responde 404"
    source: "GET /products/{slug}?sort=price de posveapi vía BFF, o el simulado; cache 'hours' con tag marketplace:product:{slug}"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-04"]
  - intent: "listar las ofertas de un producto según la ubicación, por precio o por distancia"
    intent_aliases: ["ofertas de un producto", "donde comprar", "tiendas que lo venden", "comparar precios"]
    entrypoint: "getProductOffers()"
    file: "lib/marketplace/client.ts"
    input: "{ slug: string, geo: GeoFilter, radiusKm: RadiusKm|null, sort: OfferSort }"
    output: "ProductResponse | null; cada ProductOffer es Offer + outside_radius: boolean"
    source: "GET /products/{slug}?lat&lng&city&radius_km&sort de posveapi vía BFF, o el simulado; cache 'minutes' con tag marketplace:product:{slug}"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-03", "RN-MARKETPLACE-04"]
  - intent: "obtener la ficha de una tienda con sus productos y precios en esa tienda"
    intent_aliases: ["ficha de tienda", "pagina de tienda", "catalogo de una tienda", "horario de tienda"]
    entrypoint: "getStore()"
    file: "lib/marketplace/client.ts"
    input: "{ slug: string, page: number }"
    output: "StoreResponse | null: { data: Store (StoreSummary + company_name, cover_url: string|null, schedule: { days, opens, closes }[]), products: StoreProduct[] (Product + price_usd, price_ves, availability, updated_at), meta: PageMeta, rate: Rate }; null si la API responde 404"
    source: "GET /stores/{slug}?page de posveapi vía BFF, o el simulado; cache 'minutes' con tag marketplace:store:{slug}"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-04"]
  - intent: "listar los slugs de productos o tiendas para el sitemap"
    intent_aliases: ["sitemap", "slugs para indexar", "urls del sitemap"]
    entrypoint: "listSitemap()"
    file: "lib/marketplace/client.ts"
    input: "{ type: SitemapType ('products'|'stores'), page: number }"
    output: "SitemapResponse { data: { slug: string, updated_at: string }[], meta: PageMeta }"
    source: "GET /sitemap/{type}?page de posveapi vía BFF, o el simulado; cache 'hours' con tag marketplace:sitemap:{type}"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02"]
  - intent: "registrar un evento de visita o de contacto con una tienda"
    intent_aliases: ["eventos", "metricas", "click whatsapp", "vista de producto"]
    entrypoint: "sendEvent()"
    file: "lib/marketplace/client.ts"
    input: "MarketplaceEvent { type: EventType, store_slug: string|null, product_slug: string|null, session_id: uuid }"
    output: "void"
    source: "POST /events de posveapi vía BFF, sin caché; el simulado no hace nada"
    rules: ["RN-MARKETPLACE-02"]
  - intent: "registrar a un comprador, iniciar y cerrar su sesión, verificar su correo y recuperar su contraseña"
    intent_aliases: ["login", "registro", "crear cuenta", "cerrar sesion", "olvide mi contrasena", "verificar correo", "restablecer contrasena"]
    entrypoint: "loginCustomer()"
    file: "lib/marketplace/client.ts"
    input: "ctx: AccountContext { session: string|null, clientIp: string|null } en todas; registerCustomer: RegisterInput { name, email, phone, password }; loginCustomer: { email, password }; requestPasswordReset: email; resetPassword: { token, password }; verifyEmail: token; logoutCustomer y resendVerification: sólo ctx"
    output: "registerCustomer y loginCustomer: AuthResponse { token: string, customer: Customer }; las demás, void; un error de cuenta llega como MarketplaceAccountError { status, code: AccountErrorCode, message, fields: Record<string,string>|null, retryAfter: number|null }"
    source: "POST /customers, /auth/login, /auth/logout, /auth/password/forgot, /auth/password/reset, /auth/email/verify y /auth/email/resend de posveapi vía BFF, o el simulado (mock/accounts.ts); sin caché"
    rules: ["RN-MARKETPLACE-02", "RN-MARKETPLACE-05", "RN-MARKETPLACE-06", "RN-MARKETPLACE-07"]
  - intent: "leer y cambiar el perfil, la contraseña y la configuración del comprador, o eliminar su cuenta"
    intent_aliases: ["mi cuenta", "perfil", "cambiar correo", "cambiar contrasena", "configuracion", "correos de pedidos", "eliminar cuenta"]
    entrypoint: "getMe()"
    file: "lib/marketplace/client.ts"
    input: "ctx: AccountContext; updateMe: ProfilePatch { name?, phone?, email?, current_password? }; changePassword: { current_password, password }; updateSettings: { order_status_emails: boolean }; deleteAccount: { password }"
    output: "getMe, updateMe y updateSettings: Customer { name, email, phone, email_verified: boolean, pending_email: string|null, settings: { order_status_emails: boolean } }; changePassword y deleteAccount: void"
    source: "GET y PATCH /me, PUT /me/password, PATCH /me/settings y DELETE /me de posveapi vía BFF, o el simulado; sin caché"
    rules: ["RN-MARKETPLACE-02", "RN-MARKETPLACE-05", "RN-MARKETPLACE-06", "RN-MARKETPLACE-07"]
  - intent: "listar, crear, editar y borrar las direcciones del comprador"
    intent_aliases: ["direcciones", "direccion de entrega", "direccion predeterminada", "libreta de direcciones"]
    entrypoint: "listAddresses()"
    file: "lib/marketplace/client.ts"
    input: "ctx: AccountContext; createAddress: AddressInput { label, recipient_name, phone, city_slug, line, reference: string|null, lat, lng, is_default? }; updateAddress: id: number y AddressPatch (AddressInput parcial); deleteAddress: id: number"
    output: "listAddresses: Address[] con la predeterminada primero y luego por id; createAddress y updateAddress: Address { id, label, recipient_name, phone, city: CityRef, line, reference: string|null, lat, lng, is_default: boolean }; deleteAddress: void"
    source: "GET y POST /me/addresses, PATCH y DELETE /me/addresses/{id} de posveapi vía BFF, o el simulado; sin caché"
    rules: ["RN-MARKETPLACE-02", "RN-MARKETPLACE-05", "RN-MARKETPLACE-07"]
  - intent: "listar, marcar y desmarcar los productos y las tiendas favoritas del comprador"
    intent_aliases: ["favoritos", "guardar producto", "tiendas favoritas", "me gusta"]
    entrypoint: "listFavorites()"
    file: "lib/marketplace/client.ts"
    input: "ctx: AccountContext; addFavorite y removeFavorite: FavoriteTarget { kind: 'product'|'store', slug: string }"
    output: "listFavorites: FavoritesResponse { products: Product[], stores: StoreSummary[] }, del más reciente al más antiguo; addFavorite y removeFavorite: void"
    source: "GET /me/favorites, PUT y DELETE /me/favorites/products/{slug} y /me/favorites/stores/{slug} de posveapi vía BFF, o el simulado; sin caché"
    rules: ["RN-MARKETPLACE-02", "RN-MARKETPLACE-05", "RN-MARKETPLACE-07"]
---

# Módulo `marketplace`

## 1. Propósito

Contrato con la API de marketplace de posveapi (spec §3; cuentas, §4 de la spec de cuentas): esquemas
zod, tipos inferidos, armado de consultas y el cliente de servidor que el BFF usa contra la API o
contra un adaptador simulado. No renderiza, no lee cookies ni `searchParams` (la sesión llega por
`AccountContext`) y no calcula montos ni distancias.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-MARKETPLACE-01` | Una respuesta de la API que no pasa su esquema zod se registra con su endpoint y se trata como API caída. | `lib/marketplace/http.test.ts` ("un cuerpo que no pasa el esquema...") |
| `RN-MARKETPLACE-02` | Toda llamada a la API lleva `Authorization: Bearer <MARKETPLACE_API_KEY>` y se corta a los 5 s. | `lib/marketplace/http.test.ts` ("envía Bearer...", "el tiempo agotado...") |
| `RN-MARKETPLACE-03` | Sin ubicación no se envían `lat`, `lng`, `city` ni `radius_km`: la consulta cubre todo el país. | `lib/marketplace/params.test.ts` ("sin geo no envía ubicación...") |
| `RN-MARKETPLACE-04` | Un 404 de la API en un producto o una tienda llega como `null`; cualquier otro código no 2xx es API caída. | `lib/marketplace/http.test.ts` ("un 404 devuelve null...", "un estado 500 lanza MarketplaceUnavailableError (RN-MARKETPLACE-04)") |
| `RN-MARKETPLACE-05` | Un 401, 404, 422 o 429 con cuerpo `{ error: { code, message } }` llega como `MarketplaceAccountError`; un 401 sin esa forma o cualquier otro estado no 2xx es API caída. | `lib/marketplace/http.test.ts` ("un 422 con fields...", "un 401 unauthenticated...", "un 401 sin el cuerpo de error...", "un estado %i lanza...") |
| `RN-MARKETPLACE-06` | Un 429 da los segundos de `retry_after`; sin cuerpo de error, los del encabezado `Retry-After`; sin encabezado, 60. | `lib/marketplace/http.test.ts` ("un 429 con retry_after...", "un 429 sin cuerpo de error toma Retry-After...", "un 429 sin cuerpo de error ni Retry-After da 60...") |
| `RN-MARKETPLACE-07` | Las llamadas de cuenta mandan `X-Marketplace-Customer` sólo con sesión y `X-Client-IP` sólo con IP; las de catálogo no mandan ninguno de los dos. | `lib/marketplace/http.test.ts` ("con sesión e IP manda...", "sin sesión ni IP no manda...", "envía Bearer...") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Campo nuevo del contrato | la spec §3 primero, después `schemas.ts` | agregarlo a los objetos de `mock/fixtures.ts` y a lo que arma `mock/adapter.ts`, para que `schemas.test.ts` siga pasando |
| Endpoint nuevo | función pública en `client.ts` que llama a `requestJson`, a `requestJsonOrNull` (si el 404 es "no existe") o a `postJson` | su esquema en `schemas.ts`, la misma firma en `mock/adapter.ts` y su caso en `schemas.test.ts` |
| Endpoint de cuenta nuevo | la spec de cuentas §4 primero; función pública en `client.ts`, sin `'use cache'`, que recibe `ctx: AccountContext` y llama a `accountRequest` (con cuerpo) o a `accountCommand` (204 o 202) | su esquema en `schemas.ts`, la función con la misma firma en `mock/accounts.ts` reexportada en `mock/adapter.ts`, su caso en `schemas.test.ts` y el de su comportamiento en `mock/accounts.test.ts` |
| Parámetro de consulta nuevo | `searchQuery`, `storesQuery`, `productQuery` o `pageQuery` en `params.ts` | su caso en `params.test.ts` y su lectura en `mock/adapter.ts` (`readScope` si es de ubicación; si no, la función que la usa) |
| Orden o destacados de las ofertas simuladas | `productPage` en `mock/adapter.ts` | su caso en `mock/adapter.test.ts`; `Number()` sólo para comparar montos, nunca para sumar ni redondear |
| Tipo de evento nuevo | la spec §3.4 primero, después `eventTypeSchema` y `hasSlugsForType` en `schemas.ts` | su caso en `schemas.test.ts` si cambia qué slug exige |
| Radios elegibles | `RADIUS_OPTIONS` y `DEFAULT_RADIUS_KM` en `params.ts` | cambiar antes la spec §5.1 |
| Datos simulados | `mock/fixtures.ts` | montos, `nearest_km` y `distance_km` como literales, nunca calculados |

## 4. API pública

Cliente de servidor, `lib/marketplace/client.ts` (`import "server-only"`):

- `searchProducts(p: { q: string; category: string | null; geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): Promise<SearchResponse>`
- `listNearbyStores(p: { geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): Promise<StoresResponse>`
- `listCategories(): Promise<CategoryNode[]>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:categories")`.
- `listLocations(): Promise<LocationState[]>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:locations")`.
- `getProduct(slug: string): Promise<ProductResponse | null>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:product:{slug}")`; nacional y por precio.
- `getProductOffers(p: { slug: string; geo: GeoFilter; radiusKm: RadiusKm | null; sort: OfferSort }): Promise<ProductResponse | null>`: `'use cache'`, `cacheLife("minutes")`, `cacheTag("marketplace:product:{slug}")`.
- `getStore(p: { slug: string; page: number }): Promise<StoreResponse | null>`: `'use cache'`, `cacheLife("minutes")`, `cacheTag("marketplace:store:{slug}")`.
- `listSitemap(p: { type: SitemapType; page: number }): Promise<SitemapResponse>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:sitemap:{type}")`.
- `sendEvent(event: MarketplaceEvent): Promise<void>`: sin caché.

Cuentas del comprador, `lib/marketplace/client.ts`, sin caché; cada una lanza `MarketplaceAccountError` o `MarketplaceUnavailableError`:

- `registerCustomer(ctx: AccountContext, input: RegisterInput): Promise<AuthResponse>`: `POST /customers`.
- `loginCustomer(ctx: AccountContext, input: { email: string; password: string }): Promise<AuthResponse>`: `POST /auth/login`.
- `logoutCustomer(ctx: AccountContext): Promise<void>`: `POST /auth/logout`.
- `requestPasswordReset(ctx: AccountContext, email: string): Promise<void>`: `POST /auth/password/forgot` con `{ email }`.
- `resetPassword(ctx: AccountContext, input: { token: string; password: string }): Promise<void>`: `POST /auth/password/reset`.
- `verifyEmail(ctx: AccountContext, token: string): Promise<void>`: `POST /auth/email/verify` con `{ token }`.
- `resendVerification(ctx: AccountContext): Promise<void>`: `POST /auth/email/resend`.
- `getMe(ctx: AccountContext): Promise<Customer>`: `GET /me`.
- `updateMe(ctx: AccountContext, patch: ProfilePatch): Promise<Customer>`: `PATCH /me`.
- `changePassword(ctx: AccountContext, input: { current_password: string; password: string }): Promise<void>`: `PUT /me/password`.
- `updateSettings(ctx: AccountContext, input: { order_status_emails: boolean }): Promise<Customer>`: `PATCH /me/settings`.
- `deleteAccount(ctx: AccountContext, input: { password: string }): Promise<void>`: `DELETE /me`.
- `listAddresses(ctx: AccountContext): Promise<Address[]>`: `GET /me/addresses`.
- `createAddress(ctx: AccountContext, input: AddressInput): Promise<Address>`: `POST /me/addresses`.
- `updateAddress(ctx: AccountContext, id: number, patch: AddressPatch): Promise<Address>`: `PATCH /me/addresses/{id}`.
- `deleteAddress(ctx: AccountContext, id: number): Promise<void>`: `DELETE /me/addresses/{id}`.
- `listFavorites(ctx: AccountContext): Promise<FavoritesResponse>`: `GET /me/favorites`.
- `addFavorite(ctx: AccountContext, target: FavoriteTarget): Promise<void>`: `PUT /me/favorites/products/{slug}` o `/me/favorites/stores/{slug}`.
- `removeFavorite(ctx: AccountContext, target: FavoriteTarget): Promise<void>`: `DELETE` en la misma ruta.

Errores, `lib/marketplace/errors.ts`:

- `class MarketplaceUnavailableError extends Error { readonly endpoint: string; constructor(endpoint: string, options?: { cause?: unknown }) }`
- `class MarketplaceAccountError extends Error { readonly status: number; readonly code: AccountErrorCode; readonly fields: Record<string, string> | null; readonly retryAfter: number | null; constructor(p: { status: number; code: AccountErrorCode; message: string; fields?: Record<string, string> | null; retryAfter?: number | null }) }`: `name` es `"MarketplaceAccountError"` y `message`, el de la API.

Consultas, `lib/marketplace/params.ts`:

- `RADIUS_OPTIONS = [3, 10, 25, 50] as const`
- `type RadiusKm = (typeof RADIUS_OPTIONS)[number]`
- `DEFAULT_RADIUS_KM: RadiusKm = 10`
- `type GeoFilter = { lat: number; lng: number } | { city: string } | null`
- `searchQuery(p: { q: string; category: string | null; geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): URLSearchParams`
- `storesQuery(p: { geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): URLSearchParams`
- `type OfferSort = "price" | "distance"`
- `productQuery(p: { geo: GeoFilter; radiusKm: RadiusKm | null; sort: OfferSort }): URLSearchParams`
- `pageQuery(page: number): URLSearchParams`
- `type AccountContext = { session: string | null; clientIp: string | null }`
- `type FavoriteTarget = { kind: "product" | "store"; slug: string }`

Esquemas y tipos inferidos (`z.infer`), `lib/marketplace/schemas.ts`:

- `moneySchema` / `Money`; `rateSchema` / `Rate`; `availabilitySchema`; `restrictionSchema` / `Restriction`
- `categorySchema` / `Category`; `categoryNodeSchema` / `CategoryNode`
- `cityRefSchema` / `CityRef`; `locationStateSchema` / `LocationState`
- `storeSummarySchema` / `StoreSummary`; `productSchema` / `Product`; `offerSchema` / `Offer`
- `searchItemSchema` / `SearchItem`; `pageMetaSchema` / `PageMeta`
- `searchResponseSchema` / `SearchResponse`; `FeaturedProduct` (elemento de `featured`)
- `nearbyStoreSchema` / `NearbyStore`; `storesResponseSchema` / `StoresResponse`
- `categoriesResponseSchema`; `locationsResponseSchema`
- `scheduleEntrySchema` / `ScheduleEntry`; `storeSchema` / `Store`; `storeProductSchema` / `StoreProduct`; `storeResponseSchema` / `StoreResponse`
- `productOfferSchema` / `ProductOffer`; `offersSummarySchema` / `OffersSummary`; `productDetailSchema` / `ProductDetail`
- `productRedirectSchema`; `productPageSchema` / `ProductPage`; `productResponseSchema` / `ProductResponse` (unión de redirección y página)
- `sitemapTypeSchema` / `SitemapType`; `sitemapResponseSchema` / `SitemapResponse`
- `eventTypeSchema` / `EventType`; `eventInputSchema` / `EventInput` (`product_view` exige `product_slug` y `store_slug` nulo; los demás, `store_slug`); `marketplaceEventSchema` / `MarketplaceEvent` (más `session_id` uuid)
- `accountErrorCodeSchema` / `AccountErrorCode` (`unauthenticated`, `not_found`, `validation_failed`, `invalid_credentials`, `token_invalid`, `token_expired`, `too_many_attempts`); `accountErrorBodySchema` (`{ error: { code, message, fields?, retry_after? } }`)
- `customerSchema` / `Customer`; `customerEnvelopeSchema` (`{ data: Customer }`); `authResponseSchema` / `AuthResponse` (`token` con `^\d{1,18}\|.+$`)
- `addressSchema` / `Address`; `addressEnvelopeSchema` (`{ data: Address }`); `addressListSchema` (`{ data: Address[] }`)
- `addressInputSchema` / `AddressInput`; `addressPatchSchema` / `AddressPatch` (`AddressInput` parcial)
- `registerInputSchema` / `RegisterInput`; `profilePatchSchema` / `ProfilePatch`
- `favoritesResponseSchema` / `FavoritesResponse`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `requestJson` | `lib/marketplace/http.ts` | `GET` con Bearer y tope de 5 s, validación con el esquema y `MarketplaceUnavailableError` ante cualquier fallo |
| `requestJsonOrNull` | `lib/marketplace/http.ts` | como `requestJson`, pero un 404 cancela el cuerpo y devuelve `null` |
| `postJson` | `lib/marketplace/http.ts` | `POST` JSON con Bearer y tope de 5 s; cancela el cuerpo y lanza `MarketplaceUnavailableError` si no es 2xx |
| `accountRequest` | `lib/marketplace/http.ts` | llamada de cuenta con Bearer, tope de 5 s y los encabezados de `AccountContext`; valida el cuerpo 2xx con su esquema y pasa todo no 2xx por `readAccountError` |
| `accountCommand` | `lib/marketplace/http.ts` | como `accountRequest`, pero descarta el cuerpo del 2xx |
| `readAccountError` | `lib/marketplace/http.ts` | elige entre `MarketplaceAccountError` y `MarketplaceUnavailableError` según el estado y el cuerpo, y resuelve `retryAfter` |
| Adaptador simulado | `lib/marketplace/mock/adapter.ts` | las funciones de `client.ts` con la misma firma; interpreta la consulta de `params.ts` como la API y reexporta las de cuenta de `mock/accounts.ts` |
| Simulado de cuentas | `lib/marketplace/mock/accounts.ts` | compradores, tokens, direcciones y favoritos en `globalThis[Symbol.for("posven.mockAccounts")]`, sembrados desde `MOCK_ACCOUNT_SEED`; imita la validación, los errores y el orden de posveapi; `resetMockAccounts` sólo para pruebas |
| Ofertas simuladas | `productPage` en `lib/marketplace/mock/adapter.ts` | redirección, producto sin ofertas, orden por precio o distancia, hasta dos premium destacadas y relleno hasta tres con `outside_radius` |
| Datos simulados | `lib/marketplace/mock/fixtures.ts` | tasa, ubicaciones, categorías con raíces de la taxonomía de posveapi (`salud-y-medicamentos`, `alimentos`, `bebidas`, `ferreteria`), seis tiendas con `distance_km` fijo y sus detalles (`MOCK_STORE_DETAILS`), productos con sus ofertas, `MOCK_REDIRECTS`, `MOCK_UNAVAILABLE_PRODUCTS`, el comprador sembrado (`MOCK_ACCOUNT_SEED`) y los tokens y el correo especiales del simulado de cuentas |
| Selección de modo | `usesMock` en `lib/marketplace/client.ts` | `MARKETPLACE_MODE` ausente o `mock`: simulado; `api`: las funciones de `http.ts` (`requestJson`, `requestJsonOrNull`, `postJson`, `accountRequest`, `accountCommand`); otro valor: `Error` |

## 6. Dependencias

- `package.json`: `zod` para los esquemas.
- `next/cache` (`cacheLife`, `cacheTag`) y `cacheComponents: true` en `next.config.ts`, que
  `cacheLife` exige (`poweredByHeader: false` en el mismo archivo no afecta a este módulo).
- `server-only`, que resuelve Next; en vitest, el alias de `vitest.config.mts`.
- Variables de `.env.example`: `MARKETPLACE_MODE`, `MARKETPLACE_API_URL` (incluye `/api/marketplace/v1`), `MARKETPLACE_API_KEY`.

## 7. Ejemplo de uso

```tsx
import { searchProducts } from "@/lib/marketplace/client";
import { DEFAULT_RADIUS_KM } from "@/lib/marketplace/params";

const result = await searchProducts({
  q: "acetaminofen",
  category: null,
  geo: { city: "valencia" },
  radiusKm: DEFAULT_RADIUS_KM,
  page: 1,
});
```

```tsx
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/marketplace/client";

const product = await getProduct("acetaminofen-500-mg-20-tabletas");
if (product === null) notFound();
const newSlug = "redirect_to" in product ? product.redirect_to : null;
```

## 8. Restricciones

- Los montos son `Money` (cadena `^\d+\.\d{2}$`): el módulo no suma, no convierte ni redondea; el simulado los escribe como literales.
- `client.ts` y `http.ts` abren con `import "server-only"`: `MARKETPLACE_API_KEY` no llega al navegador.
- Fuera de `lib/marketplace/` sólo se importa `client.ts`, `params.ts`, `errors.ts` y `schemas.ts`; nunca `http.ts` ni `mock/`.
- Con ciudad, `radius_km` no se envía; con ciudad y todo el país (`radiusKm` null), tampoco `city`.
- `searchProducts`, `listNearbyStores` y `sendEvent` no se cachean; `listCategories`, `listLocations`, `getProduct`, `getProductOffers`, `getStore` y `listSitemap` sí, y `cacheLife` exige `cacheComponents: true`.
- Las funciones de cuenta no se cachean: dependen de la sesión del comprador.
- `X-Marketplace-Customer` y `X-Client-IP` sólo salen de `AccountContext`; `Content-Type: application/json` sólo va con cuerpo.
- `getProductOffers` y `getStore` usan `cacheLife("minutes")` porque traen precios por tienda; `getProduct` y `listSitemap`, `"hours"`.
- Los slugs van en la ruta con `encodeURIComponent`.
- `offers_summary` cubre todo el país, sin depender de la ubicación.
- La única excepción a "sin cálculo": `mock/adapter.ts` compara montos con `Number()` para ordenar y elegir mínimo y máximo, porque simula lo que calcula la API.
- El simulado pagina de a 20 productos (búsqueda y tienda), 12 tiendas y 50000 entradas de sitemap, y sólo devuelve `featured` de la búsqueda y de las tiendas en la página 1.

## 9. Pruebas

- Comando: `npx vitest run lib/marketplace`
- `lib/marketplace/schemas.test.ts`: cada respuesta del simulado pasa su esquema (producto con ofertas, sin ofertas y redirección, tienda, sitemap, login, registro, perfil, direcciones y favoritos); el cuerpo de error de cuenta, `moneySchema`, el tope de dos destacados y los slugs que exige cada evento.
- `lib/marketplace/params.test.ts`: claves de consulta según ubicación y radio, también en `productQuery`.
- `lib/marketplace/http.test.ts`: Bearer, URL, tope de 5 s, errores de red, estado y esquema, falta de configuración, 404 como `null` y `POST` JSON; en cuenta, encabezados según `AccountContext`, 422, 401 con y sin cuerpo de error, `retryAfter` del cuerpo, del encabezado y 60, 500 y 409 como API caída y 204 en `accountCommand`.
- `lib/marketplace/mock/accounts.test.ts`: correo repetido, login errado, verificación, enlace vencido e inválido, restablecer revoca la sesión, límite con `retryAfter` 42, cambio de correo sin contraseña actual, predeterminada de las direcciones y su orden, orden y 404 de favoritos y sesión desconocida.
- `lib/marketplace/mock/adapter.test.ts`: búsqueda sin mayúsculas ni acentos, `featured` fuera de la página 1, filtro por ciudad, resumen y orden de ofertas, relleno fuera del radio, redirección y slugs desconocidos.
