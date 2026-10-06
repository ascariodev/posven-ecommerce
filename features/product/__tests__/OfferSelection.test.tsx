import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfferSelectButton, OfferSelectionProvider, PurchaseBar, type SelectableOffer } from "@/features/product/components/OfferSelection";

vi.mock("@/features/cart/server/actions", () => ({ addToCart: vi.fn() }));
vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

afterEach(cleanup);

const OFFERS: SelectableOffer[] = [
  { storeSlug: "central", storeName: "Farmacia Central", priceUsd: "2.50", priceVes: "100.00", canOrder: true },
  { storeSlug: "esquina", storeName: "Abasto La Esquina", priceUsd: "3.00", priceVes: "120.00", canOrder: false },
];
const PRODUCT = { slug: "acetaminofen", name: "Acetaminofén" };

function renderBar() {
  return render(
    <OfferSelectionProvider offers={OFFERS} defaultSlug="central">
      <OfferSelectButton storeSlug="central" storeName="Farmacia Central" priceUsd="2.50" />
      <OfferSelectButton storeSlug="esquina" storeName="Abasto La Esquina" priceUsd="3.00" />
      <PurchaseBar product={PRODUCT} />
    </OfferSelectionProvider>,
  );
}

describe("selección de tienda y barra de compra", () => {
  it("parte de la tienda por defecto con su precio y su botón", () => {
    renderBar();
    const bar = screen.getByRole("region", { name: "Compra" });
    expect(bar.textContent).toContain("Farmacia Central");
    expect(bar.textContent).toContain("$ 2,50");
    expect(screen.getByRole("button", { name: "Agregar al carrito de la tienda elegida: Acetaminofén de Farmacia Central" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tienda elegida: Farmacia Central, $ 2,50" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("elegir otra tienda cambia la barra y, sin accepts_orders, quita el botón", () => {
    renderBar();
    fireEvent.click(screen.getByRole("button", { name: "Elegir tienda: Abasto La Esquina, $ 3,00" }));
    const bar = screen.getByRole("region", { name: "Compra" });
    expect(bar.textContent).toContain("Abasto La Esquina");
    expect(bar.textContent).toContain("$ 3,00");
    expect(bar.textContent).toContain("no recibe pedidos");
    expect(screen.queryByRole("button", { name: /^Agregar al carrito/ })).toBeNull();
  });

  it("sin proveedor no pinta nada", () => {
    const { container } = render(<OfferSelectButton storeSlug="central" storeName="Farmacia Central" priceUsd="2.50" />);
    expect(container.innerHTML).toBe("");
  });
});
