import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { accountCommand, accountRequest, postJson, requestJson, requestJsonOrNull } from "./http";
import * as mock from "./mock/adapter";
import {
  pageQuery,
  productQuery,
  searchQuery,
  storesQuery,
  type AccountContext,
  type FavoriteTarget,
  type GeoFilter,
  type OfferSort,
  type RadiusKm,
} from "./params";
import {
  addressEnvelopeSchema,
  addressListSchema,
  authResponseSchema,
  cartSchema,
  categoriesResponseSchema,
  checkoutStartSchema,
  customerEnvelopeSchema,
  favoritesResponseSchema,
  locationsResponseSchema,
  productResponseSchema,
  purchasePageSchema,
  purchaseSchema,
  quoteSchema,
  searchResponseSchema,
  sitemapResponseSchema,
  storeResponseSchema,
  storesResponseSchema,
  type Address,
  type AddressInput,
  type AddressPatch,
  type AuthResponse,
  type Cart,
  type CartItem,
  type CartItemPut,
  type CategoryNode,
  type CheckoutInput,
  type CheckoutQuoteInput,
  type CheckoutStart,
  type Customer,
  type FavoritesResponse,
  type LocationState,
  type MarketplaceEvent,
  type ProductResponse,
  type ProfilePatch,
  type Purchase,
  type PurchasePage,
  type Quote,
  type RegisterInput,
  type SearchResponse,
  type SitemapResponse,
  type SitemapType,
  type StoreResponse,
  type StoresResponse,
} from "./schemas";

function usesMock(): boolean {
  const mode = process.env.MARKETPLACE_MODE;
  if (mode === undefined || mode === "mock") return true;
  if (mode === "api") return false;
  throw new Error("MARKETPLACE_MODE debe ser mock o api");
}

export async function searchProducts(p: {
  q: string;
  category: string | null;
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  page: number;
}): Promise<SearchResponse> {
  if (usesMock()) return mock.searchProducts(p);
  return requestJson("/search", searchQuery(p), searchResponseSchema);
}

export async function listNearbyStores(p: {
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  page: number;
}): Promise<StoresResponse> {
  if (usesMock()) return mock.listNearbyStores(p);
  return requestJson("/stores", storesQuery(p), storesResponseSchema);
}

export async function listCategories(): Promise<CategoryNode[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("marketplace:categories");
  if (usesMock()) return mock.listCategories();
  const response = await requestJson("/categories", new URLSearchParams(), categoriesResponseSchema);
  return response.data;
}

export async function listLocations(): Promise<LocationState[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("marketplace:locations");
  if (usesMock()) return mock.listLocations();
  const response = await requestJson("/locations", new URLSearchParams(), locationsResponseSchema);
  return response.data;
}

export async function getProduct(slug: string): Promise<ProductResponse | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(`marketplace:product:${slug}`);
  if (usesMock()) return mock.getProduct(slug);
  return requestJsonOrNull(
    `/products/${encodeURIComponent(slug)}`,
    productQuery({ geo: null, radiusKm: null, sort: "price" }),
    productResponseSchema,
  );
}

export async function getProductOffers(p: {
  slug: string;
  geo: GeoFilter;
  radiusKm: RadiusKm | null;
  sort: OfferSort;
}): Promise<ProductResponse | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`marketplace:product:${p.slug}`);
  if (usesMock()) return mock.getProductOffers(p);
  return requestJsonOrNull(
    `/products/${encodeURIComponent(p.slug)}`,
    productQuery(p),
    productResponseSchema,
  );
}

export async function getStore(p: { slug: string; page: number }): Promise<StoreResponse | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`marketplace:store:${p.slug}`);
  if (usesMock()) return mock.getStore(p);
  return requestJsonOrNull(
    `/stores/${encodeURIComponent(p.slug)}`,
    pageQuery(p.page),
    storeResponseSchema,
  );
}

export async function listSitemap(p: { type: SitemapType; page: number }): Promise<SitemapResponse> {
  "use cache";
  cacheLife("hours");
  cacheTag(`marketplace:sitemap:${p.type}`);
  if (usesMock()) return mock.listSitemap(p);
  return requestJson(`/sitemap/${p.type}`, pageQuery(p.page), sitemapResponseSchema);
}

export async function sendEvent(event: MarketplaceEvent): Promise<void> {
  if (usesMock()) return mock.sendEvent(event);
  await postJson("/events", event);
}

export async function registerCustomer(
  ctx: AccountContext,
  input: RegisterInput,
): Promise<AuthResponse> {
  if (usesMock()) return mock.registerCustomer(ctx, input);
  return accountRequest({ method: "POST", path: "/customers", ctx, body: input }, authResponseSchema);
}

export async function loginCustomer(
  ctx: AccountContext,
  input: { email: string; password: string },
): Promise<AuthResponse> {
  if (usesMock()) return mock.loginCustomer(ctx, input);
  return accountRequest({ method: "POST", path: "/auth/login", ctx, body: input }, authResponseSchema);
}

export async function logoutCustomer(ctx: AccountContext): Promise<void> {
  if (usesMock()) return mock.logoutCustomer(ctx);
  await accountCommand({ method: "POST", path: "/auth/logout", ctx });
}

export async function requestPasswordReset(ctx: AccountContext, email: string): Promise<void> {
  if (usesMock()) return mock.requestPasswordReset(ctx, email);
  await accountCommand({ method: "POST", path: "/auth/password/forgot", ctx, body: { email } });
}

export async function resetPassword(
  ctx: AccountContext,
  input: { token: string; password: string },
): Promise<void> {
  if (usesMock()) return mock.resetPassword(ctx, input);
  await accountCommand({ method: "POST", path: "/auth/password/reset", ctx, body: input });
}

export async function verifyEmail(ctx: AccountContext, token: string): Promise<void> {
  if (usesMock()) return mock.verifyEmail(ctx, token);
  await accountCommand({ method: "POST", path: "/auth/email/verify", ctx, body: { token } });
}

export async function resendVerification(ctx: AccountContext): Promise<void> {
  if (usesMock()) return mock.resendVerification(ctx);
  await accountCommand({ method: "POST", path: "/auth/email/resend", ctx });
}

export async function getMe(ctx: AccountContext): Promise<Customer> {
  if (usesMock()) return mock.getMe(ctx);
  const response = await accountRequest({ method: "GET", path: "/me", ctx }, customerEnvelopeSchema);
  return response.data;
}

export async function updateMe(ctx: AccountContext, patch: ProfilePatch): Promise<Customer> {
  if (usesMock()) return mock.updateMe(ctx, patch);
  const response = await accountRequest(
    { method: "PATCH", path: "/me", ctx, body: patch },
    customerEnvelopeSchema,
  );
  return response.data;
}

export async function changePassword(
  ctx: AccountContext,
  input: { current_password: string; password: string },
): Promise<void> {
  if (usesMock()) return mock.changePassword(ctx, input);
  await accountCommand({ method: "PUT", path: "/me/password", ctx, body: input });
}

export async function updateSettings(
  ctx: AccountContext,
  input: { order_status_emails: boolean },
): Promise<Customer> {
  if (usesMock()) return mock.updateSettings(ctx, input);
  const response = await accountRequest(
    { method: "PATCH", path: "/me/settings", ctx, body: input },
    customerEnvelopeSchema,
  );
  return response.data;
}

export async function deleteAccount(ctx: AccountContext, input: { password: string }): Promise<void> {
  if (usesMock()) return mock.deleteAccount(ctx, input);
  await accountCommand({ method: "DELETE", path: "/me", ctx, body: input });
}

export async function listAddresses(ctx: AccountContext): Promise<Address[]> {
  if (usesMock()) return mock.listAddresses(ctx);
  const response = await accountRequest(
    { method: "GET", path: "/me/addresses", ctx },
    addressListSchema,
  );
  return response.data;
}

export async function createAddress(ctx: AccountContext, input: AddressInput): Promise<Address> {
  if (usesMock()) return mock.createAddress(ctx, input);
  const response = await accountRequest(
    { method: "POST", path: "/me/addresses", ctx, body: input },
    addressEnvelopeSchema,
  );
  return response.data;
}

export async function updateAddress(
  ctx: AccountContext,
  id: number,
  patch: AddressPatch,
): Promise<Address> {
  if (usesMock()) return mock.updateAddress(ctx, id, patch);
  const response = await accountRequest(
    { method: "PATCH", path: `/me/addresses/${id}`, ctx, body: patch },
    addressEnvelopeSchema,
  );
  return response.data;
}

export async function deleteAddress(ctx: AccountContext, id: number): Promise<void> {
  if (usesMock()) return mock.deleteAddress(ctx, id);
  await accountCommand({ method: "DELETE", path: `/me/addresses/${id}`, ctx });
}

export async function listFavorites(ctx: AccountContext): Promise<FavoritesResponse> {
  if (usesMock()) return mock.listFavorites(ctx);
  return accountRequest({ method: "GET", path: "/me/favorites", ctx }, favoritesResponseSchema);
}

function favoritePath(target: FavoriteTarget): string {
  const collection = target.kind === "product" ? "products" : "stores";
  return `/me/favorites/${collection}/${encodeURIComponent(target.slug)}`;
}

export async function addFavorite(ctx: AccountContext, target: FavoriteTarget): Promise<void> {
  if (usesMock()) return mock.addFavorite(ctx, target);
  await accountCommand({ method: "PUT", path: favoritePath(target), ctx });
}

export async function removeFavorite(ctx: AccountContext, target: FavoriteTarget): Promise<void> {
  if (usesMock()) return mock.removeFavorite(ctx, target);
  await accountCommand({ method: "DELETE", path: favoritePath(target), ctx });
}

// Carrito (spec cuentas-y-compras §4.2 con la enmienda del 2026-09-30): nada de un comprador en
// 'use cache'. El invitado cotiza su cookie; el usuario usa su carrito del servidor.
export async function quoteGuestCart(ctx: AccountContext, items: CartItem[]): Promise<Cart> {
  if (usesMock()) return mock.quoteGuestCart(ctx, items);
  return accountRequest({ method: "POST", path: "/cart/quote", ctx, body: { items } }, cartSchema);
}

export async function getCart(ctx: AccountContext): Promise<Cart> {
  if (usesMock()) return mock.getCart(ctx);
  return accountRequest({ method: "GET", path: "/me/cart", ctx }, cartSchema);
}

export async function setCartItem(ctx: AccountContext, item: CartItemPut): Promise<Cart> {
  if (usesMock()) return mock.setCartItem(ctx, item);
  return accountRequest({ method: "PUT", path: "/me/cart/items", ctx, body: item }, cartSchema);
}

export async function mergeCart(ctx: AccountContext, items: CartItem[]): Promise<Cart> {
  if (usesMock()) return mock.mergeCart(ctx, items);
  return accountRequest({ method: "POST", path: "/me/cart/merge", ctx, body: { items } }, cartSchema);
}

// Checkout y compras (spec cuentas-y-compras §4.2 con la enmienda G y H): sin 'use cache'.
export async function quoteCheckout(ctx: AccountContext, input: CheckoutQuoteInput): Promise<Quote> {
  if (usesMock()) return mock.quoteCheckout(ctx, input);
  return accountRequest({ method: "POST", path: "/checkout/quote", ctx, body: input }, quoteSchema);
}

export async function startCheckout(ctx: AccountContext, input: CheckoutInput): Promise<CheckoutStart> {
  if (usesMock()) return mock.startCheckout(ctx, input);
  return accountRequest({ method: "POST", path: "/checkout", ctx, body: input }, checkoutStartSchema);
}

export async function listPurchases(ctx: AccountContext, page: number): Promise<PurchasePage> {
  if (usesMock()) return mock.listPurchases(ctx, page);
  return accountRequest(
    { method: "GET", path: "/me/purchases", ctx, query: new URLSearchParams({ page: String(page) }) },
    purchasePageSchema,
  );
}

export async function getPurchase(ctx: AccountContext, code: string): Promise<Purchase> {
  if (usesMock()) return mock.getPurchase(ctx, code);
  return accountRequest(
    { method: "GET", path: `/me/purchases/${encodeURIComponent(code)}`, ctx },
    purchaseSchema,
  );
}
