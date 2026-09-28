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

export const offerSchema = z.object({
  store: storeSummarySchema,
  price_usd: moneySchema,
  price_ves: moneySchema,
  availability: availabilitySchema,
  updated_at: z.iso.datetime({ offset: true }),
  distance_km: z.number().nonnegative().nullable(),
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

export const nearbyStoreSchema = storeSummarySchema.extend({
  distance_km: z.number().nonnegative().nullable(),
  outside_radius: z.boolean(),
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
]);
export type EventType = z.infer<typeof eventTypeSchema>;

const eventFieldsSchema = z.object({
  type: eventTypeSchema,
  store_slug: z.string().nullable(),
  product_slug: z.string().nullable(),
});

function hasSlugsForType(event: z.infer<typeof eventFieldsSchema>): boolean {
  if (event.type === "product_view") return event.product_slug !== null && event.store_slug === null;
  return event.store_slug !== null;
}

const EVENT_SLUGS_MESSAGE =
  "product_view exige product_slug y store_slug nulo; los demás eventos exigen store_slug";

export const eventInputSchema = eventFieldsSchema.refine(hasSlugsForType, {
  message: EVENT_SLUGS_MESSAGE,
});
export type EventInput = z.infer<typeof eventInputSchema>;

export const marketplaceEventSchema = eventFieldsSchema
  .extend({ session_id: z.uuid() })
  .refine(hasSlugsForType, { message: EVENT_SLUGS_MESSAGE });
export type MarketplaceEvent = z.infer<typeof marketplaceEventSchema>;
