import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OfferCard } from "@/features/product/components/OfferCard";
import { OfferSelectionProvider } from "@/features/product/components/OfferSelection";
import type { ProductOffer } from "@/lib/marketplace/schemas";

vi.mock("@/features/cart/server/actions", () => ({ addToCart: vi.fn() }));
vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));

const product = { slug: "acetaminofen", name: "Acetaminofén 500 mg", restriction: "none" as const };
const now = new Date("2026-09-26T15:00:00Z");

function offer(overrides: Partial<ProductOffer> = {}, store: Partial<ProductOffer["store"]> = {}): ProductOffer {
  return {
    store: {
      slug: "farmacia-central-valencia",
      name: "Farmacia Central",
      logo_url: null,
      address: "Av. Bolívar Norte",
      city: { slug: "valencia", name: "Valencia" },
      latitude: 10.18,
      longitude: -68.0,
      phone: "+584121234567",
      whatsapp: "584121234567",
      is_premium: false,
      accepts_orders: true,
      ...store,
    },
    price_usd: "2.50",
    price_ves: "91.25",
    availability: "available",
    updated_at: "2026-09-26T14:30:00Z",
    distance_km: 1.2,
    outside_radius: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubEnv("MARKETPLACE_MODE", "mock");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("OfferCard", () => {
  it("muestra el nombre real de la tienda con enlace a su página y sin botón propio de agregar", () => {
    render(<OfferCard offer={offer()} product={product} featured={false} now={now} />);

    expect(screen.getByRole("link", { name: "Farmacia Central" }).getAttribute("href")).toBe(
      "/tienda/farmacia-central-valencia",
    );
    expect(screen.queryByRole("button", { name: /Agregar al carrito/ })).toBeNull();
    expect(screen.queryByText("Comercio Aliado")).toBeNull();
  });

  it("se elige con un control que nombra tienda y precio, y la barra sigue a la elección", () => {
    render(
      <OfferSelectionProvider
        offers={[{ storeSlug: "farmacia-central-valencia", storeName: "Farmacia Central", priceUsd: "2.50", priceVes: "91.25", canOrder: true }]}
        defaultSlug="otra"
      >
        <OfferCard offer={offer()} product={product} featured={false} now={now} />
      </OfferSelectionProvider>,
    );
    const pick = screen.getByRole("button", { name: "Elegir tienda: Farmacia Central, $ 2,50" });
    expect(pick.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(pick);
    expect(
      screen.getByRole("button", { name: "Tienda elegida: Farmacia Central, $ 2,50" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("no se puede elegir con receta ni en una tienda que no recibe pedidos, pero sí con controlado", () => {
    const wrap = (card: ReactNode) => (
      <OfferSelectionProvider offers={[]} defaultSlug="x">
        {card}
      </OfferSelectionProvider>
    );
    const pick = () => screen.queryByRole("button", { name: /^(Elegir|Tienda elegida)/ });
    const { rerender } = render(
      wrap(<OfferCard offer={offer()} product={{ ...product, restriction: "recipe" }} featured={false} now={now} />),
    );
    expect(pick()).toBeNull();

    rerender(wrap(<OfferCard offer={offer({}, { accepts_orders: false })} product={product} featured={false} now={now} />));
    expect(pick()).toBeNull();

    rerender(wrap(<OfferCard offer={offer()} product={{ ...product, restriction: "controlled" }} featured={false} now={now} />));
    expect(pick()).toBeTruthy();
  });

  it("trae WhatsApp y llamada de la tienda", () => {
    render(<OfferCard offer={offer()} product={product} featured={false} now={now} />);

    expect(screen.getByRole("link", { name: "WhatsApp de Farmacia Central" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Llamar a Farmacia Central" })).toBeTruthy();
  });

  it("Mejor precio sale de is_best_price y no de la posición", () => {
    const { rerender } = render(
      <OfferCard offer={offer({ is_best_price: true })} product={product} featured={false} now={now} />,
    );
    expect(screen.getByText("Mejor precio")).toBeTruthy();

    rerender(<OfferCard offer={offer({ is_best_price: false })} product={product} featured={false} now={now} />);
    expect(screen.queryByText("Mejor precio")).toBeNull();

    rerender(<OfferCard offer={offer()} product={product} featured={false} now={now} />);
    expect(screen.queryByText("Mejor precio")).toBeNull();
  });

  it("muestra Abierto con la hora de cierre, Abierto sin hora, Cerrado o nada según la API", () => {
    const { rerender } = render(
      <OfferCard offer={offer({ is_open: true, closes_at: "22:00" })} product={product} featured={false} now={now} />,
    );
    expect(screen.getByText("Abierto · cierra 22:00")).toBeTruthy();

    rerender(<OfferCard offer={offer({ is_open: true, closes_at: null })} product={product} featured={false} now={now} />);
    expect(screen.getByText("Abierto")).toBeTruthy();

    rerender(<OfferCard offer={offer({ is_open: false })} product={product} featured={false} now={now} />);
    expect(screen.getByText("Cerrado")).toBeTruthy();

    rerender(<OfferCard offer={offer()} product={product} featured={false} now={now} />);
    expect(screen.queryByText(/Abierto|Cerrado/)).toBeNull();
  });

  it("el sello Aliado PosVen sale sólo si la tienda de la oferta es premium", () => {
    const { rerender } = render(<OfferCard offer={offer()} product={product} featured={false} now={now} />);
    expect(screen.queryByText("Aliado PosVen")).toBeNull();
    rerender(<OfferCard offer={offer({}, { is_premium: true })} product={product} featured={false} now={now} />);
    expect(screen.getByText("Aliado PosVen")).toBeTruthy();
  });
});
