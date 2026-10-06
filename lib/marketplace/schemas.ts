import { z } from "zod";

export const moneySchema = z.string().regex(/^\d+\.\d{2}$/);
export type Money = z.infer<typeof moneySchema>;

export const rateSchema = z.object({
  usd_ves: z.string().regex(/^\d+\.\d{2,8}$/),
  valid_on: z.iso.date(),
});
export type Rate = z.infer<typeof rateSchema>;

export const availabilitySchema = z.enum(["available", "low"]);
export const restrictionSchema = z.enum(["none", "recipe", "controlled"]);
export type Restriction = z.infer<typeof restrictionSchema>;

export const categorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  parent_slug: z.string().nullable(),
});
export type Category = z.infer<typeof categorySchema>;

export const categoryNodeSchema = categorySchema.extend({
  get children() {
    return z.array(categoryNodeSchema);
  },
});
export type CategoryNode = z.infer<typeof categoryNodeSchema>;

export const cityRefSchema = z.object({
  slug: z.string(),
  name: z.string(),
});
export type CityRef = z.infer<typeof cityRefSchema>;

export const locationStateSchema = z.object({
  slug: z.string(),
  name: z.string(),
  municipalities: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      cities: z.array(cityRefSchema),
    }),
  ),
});
export type LocationState = z.infer<typeof locationStateSchema>;

export const storeSummarySchema = z.object({
  slug: z.string(),
  name: z.string(),
  logo_url: z.url().nullable(),
  address: z.string(),
  city: cityRefSchema,
  latitude: z.number(),
  longitude: z.number(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  is_premium: z.boolean(),
  // Opcional mientras posveapi no lo envíe (plan 4a de cuentas, decisión 3): ausente = false.
  // Pasa a obligatorio al desplegar el plan 3 de posveapi.
  accepts_orders: z.boolean().default(false),
});
export type StoreSummary = z.infer<typeof storeSummarySchema>;

export const productSchema = z.object({
  slug: z.string(),
  name: z.string(),
  ean: z.string().nullable(),
  brand: z.string().nullable(),
  category: categorySchema.nullable(),
  image_url: z.url().nullable(),
  attributes: z.array(z.object({ name: z.string(), value: z.string() })),
  restriction: restrictionSchema,
  is_unified: z.boolean(),
});
export type Product = z.infer<typeof productSchema>;

// Opcionales para el consumidor; los calcula la API.
const openStatusShape = {
  is_open: z.boolean().optional(),
  closes_at: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
};

export const offerSchema = z.object({
  store: storeSummarySchema,
  price_usd: moneySchema,
  price_ves: moneySchema,
  availability: availabilitySchema,
  updated_at: z.iso.datetime({ offset: true }),
  distance_km: z.number().nonnegative().nullable(),
  ...openStatusShape,
});
export type Offer = z.infer<typeof offerSchema>;

export const searchItemSchema = productSchema.extend({
  offers_count: z.int().min(1),
  min_price_usd: moneySchema,
  min_price_ves: moneySchema,
  nearest_km: z.number().nonnegative().nullable(),
  outside_radius: z.boolean(),
});
export type SearchItem = z.infer<typeof searchItemSchema>;

export const pageMetaSchema = z.object({
  page: z.int().min(1),
  per_page: z.int().min(1),
  total: z.int().min(0),
  out_of_range: z.boolean().optional(),
});
export type PageMeta = z.infer<typeof pageMetaSchema>;

const featuredProductSchema = z.object({
  product: productSchema,
  offer: offerSchema,
});
export type FeaturedProduct = z.infer<typeof featuredProductSchema>;

export const searchResponseSchema = z.object({
  data: z.array(searchItemSchema),
  featured: z.array(featuredProductSchema).max(2),
  meta: pageMetaSchema,
  rate: rateSchema,
});
export type SearchResponse = z.infer<typeof searchResponseSchema>;

export const nearbyProductsResponseSchema = z.object({
  data: z.array(searchItemSchema),
  meta: pageMetaSchema,
  rate: rateSchema,
});
export type NearbyProductsResponse = z.infer<typeof nearbyProductsResponseSchema>;

export const suggestionsResponseSchema = z.object({
  terms: z.array(z.string()).max(5),
  products: z.array(searchItemSchema).max(4),
  categories: z.array(z.object({ slug: z.string(), name: z.string() })).max(2),
  rate: rateSchema,
});
export type SuggestionsResponse = z.infer<typeof suggestionsResponseSchema>;

export const nearbyStoreSchema = storeSummarySchema.extend({
  distance_km: z.number().nonnegative().nullable(),
  outside_radius: z.boolean(),
  cover_url: z.url().nullable().optional(),
  ...openStatusShape,
});
export type NearbyStore = z.infer<typeof nearbyStoreSchema>;

export const storesResponseSchema = z.object({
  data: z.array(nearbyStoreSchema),
  featured: z.array(nearbyStoreSchema).max(2),
  meta: pageMetaSchema,
});
export type StoresResponse = z.infer<typeof storesResponseSchema>;

export const categoriesResponseSchema = z.object({
  data: z.array(categoryNodeSchema),
});

export const locationsResponseSchema = z.object({
  data: z.array(locationStateSchema),
});

export const scheduleEntrySchema = z.object({
  days: z.array(z.enum(["mo", "tu", "we", "th", "fr", "sa", "su"])).min(1),
  opens: z.string().regex(/^\d{2}:\d{2}$/),
  closes: z.string().regex(/^\d{2}:\d{2}$/),
});
export type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;

export const storeSchema = storeSummarySchema.extend({
  company_name: z.string(),
  cover_url: z.url().nullable(),
  schedule: z.array(scheduleEntrySchema),
  ...openStatusShape,
});
export type Store = z.infer<typeof storeSchema>;

export const storeProductSchema = productSchema.extend({
  price_usd: moneySchema,
  price_ves: moneySchema,
  availability: availabilitySchema,
  updated_at: z.iso.datetime({ offset: true }),
});
export type StoreProduct = z.infer<typeof storeProductSchema>;

export const storeResponseSchema = z.object({
  data: storeSchema,
  products: z.array(storeProductSchema),
  meta: pageMetaSchema,
  rate: rateSchema,
});
export type StoreResponse = z.infer<typeof storeResponseSchema>;

export const productOfferSchema = offerSchema.extend({
  outside_radius: z.boolean(),
  is_best_price: z.boolean().optional(),
});
export type ProductOffer = z.infer<typeof productOfferSchema>;

export const offersSummarySchema = z.object({
  offer_count: z.int().min(0),
  low_price_usd: moneySchema.nullable(),
  high_price_usd: moneySchema.nullable(),
});
export type OffersSummary = z.infer<typeof offersSummarySchema>;

export const productDetailSchema = productSchema.extend({
  offers_summary: offersSummarySchema,
});
export type ProductDetail = z.infer<typeof productDetailSchema>;

export const productRedirectSchema = z.object({
  redirect_to: z.string(),
});

export const productPageSchema = z.object({
  data: productDetailSchema,
  featured: z.array(productOfferSchema).max(2),
  offers: z.array(productOfferSchema).max(50),
  rate: rateSchema,
  meta: z.object({ out_of_range: z.boolean() }).optional(),
});
export type ProductPage = z.infer<typeof productPageSchema>;

export const productResponseSchema = z.union([productRedirectSchema, productPageSchema]);
export type ProductResponse = z.infer<typeof productResponseSchema>;

export const sitemapTypeSchema = z.enum(["products", "stores"]);
export type SitemapType = z.infer<typeof sitemapTypeSchema>;

export const sitemapResponseSchema = z.object({
  data: z.array(
    z.object({
      slug: z.string(),
      updated_at: z.iso.datetime({ offset: true }),
    }),
  ),
  meta: pageMetaSchema,
});
export type SitemapResponse = z.infer<typeof sitemapResponseSchema>;

export const eventTypeSchema = z.enum([
  "product_view",
  "store_view",
  "click_whatsapp",
  "click_call",
  "click_route",
  "search",
  "add_to_cart",
]);
export type EventType = z.infer<typeof eventTypeSchema>;

const eventFieldsSchema = z.object({
  type: eventTypeSchema,
  store_slug: z.string().max(160).nullable(),
  product_slug: z.string().max(160).nullable(),
  query: z.string().trim().toLowerCase().max(100).nullish(),
  category_slug: z.string().max(120).nullish(),
  results_count: z.number().int().min(0).nullish(),
});

function isBlank(value: string | null | undefined): boolean {
  return value === null || value === undefined || value === "";
}

function hasFieldsForType(event: z.infer<typeof eventFieldsSchema>): boolean {
  const hasResultsCount = event.results_count !== null && event.results_count !== undefined;
  const hasQueryOrCategory = !isBlank(event.query) || !isBlank(event.category_slug);
  if (event.type === "search") {
    return event.store_slug === null && event.product_slug === null && hasQueryOrCategory && hasResultsCount;
  }
  if (hasQueryOrCategory || hasResultsCount) return false;
  if (event.type === "product_view") return event.product_slug !== null && event.store_slug === null;
  if (event.type === "add_to_cart") return event.product_slug !== null && event.store_slug !== null;
  return event.store_slug !== null;
}

const EVENT_FIELDS_MESSAGE =
  "search exige query o category_slug y results_count, sin tienda ni producto; product_view exige product_slug y store_slug nulo; add_to_cart exige store_slug y product_slug; los demás exigen store_slug; query, category_slug y results_count sólo van en search";

export const eventInputSchema = eventFieldsSchema.refine(hasFieldsForType, {
  message: EVENT_FIELDS_MESSAGE,
});
export type EventInput = z.infer<typeof eventInputSchema>;

export const marketplaceEventSchema = eventFieldsSchema
  .extend({ session_id: z.uuid() })
  .refine(hasFieldsForType, { message: EVENT_FIELDS_MESSAGE });
export type MarketplaceEvent = z.infer<typeof marketplaceEventSchema>;

export const accountErrorCodeSchema = z.enum([
  "unauthenticated",
  "not_found",
  "validation_failed",
  "invalid_credentials",
  "token_invalid",
  "token_expired",
  "too_many_attempts",
  "not_orderable",
  "product_restricted",
  "cart_full",
  "email_unverified",
  "quote_changed",
  "cart_empty",
  "open_orders",
  "billing_incomplete",
]);
export type AccountErrorCode = z.infer<typeof accountErrorCodeSchema>;

export const billingDocumentTypeSchema = z.enum(["V", "E", "J", "G"]);
export const billingTaxpayerTypeSchema = z.enum(["special", "ordinary"]);

// Datos fiscales del comprador (spec cuentas-y-compras §4.1 Billing); las seis claves o ninguna.
export const billingSchema = z.object({
  document_type: billingDocumentTypeSchema,
  document: z.string(),
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  taxpayer_type: billingTaxpayerTypeSchema,
});
export type Billing = z.infer<typeof billingSchema>;

export const customerSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  email_verified: z.boolean(),
  pending_email: z.string().nullable(),
  settings: z.object({
    order_status_emails: z.boolean(),
  }),
  billing: billingSchema.nullable(),
});
export type Customer = z.infer<typeof customerSchema>;

export const customerEnvelopeSchema = z.object({
  data: customerSchema,
});

export const authResponseSchema = z.object({
  token: z.string().regex(/^\d{1,18}\|.+$/),
  customer: customerSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const addressSchema = z.object({
  id: z.int().min(1),
  label: z.string(),
  recipient_name: z.string(),
  phone: z.string(),
  city: cityRefSchema,
  line: z.string(),
  reference: z.string().nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  is_default: z.boolean(),
});
export type Address = z.infer<typeof addressSchema>;

export const addressEnvelopeSchema = z.object({
  data: addressSchema,
});

export const addressListSchema = z.object({
  data: z.array(addressSchema),
});

export const addressInputSchema = z.object({
  label: z.string(),
  recipient_name: z.string(),
  phone: z.string(),
  city_slug: z.string(),
  line: z.string(),
  reference: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  is_default: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

export const addressPatchSchema = addressInputSchema.partial();
export type AddressPatch = z.infer<typeof addressPatchSchema>;

export const registerInputSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  password: z.string(),
  billing: billingSchema.pick({ document_type: true, document: true, address: true, taxpayer_type: true }),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const profilePatchSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  current_password: z.string().optional(),
  billing: billingSchema.nullable().optional(),
});
export type ProfilePatch = z.infer<typeof profilePatchSchema>;

export const favoritesResponseSchema = z.object({
  products: z.array(productSchema),
  stores: z.array(storeSummarySchema),
});
export type FavoritesResponse = z.infer<typeof favoritesResponseSchema>;

// Carrito (spec cuentas-y-compras §4.1 Cart, con la enmienda del 2026-09-30, puntos C, D, H, J y K).
// Límites del contrato (spec §5.2): los usan también la cookie, las acciones y el simulado.
export const CART_MAX_LINES = 20;
export const CART_MAX_QUANTITY = 99;
export const CART_SLUG_MAX_LENGTH = 120;

const cartSlugSchema = z.string().min(1).max(CART_SLUG_MAX_LENGTH);

function cartLineKey(item: { store_slug: string; product_slug: string }): string {
  return `${item.store_slug}\u0000${item.product_slug}`;
}

export const cartItemSchema = z.strictObject({
  store_slug: cartSlugSchema,
  product_slug: cartSlugSchema,
  quantity: z.int().min(1).max(CART_MAX_QUANTITY),
});
export type CartItem = z.infer<typeof cartItemSchema>;

export const cartItemsSchema = z
  .array(cartItemSchema)
  .max(CART_MAX_LINES)
  .refine((items) => new Set(items.map(cartLineKey)).size === items.length, {
    message: "Hay productos repetidos en el carrito.",
  });

// Entrada de PUT /me/cart/items: 0 borra la línea (enmienda J).
export const cartItemPutSchema = cartItemSchema.extend({ quantity: z.int().min(0).max(CART_MAX_QUANTITY) });
export type CartItemPut = z.infer<typeof cartItemPutSchema>;

export const unavailableReasonSchema = z.enum(["out_of_stock", "store_not_selling", "offer_gone", "restricted"]);
export type UnavailableReason = z.infer<typeof unavailableReasonSchema>;

// Producto de la línea del carrito y del pedido (enmienda D y H).
export const lineProductSchema = z.object({
  slug: z.string(),
  name: z.string(),
  image_url: z.url().nullable(),
  category: categorySchema.nullable(),
});

export const cartLineSchema = z.object({
  product: lineProductSchema,
  quantity: z.int().min(1).max(CART_MAX_QUANTITY),
  price_usd: moneySchema.nullable(),
  price_ves: moneySchema.nullable(),
  line_usd: moneySchema.nullable(),
  line_ves: moneySchema.nullable(),
  availability: availabilitySchema.nullable(),
  status: z.enum(["ok", "unavailable"]),
  unavailable_reason: unavailableReasonSchema.nullable(),
});
export type CartLine = z.infer<typeof cartLineSchema>;

export const fulfillmentSchema = z.enum(["pickup", "delivery"]);
export type Fulfillment = z.infer<typeof fulfillmentSchema>;

export const cartStoreSchema = z.object({
  store: storeSummarySchema,
  is_open: z.boolean(),
  closes_at: openStatusShape.closes_at,
  accepts_orders: z.boolean(),
  offers_delivery: z.boolean(),
  distance_km: z.number().nonnegative().nullable().optional(),
  lines: z.array(cartLineSchema).min(1),
  subtotal_usd: moneySchema,
  subtotal_ves: moneySchema,
  fulfillment: fulfillmentSchema.optional(),
  delivery_fee_usd: moneySchema.nullable().optional(),
  delivery_fee_ves: moneySchema.nullable().optional(),
  total_usd: moneySchema.optional(),
  total_ves: moneySchema.optional(),
});
export type CartStore = z.infer<typeof cartStoreSchema>;

export const cartSchema = z.object({
  stores: z.array(cartStoreSchema),
  total_usd: moneySchema,
  total_ves: moneySchema,
  line_count: z.int().min(0),
  rate: rateSchema,
});
export type Cart = z.infer<typeof cartSchema>;

// Checkout y compras (spec cuentas-y-compras §4.1 Quote, Purchase y StoreOrder; §4.2; enmienda F,
// G y H).
export const deliveryUnavailableReasonSchema = z.enum(["no_delivery", "out_of_radius", "no_address"]);
export type DeliveryUnavailableReason = z.infer<typeof deliveryUnavailableReasonSchema>;

export const quoteStoreSchema = z.object({
  store_slug: z.string(),
  fulfillment: fulfillmentSchema,
  delivery_available: z.boolean(),
  delivery_unavailable_reason: deliveryUnavailableReasonSchema.nullable(),
  subtotal_usd: moneySchema,
  subtotal_ves: moneySchema,
  delivery_fee_usd: moneySchema,
  delivery_fee_ves: moneySchema,
  total_usd: moneySchema,
  total_ves: moneySchema,
});
export type QuoteStore = z.infer<typeof quoteStoreSchema>;

export const chargeSchema = z.object({
  currency: z.enum(["VES", "USD"]),
  amount: moneySchema,
});
export type Charge = z.infer<typeof chargeSchema>;

export const quoteSchema = z.object({
  quote_hash: z.string().min(1),
  stores: z.array(quoteStoreSchema).min(1),
  total_usd: moneySchema,
  total_ves: moneySchema,
  charge: chargeSchema,
  rate: rateSchema,
});
export type Quote = z.infer<typeof quoteSchema>;

const checkoutStoresSchema = z
  .array(z.strictObject({ store_slug: cartSlugSchema, fulfillment: fulfillmentSchema }))
  .min(1)
  .max(CART_MAX_LINES)
  .refine((stores) => new Set(stores.map((store) => store.store_slug)).size === stores.length, {
    message: "Hay tiendas repetidas en el checkout.",
  });

export const checkoutQuoteInputSchema = z.strictObject({
  stores: checkoutStoresSchema,
  address_id: z.int().min(1).nullable(),
});
export type CheckoutQuoteInput = z.infer<typeof checkoutQuoteInputSchema>;

export const checkoutInputSchema = checkoutQuoteInputSchema.extend({
  quote_hash: z.string().min(1).max(200),
  idempotency_key: z.uuid({ version: "v4" }),
  bill_to_me: z.boolean().optional(),
});
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

// Exactamente uno de redirect_url e instructions no es nulo (enmienda F).
export const checkoutStartSchema = z.object({
  purchase_code: z.string().min(1),
  payment: z
    .object({
      provider: z.string(),
      redirect_url: z.url({ protocol: /^https?$/ }).nullable(),
      instructions: z.string().nullable(),
    })
    .refine((payment) => (payment.redirect_url === null) !== (payment.instructions === null), {
      message: "El pago trae redirect_url o instructions, uno solo.",
    }),
});
export type CheckoutStart = z.infer<typeof checkoutStartSchema>;

export const purchaseStatusSchema = z.enum(["pending_payment", "paid", "expired", "failed"]);
export type PurchaseStatus = z.infer<typeof purchaseStatusSchema>;

// `pending_payment` mientras la compra no se paga; `cancelled` si vence o el pago falla (enmienda L).
export const storeOrderStatusSchema = z.enum([
  "pending_payment",
  "accepted",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);
export type StoreOrderStatus = z.infer<typeof storeOrderStatusSchema>;

const dateTimeSchema = z.iso.datetime({ offset: true });

export const orderAddressSchema = z.object({
  label: z.string(),
  recipient_name: z.string(),
  phone: z.string(),
  city: cityRefSchema,
  line: z.string(),
  reference: z.string().nullable(),
});
export type OrderAddress = z.infer<typeof orderAddressSchema>;

export const storeOrderLineSchema = z.object({
  product: lineProductSchema,
  quantity: z.int().min(1),
  accepted_quantity: z.int().min(0),
  unit_usd: moneySchema,
  unit_ves: moneySchema,
  line_usd: moneySchema,
  line_ves: moneySchema,
  missing: z.boolean(),
});
export type StoreOrderLine = z.infer<typeof storeOrderLineSchema>;

export const storeOrderSchema = z.object({
  store: storeSummarySchema,
  status: storeOrderStatusSchema,
  fulfillment: fulfillmentSchema,
  pickup_code: z.string().nullable(),
  address: orderAddressSchema.nullable(),
  lines: z.array(storeOrderLineSchema).min(1),
  subtotal_usd: moneySchema,
  subtotal_ves: moneySchema,
  delivery_fee_usd: moneySchema,
  delivery_fee_ves: moneySchema,
  refunded_usd: moneySchema,
  refunded_ves: moneySchema,
  timeline: z.object({
    paid_at: dateTimeSchema.nullable(),
    ready_at: dateTimeSchema.nullable(),
    dispatched_at: dateTimeSchema.nullable(),
    delivered_at: dateTimeSchema.nullable(),
    cancelled_at: dateTimeSchema.nullable(),
  }),
});
export type StoreOrder = z.infer<typeof storeOrderSchema>;

export const purchaseSchema = z.object({
  code: z.string().min(1),
  status: purchaseStatusSchema,
  created_at: dateTimeSchema,
  paid_at: dateTimeSchema.nullable(),
  total_usd: moneySchema,
  total_ves: moneySchema,
  charge: chargeSchema,
  rate: rateSchema,
  orders: z.array(storeOrderSchema),
});
export type Purchase = z.infer<typeof purchaseSchema>;

export const purchasePageSchema = z.object({
  data: z.array(purchaseSchema),
  meta: pageMetaSchema,
});
export type PurchasePage = z.infer<typeof purchasePageSchema>;

// "Volver a comprar" (spec cuentas-y-compras §4.1 BuyAgainItem y §4.2). `status` sólo admite `ok` o
// `unavailable`; `availability` es nulo en todo ítem `unavailable` (como el carrito), aunque el precio
// llegue (oferta agotada), y también sin oferta, caso en que el precio es nulo.
export const buyAgainItemSchema = z.object({
  product: lineProductSchema,
  store: storeSummarySchema,
  price_usd: moneySchema.nullable(),
  price_ves: moneySchema.nullable(),
  availability: availabilitySchema.nullable(),
  status: z.enum(["ok", "unavailable"]),
  unavailable_reason: unavailableReasonSchema.nullable(),
  last_purchased_at: dateTimeSchema,
});
export type BuyAgainItem = z.infer<typeof buyAgainItemSchema>;

export const buyAgainResponseSchema = z.object({
  data: z.array(buyAgainItemSchema).max(8),
  rate: rateSchema,
});
export type BuyAgainResponse = z.infer<typeof buyAgainResponseSchema>;

// Cuerpo de error de cuenta, carrito y checkout; `quote` sólo viene en `quote_changed` (enmienda G).
export const accountErrorBodySchema = z.object({
  error: z.object({
    code: accountErrorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
    retry_after: z.int().min(0).optional(),
    quote: quoteSchema.optional(),
  }),
});
