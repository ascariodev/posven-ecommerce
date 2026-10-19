import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sendBeaconEvent } from "@/features/events/lib/beacon";
import type { SponsoredProduct } from "@/lib/marketplace/schemas";
import { SponsoredCard } from "../components/SponsoredCard";

vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));

const item = {
  product: { slug: "arroz", name: "Arroz", image_url: null, category: null },
  offer: { store: { slug: "tienda-a", name: "Tienda A" }, price_usd: "2.00", price_ves: "73.00", distance_km: 1.5 },
  token: "tok-p",
  advertiser_name: "Anunciante",
} as unknown as SponsoredProduct;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SponsoredCard", () => {
  it("enlaza al producto con la marca Patrocinado y no con Destacado", () => {
    render(<SponsoredCard item={item} />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/p/arroz");
    expect(screen.getByText("Patrocinado")).toBeTruthy();
    expect(screen.queryByText("Destacado")).toBeNull();
    expect(screen.getByText("Tienda A")).toBeTruthy();
  });

  it("el clic manda ad_click con el token", () => {
    render(<SponsoredCard item={item} />);
    fireEvent.click(screen.getByRole("link"));
    expect(sendBeaconEvent).toHaveBeenCalledWith({ type: "ad_click", ad_token: "tok-p" });
  });
});
