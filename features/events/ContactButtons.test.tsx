import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StoreSummary } from "@/lib/marketplace/schemas";
import { SITE_NAME } from "@/lib/site";
import { sendBeaconEvent } from "./beacon";
import { ContactButtons } from "./ContactButtons";

vi.mock("./beacon", () => ({ sendBeaconEvent: vi.fn() }));

function store(overrides: Partial<StoreSummary> = {}): StoreSummary {
  return {
    slug: "farmacia-santa-ana",
    name: "Farmacia Santa Ana",
    logo_url: null,
    address: "Av. Bolívar Norte",
    city: { slug: "valencia", name: "Valencia" },
    latitude: 10.18,
    longitude: -68.0,
    phone: "+58 241-555-0101",
    whatsapp: "+58 414-555-0101",
    is_premium: false,
    accepts_orders: false,
    ...overrides,
  };
}

const product = { slug: "acetaminofen-500mg", name: "Acetaminofén 500 mg", restriction: "none" as const };

afterEach(() => {
  cleanup();
  vi.mocked(sendBeaconEvent).mockReset();
});

describe("ContactButtons", () => {
  it("con WhatsApp y teléfono pinta los tres enlaces con sus href", () => {
    render(<ContactButtons store={store()} product={product} />);
    const message = `Hola, vi Acetaminofén 500 mg en ${SITE_NAME}. ¿Lo tienen disponible?`;
    expect(screen.getByRole("link", { name: "WhatsApp de Farmacia Santa Ana" }).getAttribute("href")).toBe(
      `https://wa.me/584145550101?text=${encodeURIComponent(message)}`,
    );
    expect(screen.getByRole("link", { name: "Llamar a Farmacia Santa Ana" }).getAttribute("href")).toBe(
      "tel:+58 241-555-0101",
    );
    expect(screen.getByRole("link", { name: "Ver ruta a Farmacia Santa Ana" }).getAttribute("href")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=10.18,-68",
    );
  });

  it("sin whatsapp no pinta WhatsApp", () => {
    render(<ContactButtons store={store({ whatsapp: null })} product={product} />);
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
  });

  it("con un producto recipe no pinta WhatsApp", () => {
    render(<ContactButtons store={store()} product={{ ...product, restriction: "recipe" }} />);
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
  });

  it("sin phone no pinta Llamar", () => {
    render(<ContactButtons store={store({ phone: null })} product={null} />);
    expect(screen.queryByRole("link", { name: /Llamar/ })).toBeNull();
  });

  it("un clic en Ver ruta manda click_route con el slug de la tienda y el del producto", () => {
    render(<ContactButtons store={store()} product={product} />);
    fireEvent.click(screen.getByRole("link", { name: "Ver ruta a Farmacia Santa Ana" }));
    expect(sendBeaconEvent).toHaveBeenCalledWith({
      type: "click_route",
      store_slug: "farmacia-santa-ana",
      product_slug: "acetaminofen-500mg",
    });
  });
});
