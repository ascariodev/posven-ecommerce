import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Store } from "@/lib/marketplace/schemas";

const getStore = vi.hoisted(() => vi.fn());

vi.mock("@/lib/marketplace/client", () => ({ getStore, listSitemap: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import { generateMetadata } from "@/app/tienda/[slug]/page";

function store(overrides: Partial<Store> = {}): Store {
  return {
    slug: "farmacia-central-valencia",
    name: "Farmacia Central",
    company_name: "Farmacia Central C.A.",
    logo_url: "https://cdn.example.com/logo.png",
    cover_url: null,
    address: "Av. Bolívar Norte",
    city: { slug: "valencia", name: "Valencia" },
    latitude: 10.18,
    longitude: -68.0,
    phone: "+582410000000",
    whatsapp: null,
    is_premium: false,
    accepts_orders: false,
    schedule: [],
    ...overrides,
  };
}

async function metadataFor(overrides: Partial<Store>) {
  getStore.mockResolvedValue({ data: store(overrides) });
  return generateMetadata({ params: Promise.resolve({ slug: "farmacia-central-valencia" }) });
}

describe("generateMetadata de la tienda", () => {
  beforeEach(() => {
    getStore.mockReset();
  });

  it("una tienda premium con logo trae la imagen Open Graph", async () => {
    const metadata = await metadataFor({ is_premium: true });
    expect(metadata.openGraph?.images).toEqual(["https://cdn.example.com/logo.png"]);
  });

  it("una tienda sin premium con logo también trae la imagen Open Graph", async () => {
    const metadata = await metadataFor({ is_premium: false });
    expect(metadata.openGraph?.images).toEqual(["https://cdn.example.com/logo.png"]);
  });

  it("sin logo no trae Open Graph aunque tenga portada", async () => {
    const metadata = await metadataFor({ logo_url: null, cover_url: "https://cdn.example.com/cover.png" });
    expect(metadata.openGraph).toBeUndefined();
  });
});
