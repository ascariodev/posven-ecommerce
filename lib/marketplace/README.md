---
module: "marketplace"
path: "lib/marketplace"
type: "integration"
exports: ["searchProducts", "getSuggestions", "listNearbyProducts", "listNearbyStores", "listCategories", "listLocations", "getProduct", "getProductOffers", "getStore", "listSitemap", "sendEvent", "registerCustomer", "loginCustomer", "logoutCustomer", "requestPasswordReset", "resetPassword", "verifyEmail", "resendVerification", "getMe", "updateMe", "changePassword", "updateSettings", "deleteAccount", "listAddresses", "createAddress", "updateAddress", "deleteAddress", "listFavorites", "addFavorite", "removeFavorite", "quoteGuestCart", "getCart", "setCartItem", "mergeCart", "quoteCheckout", "startCheckout", "listPurchases", "getPurchase", "MarketplaceUnavailableError", "MarketplaceAccountError", "RADIUS_OPTIONS", "RadiusKm", "DEFAULT_RADIUS_KM", "NATIONWIDE", "GeoFilter", "OfferSort", "searchQuery", "suggestionsQuery", "nearbyProductsQuery", "storesQuery", "productQuery", "pageQuery", "AccountContext", "FavoriteTarget", "moneySchema", "Money", "rateSchema", "Rate", "availabilitySchema", "restrictionSchema", "Restriction", "categorySchema", "Category", "categoryNodeSchema", "CategoryNode", "cityRefSchema", "CityRef", "locationStateSchema", "LocationState", "storeSummarySchema", "StoreSummary", "productSchema", "Product", "offerSchema", "Offer", "searchItemSchema", "SearchItem", "pageMetaSchema", "PageMeta", "searchResponseSchema", "SearchResponse", "suggestionsResponseSchema", "SuggestionsResponse", "nearbyProductsResponseSchema", "NearbyProductsResponse", "FeaturedProduct", "nearbyStoreSchema", "NearbyStore", "storesResponseSchema", "StoresResponse", "categoriesResponseSchema", "locationsResponseSchema", "scheduleEntrySchema", "ScheduleEntry", "storeSchema", "Store", "storeProductSchema", "StoreProduct", "storeResponseSchema", "StoreResponse", "productOfferSchema", "ProductOffer", "offersSummarySchema", "OffersSummary", "productDetailSchema", "ProductDetail", "productRedirectSchema", "productPageSchema", "ProductPage", "productResponseSchema", "ProductResponse", "sitemapTypeSchema", "SitemapType", "sitemapResponseSchema", "SitemapResponse", "eventTypeSchema", "EventType", "eventInputSchema", "EventInput", "marketplaceEventSchema", "MarketplaceEvent", "accountErrorCodeSchema", "AccountErrorCode", "accountErrorBodySchema", "billingDocumentTypeSchema", "billingTaxpayerTypeSchema", "billingSchema", "Billing", "customerSchema", "Customer", "customerEnvelopeSchema", "authResponseSchema", "AuthResponse", "addressSchema", "Address", "addressEnvelopeSchema", "addressListSchema", "addressInputSchema", "AddressInput", "addressPatchSchema", "AddressPatch", "registerInputSchema", "RegisterInput", "profilePatchSchema", "ProfilePatch", "favoritesResponseSchema", "FavoritesResponse", "cartItemSchema", "CartItem", "cartItemsSchema", "cartItemPutSchema", "CartItemPut", "unavailableReasonSchema", "UnavailableReason", "cartLineSchema", "CartLine", "cartStoreSchema", "CartStore", "cartSchema", "Cart", "CART_MAX_LINES", "CART_MAX_QUANTITY", "CART_SLUG_MAX_LENGTH", "lineProductSchema", "fulfillmentSchema", "Fulfillment", "deliveryUnavailableReasonSchema", "DeliveryUnavailableReason", "quoteStoreSchema", "QuoteStore", "chargeSchema", "Charge", "quoteSchema", "Quote", "checkoutQuoteInputSchema", "CheckoutQuoteInput", "checkoutInputSchema", "CheckoutInput", "checkoutStartSchema", "CheckoutStart", "purchaseStatusSchema", "PurchaseStatus", "storeOrderStatusSchema", "StoreOrderStatus", "orderAddressSchema", "OrderAddress", "storeOrderLineSchema", "StoreOrderLine", "storeOrderSchema", "StoreOrder", "purchaseSchema", "Purchase", "purchasePageSchema", "PurchasePage"]
depends_on: ["package.json", "next.config.ts", "vitest.config.mts", ".env.example", "lib/site.ts"]
tests: "lib/marketplace/**/__tests__/*.test.ts"
verified_against: ["lib/marketplace/schemas.ts", "lib/marketplace/params.ts", "lib/marketplace/errors.ts", "lib/marketplace/http.ts", "lib/marketplace/client.ts", "lib/marketplace/mock/fixtures.ts", "lib/marketplace/mock/adapter.ts", "app/api/suggestions/route.ts", "lib/marketplace/mock/schedule.ts", "lib/marketplace/mock/accounts.ts", "lib/marketplace/mock/cart.ts", "lib/marketplace/mock/checkout.ts", "lib/marketplace/mock/money.ts", "next.config.ts", "vitest.config.mts", ".env.example"]
capabilities:
  - intent: "buscar productos por texto, categoría y ubicación con su precio mínimo y los destacados"
    intent_aliases: ["buscar productos", "resultados de busqueda", "search de posveapi", "productos cerca"]
    entrypoint: "searchProducts()"
    file: "lib/marketplace/client.ts"
    input: "{ q: string, category: string|null, geo: GeoFilter, radiusKm: RadiusKm|null, page: number, sort?: OfferSort, openNow?: boolean }"
    output: "SearchResponse { data: SearchItem[], featured: { product: Product, offer: Offer }[] (máx. 2), meta: PageMeta, rate: Rate }"
    source: "GET /search de posveapi vía BFF, o el simulado con MARKETPLACE_MODE=mock; cache 'minutes' con tag marketplace:search"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-03"]
  - intent: "sugerir términos, productos y categorías mientras se escribe en el buscador"
    intent_aliases: ["sugerencias de busqueda", "autocompletar", "suggestions"]
    entrypoint: "getSuggestions()"
    file: "lib/marketplace/client.ts"
    input: "{ q: string, geo: GeoFilter, radiusKm: RadiusKm|null }"
    output: "SuggestionsResponse { terms: string[] (máx. 5), products: SearchItem[] (máx. 4), categories: { slug, name }[] (máx. 2), rate: Rate }"
    source: "GET /suggestions de posveapi vía BFF, o el simulado; cache 'minutes' con tag marketplace:suggestions; el navegador la alcanza por app/api/suggestions/route.ts"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-03"]
  - intent: "listar los productos con oferta dentro del radio o la ciudad, del más cercano al más lejano"
    intent_aliases: ["productos cercanos", "productos cerca de mi", "products nearby"]
    entrypoint: "listNearbyProducts()"
    file: "lib/marketplace/client.ts"
    input: "{ geo: GeoFilter, radiusKm: RadiusKm|null, page: number }"
    output: "NearbyProductsResponse { data: SearchItem[], meta: PageMeta, rate: Rate }"
    source: "GET /products/nearby de posveapi vía BFF, o el simulado; sin ubicación ordena por precio; cache 'minutes' con tag marketplace:nearby-products"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-03"]
  - intent: "listar las tiendas cercanas o de una ciudad con su distancia y las premium destacadas"
    intent_aliases: ["tiendas cercanas", "comercios", "stores de posveapi"]
    entrypoint: "listNearbyStores()"
    file: "lib/marketplace/client.ts"
    input: "{ geo: GeoFilter, radiusKm: RadiusKm|null, page: number }"
    output: "StoresResponse { data: NearbyStore[] (con cover_url: string|null opcional, sólo de tiendas premium con portada), featured: NearbyStore[] (máx. 2), meta: PageMeta }"
    source: "GET /stores de posveapi vía BFF, o el simulado con MARKETPLACE_MODE=mock; cache 'minutes' con tag marketplace:stores"
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
    source: "GET /products/{slug}?sort=price de posveapi vía BFF, o el simulado; delega en getProductOffers sin ubicación: cache 'minutes' con tag marketplace:product:{slug}"
    rules: ["RN-MARKETPLACE-01", "RN-MARKETPLACE-02", "RN-MARKETPLACE-04"]
  - intent: "listar las ofertas de un producto según la ubicación, por precio o por distancia"
    intent_aliases: ["ofertas de un producto", "donde comprar", "tiendas que lo venden", "comparar precios"]
    entrypoint: "getProductOffers()"
    file: "lib/marketplace/client.ts"
    input: "{ slug: string, geo: GeoFilter, radiusKm: RadiusKm|null, sort: OfferSort }"
    output: "ProductResponse | null; cada ProductOffer es Offer + outside_radius: boolean + is_best_price: boolean opcional (lo calcula la API sobre las ofertas servidas; /search no lo trae)"
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
    input: "MarketplaceEvent { type: EventType, store_slug: string|null, product_slug: string|null, query?: string|null, category_slug?: string|null, results_count?: number|null, session_id: uuid }; clientIp: string|null"
    output: "void"
    source: "POST /events de posveapi vía BFF con X-Client-IP si hay IP, sin caché; el simulado no hace nada"
    rules: ["RN-MARKETPLACE-02"]
  - intent: "registrar a un comprador, iniciar y cerrar su sesión, verificar su correo y recuperar su contraseña"
    intent_aliases: ["login", "registro", "crear cuenta", "cerrar sesion", "olvide mi contrasena", "verificar correo", "restablecer contrasena"]
    entrypoint: "loginCustomer()"
    file: "lib/marketplace/client.ts"
    input: "ctx: AccountContext { session: string|null, clientIp: string|null } en todas; registerCustomer: RegisterInput { name, email, phone, password, billing: { document_type, document, address, taxpayer_type } }; loginCustomer: { email, password }; requestPasswordReset: email; resetPassword: { token, password }; verifyEmail: token; logoutCustomer y resendVerification: sólo ctx"
    output: "registerCustomer y loginCustomer: AuthResponse { token: string, customer: Customer }; las demás, void; un error de cuenta llega como MarketplaceAccountError { status, code: AccountErrorCode, message, fields: Record<string,string>|null, retryAfter: number|null }"
    source: "POST /customers, /auth/login, /auth/logout, /auth/password/forgot, /auth/password/reset, /auth/email/verify y /auth/email/resend de posveapi vía BFF, o el simulado (mock/accounts.ts); sin caché"
    rules: ["RN-MARKETPLACE-02", "RN-MARKETPLACE-05", "RN-MARKETPLACE-06", "RN-MARKETPLACE-07"]
  - intent: "leer y cambiar el perfil, la contraseña y la configuración del comprador, o eliminar su cuenta"
    intent_aliases: ["mi cuenta", "perfil", "cambiar correo", "cambiar contrasena", "configuracion", "correos de pedidos", "eliminar cuenta"]
    entrypoint: "getMe()"
    file: "lib/marketplace/client.ts"
    input: "ctx: AccountContext; updateMe: ProfilePatch { name?, phone?, email?, current_password?, billing?: Billing|null }; changePassword: { current_password, password }; updateSettings: { order_status_emails: boolean }; deleteAccount: { password }"
    output: "getMe, updateMe y updateSettings: Customer { name, email, phone, email_verified: boolean, pending_email: string|null, settings: { order_status_emails: boolean }, billing: Billing|null }; changePassword y deleteAccount: void"
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
  - intent: "cotizar el carrito de invitado y leer, cambiar o fusionar el carrito del comprador"
    intent_aliases: ["carrito", "cesta", "agregar al carrito", "cotizar carrito", "fusionar carrito"]
    entrypoint: "getCart()"
    file: "lib/marketplace/client.ts"
    input: "ctx: AccountContext en todas; quoteGuestCart y mergeCart: CartItem[] { store_slug, product_slug, quantity 1 a 99 } (hasta 20, sin repetidos); setCartItem: CartItemPut (quantity 0 a 99; 0 borra)"
    output: "Cart { stores: CartStore[] { store, is_open, closes_at?, accepts_orders, offers_delivery, lines: CartLine[], subtotal_usd, subtotal_ves, fulfillment?, delivery_fee_usd?, delivery_fee_ves?, total_usd?, total_ves? }, total_usd, total_ves, line_count, rate }; los subtotales suman sólo las líneas ok; por tienda, fulfillment es pickup y total_* el subtotal, y delivery_fee_* la tarifa o nulo si no ofrece entrega (los campos nuevos son opcionales para el consumidor); un error llega como MarketplaceAccountError (not_orderable, product_restricted, cart_full, validation_failed, unauthenticated)"
    source: "POST /cart/quote, GET /me/cart, PUT /me/cart/items y POST /me/cart/merge de posveapi vía BFF, o el simulado (mock/cart.ts); sin caché"
    rules: ["RN-MARKETPLACE-02", "RN-MARKETPLACE-05", "RN-MARKETPLACE-07", "RN-MARKETPLACE-08"]
  - intent: "cotizar el checkout, iniciar el pago y leer las compras del comprador"
    intent_aliases: ["checkout", "pagar", "cotizacion", "quote", "compras", "pedidos", "historial de compras"]
    entrypoint: "quoteCheckout()"
    file: "lib/marketplace/client.ts"
    input: "ctx: AccountContext en todas; quoteCheckout: CheckoutQuoteInput { stores: [{ store_slug, fulfillment }], address_id }; startCheckout: CheckoutInput (más quote_hash, idempotency_key UUID v4 y bill_to_me?: boolean); listPurchases: page; getPurchase: code"
    output: "Quote { quote_hash, stores: QuoteStore[], total_usd, total_ves, charge, rate }; CheckoutStart { purchase_code, payment { provider, redirect_url, instructions } }; PurchasePage { data: Purchase[], meta }; Purchase { code, status, orders: StoreOrder[] con pickup_code, líneas missing y refunded }; un error llega como MarketplaceAccountError (email_unverified 403, quote_changed 409 con quote, cart_empty, validation_failed en address_id, not_found)"
    source: "POST /checkout/quote, POST /checkout, GET /me/purchases?page y GET /me/purchases/{code} de posveapi vía BFF, o el simulado (mock/checkout.ts); sin caché"
    rules: ["RN-MARKETPLACE-02", "RN-MARKETPLACE-05", "RN-MARKETPLACE-07", "RN-MARKETPLACE-09"]
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
| `RN-MARKETPLACE-01` | Una respuesta de la API que no pasa su esquema zod se registra con su endpoint y se trata como API caída. | `lib/marketplace/__tests__/http.test.ts` ("un cuerpo que no pasa el esquema...") |
| `RN-MARKETPLACE-02` | Toda llamada a la API lleva `Authorization: Bearer <MARKETPLACE_API_KEY>` y se corta a los 5 s. | `lib/marketplace/__tests__/http.test.ts` ("envía Bearer...", "el tiempo agotado...") |
| `RN-MARKETPLACE-03` | Sin ubicación no se envían `lat`, `lng`, `city` ni `radius_km`: la consulta cubre todo el país. | `lib/marketplace/__tests__/params.test.ts` ("sin geo no envía ubicación...") |
| `RN-MARKETPLACE-04` | Un 404 de la API en un producto o una tienda llega como `null`; cualquier otro código no 2xx es API caída. | `lib/marketplace/__tests__/http.test.ts` ("un 404 devuelve null...", "un estado 500 lanza MarketplaceUnavailableError (RN-MARKETPLACE-04)") |
| `RN-MARKETPLACE-05` | Un 401, 403, 404, 409, 422 o 429 con cuerpo `{ error: { code, message } }` llega como `MarketplaceAccountError` (con `quote` si el cuerpo la trae, sólo en `quote_changed`); un 401 sin esa forma o cualquier otro estado no 2xx es API caída. | `lib/marketplace/__tests__/http.test.ts` ("un 422 con fields...", "un 401 unauthenticated...", "un 401 sin el cuerpo de error...", "un 409 quote_changed...", "un 403 email_unverified...", "un estado %i lanza...") |
| `RN-MARKETPLACE-06` | Un 429 da los segundos de `retry_after`; sin cuerpo de error, los del encabezado `Retry-After`; sin encabezado, 60. | `lib/marketplace/__tests__/http.test.ts` ("un 429 con retry_after...", "un 429 sin cuerpo de error toma Retry-After...", "un 429 sin cuerpo de error ni Retry-After da 60...") |
| `RN-MARKETPLACE-07` | Las llamadas de cuenta mandan `X-Marketplace-Customer` sólo con sesión y `X-Client-IP` sólo con IP; `sendEvent` manda `X-Client-IP` sólo con IP; las de catálogo no mandan ninguno de los dos. | `lib/marketplace/__tests__/http.test.ts` ("con sesión e IP manda...", "sin sesión ni IP no manda...", "con IP manda POST...", "sin IP no manda X-Client-IP", "envía Bearer...") |
| `RN-MARKETPLACE-08` | `accepts_orders` de `StoreSummary` se lee opcional mientras posveapi no lo envíe: ausente es `false` (plan 4a de cuentas, decisión 3). | `lib/marketplace/__tests__/schemas.test.ts` ("sin accepts_orders (posveapi aún no lo envía) lo lee como false") |
| `RN-MARKETPLACE-09` | El pago simulado avanza con cada consulta del detalle de la compra, en la secuencia de abajo, desde `pending_payment` hasta retiro y entrega en curso. El listado no avanza. | `lib/marketplace/mock/__tests__/checkout.test.ts` (describe "avance de la compra simulada por consultas"); `e2e/checkout.spec.ts` |

Secuencia del pago simulado (`RN-MARKETPLACE-09`): la primera consulta da `pending_payment` con sus
pedidos `pending_payment`; la segunda, `paid` con los pedidos `accepted` (o `failed` con los
pedidos `cancelled` para `pago-fallido@posven.test`), con `alcohol-isopropilico-250-ml` de
`farmacia-central-valencia` faltante y reembolsado y las líneas compradas fuera del carrito; desde
la tercera, retiro `ready_for_pickup` con `pickup_code` y entrega `out_for_delivery`.

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Campo nuevo del contrato | la spec §3 primero, después `schemas.ts` | agregarlo a los objetos de `mock/fixtures.ts` y a lo que arma `mock/adapter.ts`, para que `__tests__/schemas.test.ts` siga pasando |
| Endpoint nuevo | función pública en `client.ts` que llama a `requestJson`, a `requestJsonOrNull` (si el 404 es "no existe") o a `postJson` | su esquema en `schemas.ts`, la misma firma en `mock/adapter.ts` y su caso en `__tests__/schemas.test.ts` |
| Endpoint de cuenta nuevo | la spec de cuentas §4 primero; función pública en `client.ts`, sin `'use cache'`, que recibe `ctx: AccountContext` y llama a `accountRequest` (con cuerpo) o a `accountCommand` (204 o 202) | su esquema en `schemas.ts`, la función con la misma firma en `mock/accounts.ts` reexportada en `mock/adapter.ts`, su caso en `__tests__/schemas.test.ts` y el de su comportamiento en `mock/__tests__/accounts.test.ts` |
| Parámetro de consulta nuevo | `searchQuery`, `suggestionsQuery`, `storesQuery`, `nearbyProductsQuery`, `productQuery` o `pageQuery` en `params.ts` | su caso en `__tests__/params.test.ts` y su lectura en `mock/adapter.ts` (`readScope` si es de ubicación; si no, la función que la usa) |
| Orden o destacados de las ofertas simuladas | `productPage` en `mock/adapter.ts` | su caso en `mock/__tests__/adapter.test.ts`; `Number()` sólo para comparar montos, nunca para sumar ni redondear |
| Tipo de evento nuevo | la spec §3.4 primero, después `eventTypeSchema` y `hasFieldsForType` en `schemas.ts` | su caso en `__tests__/schemas.test.ts` si cambia qué campos exige |
| Radios elegibles | `RADIUS_OPTIONS` y `DEFAULT_RADIUS_KM` en `params.ts` | cambiar antes la spec §5.1 |
| Datos simulados | `mock/fixtures.ts` | montos, `nearest_km` y `distance_km` como literales, nunca calculados |
| Carrito simulado | `mock/cart.ts` (reglas de la enmienda C, D, E, G, J y K de cuentas-y-compras) | los montos del carrito sólo por `mock/money.ts`; su caso en `mock/__tests__/cart.test.ts` y en `__tests__/schemas.test.ts` |
| Checkout o compras simuladas | `mock/checkout.ts` (enmienda F, G y H; `RN-MARKETPLACE-09`); el reparto por tienda en `MockStore` de `mock/fixtures.ts` | los montos sólo por `mock/money.ts`; su caso en `mock/__tests__/checkout.test.ts` y en `__tests__/schemas.test.ts` |

## 4. API pública

Cliente de servidor, `lib/marketplace/client.ts` (`import "server-only"`):

- `searchProducts(p: { q: string; category: string | null; geo: GeoFilter; radiusKm: RadiusKm | null; page: number; sort?: OfferSort; openNow?: boolean }): Promise<SearchResponse>`: `'use cache'`, `cacheLife("minutes")`, `cacheTag("marketplace:search")`.
- `getSuggestions(p: { q: string; geo: GeoFilter; radiusKm: RadiusKm | null }): Promise<SuggestionsResponse>`: `'use cache'`, `cacheLife("minutes")`, `cacheTag("marketplace:suggestions")`. Con `q` de menos de 2 caracteres la API responde 422 y se trata como API caída: quien llama lo evita (`app/api/suggestions/route.ts`).
- `listNearbyProducts(p: { geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): Promise<NearbyProductsResponse>`: `'use cache'`, `cacheLife("minutes")`, `cacheTag("marketplace:nearby-products")`. Sin ubicación la API ordena por precio mínimo; nunca trae `featured`.
- `listNearbyStores(p: { geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): Promise<StoresResponse>`: `'use cache'`, `cacheLife("minutes")`, `cacheTag("marketplace:stores")`.
- `listCategories(): Promise<CategoryNode[]>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:categories")`.
- `listLocations(): Promise<LocationState[]>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:locations")`.
- `getProduct(slug: string): Promise<ProductResponse | null>`: sin caché propia; llama a `getProductOffers({ slug, geo: null, radiusKm: null, sort: "price" })`, así que comparte su entrada; nacional y por precio.
- `getProductOffers(p: { slug: string; geo: GeoFilter; radiusKm: RadiusKm | null; sort: OfferSort }): Promise<ProductResponse | null>`: `'use cache'`, `cacheLife("minutes")`, `cacheTag("marketplace:product:{slug}")`.
- `getStore(p: { slug: string; page: number }): Promise<StoreResponse | null>`: `'use cache'`, `cacheLife("minutes")`, `cacheTag("marketplace:store:{slug}")`.
- `listSitemap(p: { type: SitemapType; page: number }): Promise<SitemapResponse>`: `'use cache'`, `cacheLife("hours")`, `cacheTag("marketplace:sitemap:{type}")`.
- `sendEvent(event: MarketplaceEvent, clientIp: string | null): Promise<void>`: sin caché; la IP va sólo en `X-Client-IP`.

Cuentas del comprador, `lib/marketplace/client.ts`, sin caché; cada una lanza `MarketplaceAccountError` o `MarketplaceUnavailableError`:

- `registerCustomer(ctx: AccountContext, input: RegisterInput): Promise<AuthResponse>`: `POST /customers`; el cuerpo lleva `billing` anidado y la cuenta nace con las seis claves de facturación (nombre y teléfono, los de la cuenta). El simulado valida con las reglas de facturación: errores de documento, dirección, tipo y contribuyente como `billing.<campo>`, y los de nombre y teléfono como `name` y `phone`.
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
- `quoteGuestCart(ctx: AccountContext, items: CartItem[]): Promise<Cart>`: `POST /cart/quote` con `{ items }`.
- `getCart(ctx: AccountContext): Promise<Cart>`: `GET /me/cart`.
- `setCartItem(ctx: AccountContext, item: CartItemPut): Promise<Cart>`: `PUT /me/cart/items` con la entrada sola; `quantity: 0` borra siempre (enmienda J).
- `mergeCart(ctx: AccountContext, items: CartItem[]): Promise<Cart>`: `POST /me/cart/merge` con `{ items }`; suma repetidas con techo de stock y topa en 20 líneas sin error (enmienda K).
- `quoteCheckout(ctx: AccountContext, input: CheckoutQuoteInput): Promise<Quote>`: `POST /checkout/quote`; una entrega no disponible sale como retiro con su motivo, sin error.
- `startCheckout(ctx: AccountContext, input: CheckoutInput): Promise<CheckoutStart>`: `POST /checkout` (201); la misma `idempotency_key` devuelve la misma compra.
- `listPurchases(ctx: AccountContext, page: number): Promise<PurchasePage>`: `GET /me/purchases?page=N` (`pageQuery`), 10 por página, más recientes primero.
- `getPurchase(ctx: AccountContext, code: string): Promise<Purchase>`: `GET /me/purchases/{code}` sin envoltura; un 404 llega como `MarketplaceAccountError` `not_found`.

Errores, `lib/marketplace/errors.ts`:

- `class MarketplaceUnavailableError extends Error { readonly endpoint: string; constructor(endpoint: string, options?: { cause?: unknown }) }`
- `class MarketplaceAccountError extends Error { readonly status: number; readonly code: AccountErrorCode; readonly fields: Record<string, string> | null; readonly retryAfter: number | null; readonly quote: Quote | null; constructor(p: { status: number; code: AccountErrorCode; message: string; fields?: Record<string, string> | null; retryAfter?: number | null; quote?: Quote | null }) }`: `name` es `"MarketplaceAccountError"` y `message`, el de la API.

Consultas, `lib/marketplace/params.ts`:

- `RADIUS_OPTIONS = [3, 10, 25, 50] as const`
- `type RadiusKm = (typeof RADIUS_OPTIONS)[number]`
- `DEFAULT_RADIUS_KM: RadiusKm = 10`
- `NATIONWIDE = "pais"`: valor de `radio` en la URL y en `/api/suggestions` para "todo el país"
- `type GeoFilter = { lat: number; lng: number } | { city: string } | null`
- `searchQuery(p: { q: string; category: string | null; geo: GeoFilter; radiusKm: RadiusKm | null; page: number; sort?: OfferSort; openNow?: boolean }): URLSearchParams`: `sort` se envía sólo si viene y `open_now=true` sólo si `openNow` es verdadero
- `suggestionsQuery(p: { q: string; geo: GeoFilter; radiusKm: RadiusKm | null }): URLSearchParams`: `q` siempre; la ubicación según `RN-MARKETPLACE-03`
- `nearbyProductsQuery(p: { geo: GeoFilter; radiusKm: RadiusKm | null; page: number }): URLSearchParams`: la ubicación según `RN-MARKETPLACE-03` y `page`
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
- `storeSummarySchema` / `StoreSummary`; `productSchema` / `Product`; `offerSchema` / `Offer`; `Offer` y `NearbyStore` traen `is_open` (booleano) y `closes_at` (HH:MM o nulo) opcionales, que calcula la API; `NearbyStore` trae además `cover_url` (URL o nulo, opcional) y `ProductOffer`, `is_best_price` (booleano opcional)
- `searchItemSchema` / `SearchItem`; `pageMetaSchema` / `PageMeta`
- `searchResponseSchema` / `SearchResponse`; `FeaturedProduct` (elemento de `featured`)
- `suggestionsResponseSchema` / `SuggestionsResponse`
- `nearbyProductsResponseSchema` / `NearbyProductsResponse`
- `nearbyStoreSchema` / `NearbyStore`; `storesResponseSchema` / `StoresResponse`
- `categoriesResponseSchema`; `locationsResponseSchema`
- `scheduleEntrySchema` / `ScheduleEntry`; `storeSchema` / `Store`; `storeProductSchema` / `StoreProduct`; `storeResponseSchema` / `StoreResponse`
- `productOfferSchema` / `ProductOffer`; `offersSummarySchema` / `OffersSummary`; `productDetailSchema` / `ProductDetail`
- `productRedirectSchema`; `productPageSchema` / `ProductPage`; `productResponseSchema` / `ProductResponse` (unión de redirección y página)
- `sitemapTypeSchema` / `SitemapType`; `sitemapResponseSchema` / `SitemapResponse`
- `eventTypeSchema` / `EventType`; `eventInputSchema` / `EventInput` (siete tipos; `product_view` exige `product_slug` y `store_slug` nulo; `add_to_cart`, ambos slugs; cada slug hasta 160; `search`, `query` normalizada (recortada, en minúsculas, hasta 100) o `category_slug`, `results_count` y sin slugs; los demás, `store_slug`; `query`, `category_slug` y `results_count` sólo en `search`); `marketplaceEventSchema` / `MarketplaceEvent` (más `session_id` uuid)
- `accountErrorCodeSchema` / `AccountErrorCode` (`unauthenticated`, `not_found`, `validation_failed`, `invalid_credentials`, `token_invalid`, `token_expired`, `too_many_attempts`, `not_orderable`, `product_restricted`, `cart_full`, `email_unverified`, `quote_changed`, `cart_empty`, `open_orders`, `billing_incomplete`); `accountErrorBodySchema` (`{ error: { code, message, fields?, retry_after?, quote? } }`)
- `billingDocumentTypeSchema` (`V`, `E`, `J`, `G`), `billingTaxpayerTypeSchema` (`special`, `ordinary`), `billingSchema` / `Billing` (`document_type`, `document`, `name`, `phone`, `address`, `taxpayer_type`; el módulo no valida largos ni patrones: los aplican la API y el simulado)
- `customerSchema` / `Customer` (con `billing: Billing|null`); `customerEnvelopeSchema` (`{ data: Customer }`); `authResponseSchema` / `AuthResponse` (`token` con `^\d{1,18}\|.+$`)
- `addressSchema` / `Address`; `addressEnvelopeSchema` (`{ data: Address }`); `addressListSchema` (`{ data: Address[] }`)
- `addressInputSchema` / `AddressInput`; `addressPatchSchema` / `AddressPatch` (`AddressInput` parcial)
- `registerInputSchema` / `RegisterInput` (`billing` con cuatro campos: `document_type`, `document`, `address`, `taxpayer_type`); `profilePatchSchema` / `ProfilePatch`
- `favoritesResponseSchema` / `FavoritesResponse`
- `storeSummarySchema.accepts_orders` (`default(false)`, RN-MARKETPLACE-08)
- `cartItemSchema` / `CartItem` (`strictObject`, slugs de 1 a 120, cantidad 1 a 99); `cartItemsSchema` (hasta 20, sin repetidos); `cartItemPutSchema` / `CartItemPut` (cantidad 0 a 99)
- `unavailableReasonSchema` / `UnavailableReason` (`out_of_stock`, `store_not_selling`, `offer_gone`, `restricted`)
- `cartLineSchema` / `CartLine` (su `product` es `lineProductSchema`); `cartStoreSchema` / `CartStore` (`fulfillment`, `delivery_fee_usd`, `delivery_fee_ves`, `total_usd` y `total_ves`, opcionales, que calcula la API: tarifa de entrega de la tienda o nula y total con ella si se eligió entrega; el simulado devuelve retiro, la tarifa de la tienda y total igual al subtotal; `closes_at`, HH:MM o nulo, opcional, que calcula la API; el simulado lo saca de `openStatus` con `mockNow()`, mientras su `is_open` sigue fijo); `cartSchema` / `Cart`
- `CART_MAX_LINES` (20), `CART_MAX_QUANTITY` (99) y `CART_SLUG_MAX_LENGTH` (120): límites del contrato que usan la cookie, las acciones y el simulado
- `fulfillmentSchema` / `Fulfillment` (`pickup`, `delivery`); `deliveryUnavailableReasonSchema` / `DeliveryUnavailableReason` (`no_delivery`, `out_of_radius`, `no_address`)
- `quoteStoreSchema` / `QuoteStore`; `chargeSchema` / `Charge` (`VES` o `USD`); `quoteSchema` / `Quote`
- `checkoutQuoteInputSchema` / `CheckoutQuoteInput` (`strictObject`, 1 a 20 tiendas sin repetir, `address_id` o nulo); `checkoutInputSchema` / `CheckoutInput` (más `quote_hash`, `idempotency_key` UUID v4 y `bill_to_me` opcional)
- `checkoutStartSchema` / `CheckoutStart` (exactamente uno de `redirect_url`, http o https, e `instructions`)
- `purchaseStatusSchema` / `PurchaseStatus`; `storeOrderStatusSchema` / `StoreOrderStatus` (con `pending_payment`, enmienda L); `orderAddressSchema` / `OrderAddress` (sin `id` ni coordenadas)
- `storeOrderLineSchema` / `StoreOrderLine`; `storeOrderSchema` / `StoreOrder` (fechas ISO con zona o nulas); `purchaseSchema` / `Purchase`; `purchasePageSchema` / `PurchasePage`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `requestJson` | `lib/marketplace/http.ts` | `GET` con Bearer y tope de 5 s, validación con el esquema y `MarketplaceUnavailableError` ante cualquier fallo |
| `requestJsonOrNull` | `lib/marketplace/http.ts` | como `requestJson`, pero un 404 cancela el cuerpo y devuelve `null` |
| `postJson` | `lib/marketplace/http.ts` | `POST` JSON con Bearer, `X-Client-IP` si recibe IP y tope de 5 s; cancela el cuerpo y lanza `MarketplaceUnavailableError` si no es 2xx |
| `accountRequest` | `lib/marketplace/http.ts` | llamada de cuenta con Bearer, tope de 5 s y los encabezados de `AccountContext`; valida el cuerpo 2xx con su esquema y pasa todo no 2xx por `readAccountError` |
| `accountCommand` | `lib/marketplace/http.ts` | como `accountRequest`, pero descarta el cuerpo del 2xx |
| `readAccountError` | `lib/marketplace/http.ts` | elige entre `MarketplaceAccountError` y `MarketplaceUnavailableError` según el estado y el cuerpo, y resuelve `retryAfter` |
| Adaptador simulado | `lib/marketplace/mock/adapter.ts` | las funciones de `client.ts` con la misma firma; interpreta la consulta de `params.ts` como la API y reexporta las de cuenta de `mock/accounts.ts` |
| Simulado de cuentas | `lib/marketplace/mock/accounts.ts` | compradores, tokens, direcciones y favoritos en `globalThis[Symbol.for("posven.mockAccounts")]`, sembrados desde `MOCK_ACCOUNT_SEED`; imita la validación, los errores y el orden de posveapi; `resetMockAccounts` sólo para pruebas |
| Horario simulado | `lib/marketplace/mock/schedule.ts` | `openStatus(schedule, at)`: `is_open` y `closes_at` (HH:MM) de un horario `ScheduleEntry[]` en la hora de Caracas, con tramos que pasan la medianoche; sin horario cuenta como abierta; el adaptador lo aplica a `MOCK_STORE_DETAILS` con `mockNow()`, que lee `MARKETPLACE_MOCK_NOW` (fecha ISO de servidor; vacía o inválida: reloj real) para fijar la hora en el e2e; para `open_now` filtra las ofertas de tiendas cerradas y recalcula `offers_count` y el mínimo |
| Ofertas simuladas | `productPage` en `lib/marketplace/mock/adapter.ts` | redirección, producto sin ofertas, orden por precio o distancia, hasta dos premium destacadas y relleno hasta tres con `outside_radius`; `is_best_price` es verdadero en las ofertas, destacadas o no, de precio mínimo entre las servidas (destacadas y `offers` tras el tope de 50) que no son `outside_radius` (empates: todas), y `cover_url` de `listNearbyStores` sale de `MOCK_STORE_DETAILS` sólo en tiendas premium |
| Simulado del carrito | `lib/marketplace/mock/cart.ts` | carritos por comprador en `globalThis[Symbol.for("posven.mockCarts")]`; cotiza entradas agrupando por tienda en el orden de llegada, omite inexistentes, marca `unavailable` con prioridad restringido > tienda que no vende > oferta desaparecida (`out_of_stock` no se produce: el stock sale de `availability`, `low` 3 y `available` 50), topa la cantidad al stock también al cotizar y suma sólo las `ok`, devuelve cada tienda en retiro con su tarifa de entrega (nula si no ofrece) y total igual al subtotal; `resetMockCarts` sólo para pruebas |
| Simulado del checkout | `lib/marketplace/mock/checkout.ts` | compras en `globalThis[Symbol.for("posven.mockPurchases")]`; cotiza desde el carrito del comprador con reparto por radio (haversine), envío fijo por tienda y `quote_hash` sha256; checkout con `email_unverified`, `billing_incomplete` (con `bill_to_me` y el perfil sin datos), `quote_changed`, `cart_empty` e idempotencia; avance por consultas (`RN-MARKETPLACE-09`); `hasOpenOrders` para eliminar la cuenta; `resetMockPurchases` sólo para pruebas |
| Montos del simulado | `lib/marketplace/mock/money.ts` | `toCents`, `fromCents`, `multiply` y `sum` en céntimos enteros; único lugar del repo que multiplica o suma montos |
| Datos simulados | `lib/marketplace/mock/fixtures.ts` | tasa, ubicaciones, categorías con raíces de la taxonomía de posveapi (`salud-y-medicamentos`, `alimentos`, `bebidas`, `ferreteria`), seis tiendas con `distance_km` fijo, reparto (`delivery_radius_km` y envío) y sus detalles (`MOCK_STORE_DETAILS`), productos con sus ofertas, `MOCK_REDIRECTS`, `MOCK_UNAVAILABLE_PRODUCTS`, los compradores sembrados (`MOCK_ACCOUNT_SEED`: `comprador@posven.test` y, para el e2e de checkout, `entrega@posven.test` y `pago-fallido@posven.test`), la línea faltante (`MOCK_MISSING_LINE`) y los tokens y el correo especiales del simulado de cuentas |
| Selección de modo | `usesMock` en `lib/marketplace/client.ts` | `MARKETPLACE_MODE` ausente o `mock`: simulado; `api`: las funciones de `http.ts` (`requestJson`, `requestJsonOrNull`, `postJson`, `accountRequest`, `accountCommand`); otro valor: `Error` |

## 6. Dependencias

- `package.json`: `zod` para los esquemas.
- `next/cache` (`cacheLife`, `cacheTag`) y `cacheComponents: true` en `next.config.ts`, que
  `cacheLife` exige (`poweredByHeader: false` en el mismo archivo no afecta a este módulo).
- `server-only`, que resuelve Next; en vitest, el alias de `vitest.config.mts`.
- Variables de `.env.example`: `MARKETPLACE_MODE`, `MARKETPLACE_API_URL` (incluye `/api/marketplace/v1`), `MARKETPLACE_API_KEY`; `MARKETPLACE_MOCK_NOW` (opcional, sólo simulado, no listada en `.env.example`).

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
- `sendEvent` no se cachea; `searchProducts`, `listNearbyStores`, `listCategories`, `listLocations`, `getProductOffers`, `getStore` y `listSitemap` sí (`getProduct` usa la de `getProductOffers`), y `cacheLife` exige `cacheComponents: true`.
- Las funciones de cuenta no se cachean: dependen de la sesión del comprador.
- `X-Marketplace-Customer` sólo sale de `AccountContext`, y `X-Client-IP` de `AccountContext` o del `clientIp` de `sendEvent`; `Content-Type: application/json` sólo va con cuerpo.
- `searchProducts`, `listNearbyStores`, `getProductOffers` y `getStore` usan `cacheLife("minutes")` porque traen precios por tienda; `listCategories`, `listLocations` y `listSitemap`, `"hours"`.
- Los slugs van en la ruta con `encodeURIComponent`.
- `offers_summary` cubre todo el país, sin depender de la ubicación.
- Dos excepciones a "sin cálculo", porque simulan lo que calcula la API: `mock/adapter.ts` compara montos con `Number()` para ordenar y elegir mínimo y máximo, y `mock/money.ts` multiplica y suma los montos del carrito y del checkout en céntimos enteros. `mock/checkout.ts` calcula además la distancia haversine para decidir la entrega.
- Las funciones del carrito, del checkout y de compras no se cachean: dependen del comprador o de su cookie.
- Huecos del contrato del plan 4b, decididos en la enmienda L (plan 3a de posveapi): los pedidos de una compra sin pagar están en `pending_payment` y pasan a `cancelled` si el pago falla o la compra vence; `code` tiene 8 caracteres y `pickup_code` 6, del alfabeto sin `0`, `O`, `1`, `I` ni `L`; el detalle llega sin envoltura; `open_orders` dice "Tienes pedidos en curso. Podrás eliminar tu cuenta cuando se entreguen."; `quote_hash` es opaco. Sólo el simulado: el listado no avanza el estado y los códigos salen de un sha256 de la secuencia.
- El simulado pagina de a 20 productos (búsqueda y tienda), 12 tiendas y 50000 entradas de sitemap, y sólo devuelve `featured` de la búsqueda y de las tiendas en la página 1.

## 9. Pruebas

- Comando: `npx vitest run lib/marketplace`
- `lib/marketplace/__tests__/schemas.test.ts`: cada respuesta del simulado pasa su esquema (sugerencias con sus topes, producto con ofertas, sin ofertas y redirección, tienda, sitemap, login, registro, perfil, direcciones, favoritos, carrito, Quote, inicio del pago, compra en cada estado y página de compras); una Quote, compras (también una sin pagar con pedidos `pending_payment`) y el inicio del pago escritos a mano, con sus rechazos; productos cercanos con y sin ubicación contra `nearbyProductsResponseSchema`; `accepts_orders` ausente como `false`; `closes_at`, `fulfillment`, `delivery_fee_*` y `total_*` opcionales en `cartStoreSchema`; `is_open` y `closes_at` opcionales en `offerSchema` y su rechazo si están mal formados; `cartItemsSchema` y sus rechazos; el cuerpo de error de cuenta, `moneySchema`, el tope de dos destacados y los campos que exige cada evento (`search`, `add_to_cart` y los campos de `search` fuera de `search`).
- `lib/marketplace/__tests__/params.test.ts`: claves de consulta según ubicación y radio, también en `productQuery`, `suggestionsQuery` y `nearbyProductsQuery`; `sort` y `open_now` de `searchQuery` sólo cuando se piden.
- `lib/marketplace/__tests__/http.test.ts`: Bearer, URL, tope de 5 s, errores de red, estado y esquema, falta de configuración, 404 como `null` y `POST` JSON; en cuenta, encabezados según `AccountContext`, 422, 401 con y sin cuerpo de error, 409 `quote_changed` con su Quote, 403 `email_unverified`, la consulta en la URL, `retryAfter` del cuerpo, del encabezado y 60, 500 y 503 como API caída y 204 en `accountCommand`.
- `lib/marketplace/mock/__tests__/accounts.test.ts`: correo repetido, registro con `billing` (guardado con nombre y teléfono de la cuenta, errores `billing.<campo>`, `name` y `phone`, regla de teléfono del TPV), login errado, verificación, enlace vencido e inválido, restablecer revoca la sesión, límite con `retryAfter` 42, cambio de correo sin contraseña actual, predeterminada de las direcciones y su orden, orden y 404 de favoritos y sesión desconocida.
- `lib/marketplace/mock/__tests__/money.test.ts`: ida y vuelta en céntimos, multiplicar y sumar sin error de coma flotante, céntimos negativos o no enteros.
- `lib/marketplace/mock/__tests__/cart.test.ts`: carrito vacío, `closes_at` por tienda con reloj fijo, retiro con tarifa y total igual al subtotal, totales sólo de `ok`, `offer_gone` con montos nulos, restringido en la cotización, inexistentes omitidos, más de 20 entradas, techo de stock (50 y 3), errores por campo, `product_restricted` (`recipe` y `controlled`), `not_orderable`, fusión que topa en 20 y conserva el orden con `cart_full` en la línea 21, `quantity: 0` que borra líneas no comprables y fusión que suma con techo.
- `lib/marketplace/mock/__tests__/checkout.test.ts`: cotización de retiro y de entrega con envío, fuera de radio, sin reparto y sin dirección, `validation_failed` en `address_id`, `cart_empty`; checkout con 403, 409 con Quote e idempotencia; códigos de 8 y 6 caracteres del alfabeto; avance por consultas con pedidos `pending_payment` antes del pago, la línea faltante reembolsada, entrega en camino, pago fallido con los pedidos cancelados y pedido cancelado; listado paginado con códigos únicos y 404; eliminar la cuenta con y sin pedidos abiertos.
- `lib/marketplace/mock/__tests__/adapter.test.ts`: sugerencias con topes, sin acentos ni repetidos y por ciudad; búsqueda sin mayúsculas ni acentos, `featured` fuera de la página 1, filtro por ciudad, productos cercanos (por cercanía y radio, por precio sin ubicación, página 2 sin repetidos y ciudad), resumen y orden de ofertas, relleno fuera del radio, redirección y slugs desconocidos. `is_open` y `closes_at` de tiendas y ofertas con reloj fijo, `open_now` (con tiendas abiertas y con todas cerradas) y `sort` por precio y por distancia (también sin ubicación).
- `app/api/suggestions/__tests__/route.test.ts`: `q` corto sin llamar a la API, `q` recortada con ubicación de la cookie y radio, `radio=pais`, radio inválido y 503 con la API caída.
- `lib/marketplace/mock/__tests__/schedule.test.ts`: `openStatus` en tramo, antes de abrir, tras cerrar, día sin tramo, hora de Caracas, tramo que pasa la medianoche y sin horario; `mockNow` con `MARKETPLACE_MOCK_NOW` válida, vacía, inválida y ausente.
