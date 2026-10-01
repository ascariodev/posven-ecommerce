# Capacidades de posven-ecommerce

Generado por `node posven/.claude/scripts/generate-index.mjs posven-ecommerce`: no se edita a mano.
Se regenera y commitea junto con todo cambio al frontmatter `capabilities` de un README.

## account

README: `features/account/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| leer el comprador de la sesión | `getCurrentCustomer()` | `features/account/session.ts` | RN-ACCOUNT-01, RN-ACCOUNT-03, RN-ACCOUNT-04 |
| entrar, crear cuenta y recuperar la contraseña | `login() / register() / logout() / forgotPassword() / resetPasswordAction() / verifyEmailAction() / resendVerificationAction()` | `features/account/actions.ts` | RN-ACCOUNT-01, RN-ACCOUNT-02, RN-ACCOUNT-03 |
| mostrar el acceso o el menú de la cuenta en la cabecera | `<AccountSlot />` | `features/account/AccountMenu.tsx` | RN-ACCOUNT-05 |
| editar el perfil, la contraseña, los avisos, las direcciones del comprador o eliminar su cuenta | `updateProfile() / changePasswordAction() / updateSettingsAction() / deleteAccountAction() / saveAddress() / deleteAddressAction() / setDefaultAddress()` | `features/account/accountActions.ts` | RN-ACCOUNT-03, RN-ACCOUNT-06 |
| marcar o quitar un producto o una tienda de favoritos | `<FavoriteButton /> / toggleFavorite()` | `features/account/FavoriteButton.tsx` | RN-ACCOUNT-03, RN-ACCOUNT-05 |

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
| pagar el carrito: elegir dirección y retiro o entrega por tienda, ver la cotización e iniciar el pago | `<CheckoutView />` | `features/checkout/CheckoutView.tsx` | RN-CHECKOUT-01, RN-CHECKOUT-02, RN-CHECKOUT-03 |
| mostrar el resultado del pago y consultarlo hasta un estado final | `<CheckoutResult />` | `features/checkout/CheckoutResult.tsx` | RN-CHECKOUT-04 |

## events

README: `features/events/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| registrar una vista o un clic de contacto de quien busca | `POST /api/events` | `app/api/events/route.ts` | RN-EVENTS-01, RN-EVENTS-02 |
| mostrar los botones de contacto de una tienda | `<ContactButtons />` | `features/events/ContactButtons.tsx` | RN-EVENTS-03 |
| registrar la vista de una página de producto o de tienda | `<ViewBeacon />` | `features/events/ViewBeacon.tsx` |  |

## location

README: `features/location/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| leer la ubicación efectiva del usuario para filtrar por cercanía | `getEffectiveLocation()` | `features/location/server/location.ts` | RN-LOCATION-01, RN-LOCATION-02, RN-LOCATION-04 |
| guardar la ubicación del usuario por geolocalización o ciudad elegida | `setLocationFromCoords() / setLocationCity() / clearLocation()` | `features/location/server/actions.ts` | RN-LOCATION-01, RN-LOCATION-03 |
| mostrar y cambiar la ubicación en pantalla | `<LocationBar />` | `features/location/components/LocationBar.tsx` | RN-LOCATION-02, RN-LOCATION-03 |

## product

README: `features/product/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| cargar un producto por slug con su 404 y su redirección | `loadProduct()` | `features/product/load.ts` | RN-PRODUCT-02 |
| armar los metadatos y el JSON-LD de un producto | `productMetadata()` | `features/product/metadata.ts` | RN-PRODUCT-01, RN-PRODUCT-02 |
| mostrar dónde comprar un producto ordenado por precio o cercanía | `<ProductOffers />` | `features/product/ProductOffers.tsx` | RN-PRODUCT-03, RN-PRODUCT-04, RN-PRODUCT-05 |

## purchases

README: `features/purchases/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| listar las compras del comprador, paginadas | `<PurchaseList />` | `features/purchases/PurchaseList.tsx` | RN-PURCHASES-01 |
| ver el detalle de una compra con el código de retiro y los reembolsos | `<PurchaseDetail />` | `features/purchases/PurchaseDetail.tsx` | RN-PURCHASES-02, RN-PURCHASES-03 |
| mostrar las últimas compras en el resumen de la cuenta | `<RecentPurchases />` | `features/purchases/RecentPurchases.tsx` | RN-PURCHASES-01 |

## search

README: `features/search/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| buscar productos por texto o categoría cerca del usuario | `<SearchResults />` | `features/search/SearchResults.tsx` | RN-SEARCH-01, RN-SEARCH-03, RN-SEARCH-04 |
| leer y escribir los parámetros de la URL de /buscar | `parseSearchQuery() / searchHref()` | `features/search/query.ts` | RN-SEARCH-02 |
| mostrar la píldora de búsqueda con el segmento de ubicación | `<SearchPill />` | `features/search/SearchPill.tsx` |  |
| mostrar el carril de categorías del inicio | `<CategoryRail />` | `features/search/CategoryRail.tsx` |  |

## site

README: `features/site/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| mostrar el pie del sitio con sus columnas de enlaces | `<SiteFooter />` | `features/site/SiteFooter.tsx` | RN-SITE-01, RN-SITE-02 |
| ofrecer contacto a un comercio que quiere aparecer en el buscador | `<MerchantContact whatsapp={string \| null} email={string \| null} />` | `features/site/MerchantContact.tsx` | RN-SITE-03 |
| publicar los términos de uso como borrador legal | `<LegalDocument document={termsDocument} />` | `features/site/LegalDocument.tsx` | RN-SITE-04, RN-SITE-05 |
| publicar la política de privacidad como borrador legal | `<LegalDocument document={privacyDocument} />` | `features/site/privacy.ts` | RN-SITE-04, RN-SITE-05, RN-SITE-06 |

## store

README: `features/store/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| mostrar las tiendas cercanas en la portada | `<NearbyStores />` | `features/store/NearbyStores.tsx` | RN-STORE-02 |
| mostrar la tarjeta de una tienda | `<StoreCard />` | `features/store/StoreCard.tsx` | RN-STORE-01, RN-STORE-03 |
| mostrar la cabecera de la página de una tienda con su horario y contacto | `<StoreHeader />` | `features/store/StoreHeader.tsx` | RN-STORE-01, RN-STORE-04 |
| listar los productos de una tienda con paginación | `<StoreProducts />` | `features/store/StoreProducts.tsx` |  |
| armar el JSON-LD de una tienda | `storeJsonLd()` | `features/store/jsonld.ts` | RN-STORE-04 |

## marketplace

README: `lib/marketplace/README.md`

| Intención | Entrada | Archivo | Reglas |
|---|---|---|---|
| buscar productos por texto, categoría y ubicación con su precio mínimo y los destacados | `searchProducts()` | `lib/marketplace/client.ts` | RN-MARKETPLACE-01, RN-MARKETPLACE-02, RN-MARKETPLACE-03 |
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
