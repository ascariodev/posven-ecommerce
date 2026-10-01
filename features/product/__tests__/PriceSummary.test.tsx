import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { OffersSummary } from "@/lib/marketplace/schemas";
import { PriceSummary } from "@/features/product/components/PriceSummary";

function summary(overrides: Partial<OffersSummary> = {}): OffersSummary {
  return { offer_count: 3, low_price_usd: "2.35", high_price_usd: "3.10", ...overrides };
}

afterEach(() => {
  cleanup();
});

describe("PriceSummary", () => {
  it("con mínimo y máximo distintos pinta Desde, el mínimo, hasta y el máximo", () => {
    render(<PriceSummary summary={summary()} />);

    expect(screen.getByText("Desde")).toBeTruthy();
    expect(screen.getByText("$ 2,35")).toBeTruthy();
    expect(screen.getByText("hasta $ 3,10")).toBeTruthy();
  });

  it("con el máximo igual al mínimo no pinta hasta", () => {
    render(<PriceSummary summary={summary({ high_price_usd: "2.35" })} />);

    expect(screen.getByText("$ 2,35")).toBeTruthy();
    expect(screen.queryByText(/hasta/)).toBeNull();
  });

  it("con mínimo y sin máximo pinta Desde y el mínimo, sin hasta", () => {
    render(<PriceSummary summary={summary({ high_price_usd: null })} />);

    expect(screen.getByText("Desde")).toBeTruthy();
    expect(screen.getByText("$ 2,35")).toBeTruthy();
    expect(screen.queryByText(/hasta/)).toBeNull();
  });

  it("una oferta da en 1 tienda y tres dan en 3 tiendas", () => {
    render(<PriceSummary summary={summary({ offer_count: 1, high_price_usd: "2.35" })} />);
    expect(screen.getByText("en 1 tienda")).toBeTruthy();
    expect(screen.getByText("Precio en todo el país")).toBeTruthy();
    cleanup();

    render(<PriceSummary summary={summary()} />);
    expect(screen.getByText("en 3 tiendas")).toBeTruthy();
  });

  it("sin precio mínimo no pinta nada", () => {
    const { container } = render(
      <PriceSummary summary={{ offer_count: 0, low_price_usd: null, high_price_usd: null }} />,
    );

    expect(container.innerHTML).toBe("");
  });
});
