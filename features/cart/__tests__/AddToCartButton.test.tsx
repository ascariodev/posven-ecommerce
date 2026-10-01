import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { addToCart } from "@/features/cart/server/actions";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";

vi.mock("@/features/cart/server/actions", () => ({ addToCart: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderButton() {
  return render(
    <AddToCartButton
      storeSlug="farmacia-central-valencia"
      storeName="Farmacia Central"
      productSlug="acetaminofen-500-mg-20-tabletas"
      productName="Acetaminofén 500 mg"
    />,
  );
}

function submit(container: HTMLElement): void {
  const form = container.querySelector("form");
  if (form === null) throw new Error("falta el formulario");
  fireEvent.submit(form);
}

describe("AddToCartButton", () => {
  it("nombra el producto y la tienda empezando por el texto visible", () => {
    renderButton();
    expect(screen.getByRole("button", { name: "Agregar al carrito: Acetaminofén 500 mg de Farmacia Central" })).toBeTruthy();
  });

  it("tras agregar muestra Agregado, Ver carrito y Agregar otro", async () => {
    vi.mocked(addToCart).mockResolvedValue({ status: "added", message: null });
    const { container } = renderButton();

    submit(container);

    expect(await screen.findByText("Agregado")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver carrito" }).getAttribute("href")).toBe("/carrito");
    expect(screen.getByRole("button", { name: "Agregar otro: Acetaminofén 500 mg de Farmacia Central" })).toBeTruthy();
    const data = vi.mocked(addToCart).mock.calls[0][1];
    expect(data.get("store_slug")).toBe("farmacia-central-valencia");
    expect(data.get("product_slug")).toBe("acetaminofen-500-mg-20-tabletas");
  });

  it("con error muestra el mensaje", async () => {
    vi.mocked(addToCart).mockResolvedValue({ status: "error", message: "Tu carrito admite hasta 20 productos." });
    const { container } = renderButton();

    submit(container);

    expect(await screen.findByText("Tu carrito admite hasta 20 productos.")).toBeTruthy();
  });
});
