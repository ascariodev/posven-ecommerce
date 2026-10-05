# Capacidades de posven-ecommerce

Generado por `node posven/.claude/scripts/generate-index.mjs posven-ecommerce`: no se edita a mano.
Se regenera y commitea junto con todo cambio al frontmatter `capabilities` de un README.

## account

README: `features/account/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| leer el comprador de la sesión | `getCurrentCustomer()` | `features/account/server/session.ts` | RN-ACCOUNT-01, RN-ACCOUNT-03, RN-ACCOUNT-04 |
| entrar, crear cuenta y recuperar la contraseña | `login() / register() / logout() / forgotPassword() / resetPasswordAction() / verifyEmailAction() / resendVerificationAction()` | `features/account/server/actions.ts` | RN-ACCOUNT-01, RN-ACCOUNT-02, RN-ACCOUNT-03 |
| mostrar el acceso o el menú de la cuenta en la cabecera | `<AccountSlot />` | `features/account/components/AccountMenu.tsx` | RN-ACCOUNT-05 |
| editar o borrar los datos de facturación del comprador | `<BillingForm billing={customer.billing} /> / updateBilling() / clearBilling()` | `features/account/components/BillingForm.tsx` | RN-ACCOUNT-07 |
| editar el perfil, la contraseña, los avisos, las direcciones del comprador o eliminar su cuenta | `updateProfile() / changePasswordAction() / updateSettingsAction() / deleteAccountAction() / saveAddress() / deleteAddressAction() / setDefaultAddress()` | `features/account/server/accountActions.ts` | RN-ACCOUNT-03, RN-ACCOUNT-06 |
| marcar o quitar un producto o una tienda de favoritos | `<FavoriteButton /> / toggleFavorite()` | `features/account/components/FavoriteButton.tsx` | RN-ACCOUNT-03, RN-ACCOUNT-05 |

## cart

README: `features/cart/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| agregar un producto de una tienda al carrito | `<AddToCartButton />` | `features/cart/components/AddToCartButton.tsx` | RN-CART-01, RN-CART-03, RN-CART-04 |
| leer el carrito de la petición | `getCurrentCart()` | `features/cart/server/cart.ts` | RN-CART-01 |
| mostrar el contador del carrito en la cabecera | `<CartLink />` | `features/cart/components/CartLink.tsx` | RN-CART-04 |
| ver y cambiar el carrito | `<CartView />` | `features/cart/components/CartView.tsx` | RN-CART-01 |

## checkout

README: `features/checkout/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| pagar el carrito: elegir dirección y retiro o entrega por tienda, ver la cotización e iniciar el pago | `<CheckoutView />` | `features/checkout/components/CheckoutView.tsx` | RN-CHECKOUT-01, RN-CHECKOUT-02, RN-CHECKOUT-03, RN-CHECKOUT-05 |
| mostrar el resultado del pago y consultarlo hasta un estado final | `<CheckoutResult />` | `features/checkout/components/CheckoutResult.tsx` | RN-CHECKOUT-04 |

## events

README: `features/events/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| registrar una vista, un clic de contacto, una búsqueda o un agregado al carrito de quien busca | `POST /api/events` | `app/api/events/route.ts` | RN-EVENTS-01, RN-EVENTS-02 |
| mostrar los botones de contacto de una tienda | `<ContactButtons />` | `features/events/components/ContactButtons.tsx` | RN-EVENTS-03 |
| registrar la vista de una página de producto o de tienda | `<ViewBeacon />` | `features/events/components/ViewBeacon.tsx` |  |

## help

README: `features/help/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| buscar una respuesta en el centro de ayuda de compradores | `<HelpCenter />` | `features/help/components/HelpCenter.tsx` | RN-HELP-01, RN-HELP-02, RN-HELP-03, RN-HELP-04 |

## location

README: `features/location/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| leer la ubicación efectiva del usuario para filtrar por cercanía | `getEffectiveLocation()` | `features/location/server/location.ts` | RN-LOCATION-01, RN-LOCATION-02, RN-LOCATION-04 |
| guardar la ubicación del usuario por geolocalización o ciudad elegida | `setLocationFromCoords() / setLocationCity() / clearLocation()` | `features/location/server/actions.ts` | RN-LOCATION-01, RN-LOCATION-03 |
| mostrar y cambiar la ubicación en pantalla | `<LocationBar />` | `features/location/components/LocationBar.tsx` | RN-LOCATION-02, RN-LOCATION-03 |

## merchants

README: `features/merchants/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| explicar a un comercio cómo aparecer en el buscador y darle un contacto | `<MerchantsLanding whatsapp={string \| null} email={string \| null} />` | `features/merchants/components/MerchantsLanding.tsx` | RN-MERCHANTS-01, RN-MERCHANTS-02, RN-MERCHANTS-03 |

## product

README: `features/product/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| cargar un producto por slug con su 404 y su redirección | `loadProduct()` | `features/product/server/load.ts` | RN-PRODUCT-02 |
| armar los metadatos y el JSON-LD de un producto | `productMetadata()` | `features/product/lib/metadata.ts` | RN-PRODUCT-01, RN-PRODUCT-02 |
| mostrar dónde comprar un producto ordenado por precio o cercanía | `<ProductOffers />` | `features/product/components/ProductOffers.tsx` | RN-PRODUCT-03, RN-PRODUCT-04, RN-PRODUCT-05 |

## purchases

README: `features/purchases/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| listar las compras del comprador, paginadas | `<PurchaseList />` | `features/purchases/components/PurchaseList.tsx` | RN-PURCHASES-01 |
| ver el detalle de una compra con el código de retiro y los reembolsos | `<PurchaseDetail />` | `features/purchases/components/PurchaseDetail.tsx` | RN-PURCHASES-02, RN-PURCHASES-03 |
| mostrar la línea de estados de un pedido | `<OrderTracker />` | `features/purchases/components/OrderTracker.tsx` | RN-PURCHASES-05 |
| mostrar las últimas compras en el resumen de la cuenta | `<RecentPurchases />` | `features/purchases/components/RecentPurchases.tsx` | RN-PURCHASES-01, RN-PURCHASES-04 |

## search

README: `features/search/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| buscar productos por texto o categoría cerca del usuario | `<SearchResults />` | `features/search/components/SearchResults.tsx` | RN-SEARCH-01, RN-SEARCH-03, RN-SEARCH-04, RN-SEARCH-06, RN-SEARCH-07 |
| leer y escribir los parámetros de la URL de /buscar | `parseSearchQuery() / searchHref()` | `features/search/lib/query.ts` | RN-SEARCH-02, RN-SEARCH-06, RN-SEARCH-07 |
| mostrar la píldora de búsqueda | `<SearchPill />` | `features/search/components/SearchPill.tsx` | RN-SEARCH-05 |
| mostrar el carril de categorías del inicio | `<CategoryRail />` | `features/search/components/CategoryRail.tsx` |  |
| mostrar el riel de productos cercanos del inicio | `<NearbyProducts />` | `features/search/components/NearbyProducts.tsx` |  |

## site

README: `features/site/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| mostrar la cabecera del sitio con la ubicación visible | `<SiteHeader />` | `features/site/components/SiteHeader.tsx` |  |
| navegar por la barra inferior en móvil | `<MobileNav />` | `features/site/components/MobileNav.tsx` | RN-SITE-07 |
| mostrar el pie del sitio con sus columnas de enlaces | `<SiteFooter />` | `features/site/components/SiteFooter.tsx` | RN-SITE-01, RN-SITE-02 |
| ofrecer contacto de soporte al comprador en la ayuda | `<MerchantContact whatsapp={string \| null} email={string \| null} />` | `features/site/components/MerchantContact.tsx` | RN-SITE-03 |
| publicar los términos de uso como borrador legal | `<LegalDocument document={termsDocument} />` | `features/site/components/LegalDocument.tsx` | RN-SITE-04, RN-SITE-05 |
| publicar la política de privacidad como borrador legal | `<LegalDocument document={privacyDocument} />` | `features/site/lib/privacy.ts` | RN-SITE-04, RN-SITE-05, RN-SITE-06 |

## store

README: `features/store/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| mostrar la tienda patrocinada y los comercios cercanos en la portada | `<NearbyStores />` | `features/store/components/NearbyStores.tsx` | RN-STORE-02 |
| mostrar la tarjeta de una tienda | `<StoreCard />` | `features/store/components/StoreCard.tsx` | RN-STORE-01, RN-STORE-03 |
| listar todas las tiendas cercanas con paginación | `<StoresDirectory />` | `features/store/components/StoresDirectory.tsx` | RN-STORE-02, RN-STORE-04, RN-STORE-05 |
| mostrar la cabecera de la página de una tienda con su horario y contacto | `<StoreHeader />` | `features/store/components/StoreHeader.tsx` | RN-STORE-01, RN-STORE-04 |
| listar los productos de una tienda con paginación | `<StoreProducts />` | `features/store/components/StoreProducts.tsx` |  |
| armar el JSON-LD de una tienda | `storeJsonLd()` | `features/store/lib/jsonld.ts` | RN-STORE-04 |

## marketplace

README: `lib/marketplace/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| buscar productos por texto, categoría y ubicación con su precio mínimo y los destacados | `searchProducts()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02, RN-MARKETPLACE-03 |
| sugerir términos, productos y categorías mientras se escribe en el buscador | `getSuggestions()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02, RN-MARKETPLACE-03 |
| listar los productos con oferta dentro del radio o la ciudad, del más cercano al más lejano | `listNearbyProducts()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02, RN-MARKETPLACE-03 |
| listar las tiendas cercanas o de una ciudad con su distancia y las premium destacadas | `listNearbyStores()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02, RN-MARKETPLACE-03 |
| obtener el árbol de categorías globales | `listCategories()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02 |
| obtener estados, municipios y ciudades con tiendas | `listLocations()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02 |
| obtener la ficha de un producto con el resumen nacional de sus ofertas, o su slug nuevo | `getProduct()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02, RN-MARKETPLACE-04 |
| listar las ofertas de un producto según la ubicación, por precio o por distancia | `getProductOffers()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02, RN-MARKETPLACE-03, RN-MARKETPLACE-04 |
| obtener la ficha de una tienda con sus productos y precios en esa tienda | `getStore()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02, RN-MARKETPLACE-04 |
| listar los slugs de productos o tiendas para el sitemap | `listSitemap()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02 |
| registrar un evento de visita o de contacto con una tienda | `sendEvent()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-02 |
| registrar a un comprador, iniciar y cerrar su sesión, verificar su correo y recuperar su contraseña | `loginCustomer()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-02, RN-MARKETPLACE-05, RN-MARKETPLACE-06, RN-MARKETPLACE-07 |
| leer y cambiar el perfil, la contraseña y la configuración del comprador, o eliminar su cuenta | `getMe()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-02, RN-MARKETPLACE-05, RN-MARKETPLACE-06, RN-MARKETPLACE-07 |
| listar, crear, editar y borrar las direcciones del comprador | `listAddresses()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-02, RN-MARKETPLACE-05, RN-MARKETPLACE-07 |
| listar, marcar y desmarcar los productos y las tiendas favoritas del comprador | `listFavorites()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-02, RN-MARKETPLACE-05, RN-MARKETPLACE-07 |
| cotizar el carrito de invitado y leer, cambiar o fusionar el carrito del comprador | `getCart()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-02, RN-MARKETPLACE-05, RN-MARKETPLACE-07, RN-MARKETPLACE-08 |
| cotizar el checkout, iniciar el pago y leer las compras del comprador | `quoteCheckout()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-02, RN-MARKETPLACE-05, RN-MARKETPLACE-07, RN-MARKETPLACE-09 |
| listar los productos que el comprador ya compró, con su precio y disponibilidad de hoy, para volver a comprarlos | `getBuyAgain()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-02, RN-MARKETPLACE-05, RN-MARKETPLACE-07 |
