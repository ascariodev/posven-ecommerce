import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Cart, CartLine, CartStore } from "@/lib/marketplace/schemas";
import { CartContent } from "./CartView";

vi.mock("./actions", () => ({ setQuantity: vi.fn(), removeLine: vi.fn() }));
vi.mock("./server", () => ({ getCurrentCart: vi.fn() }));

afterEach(() => {
  cleanup();
});

const rate = { usd_ves: "36.50", valid_on: "2026-09-26" };

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    product: { slug: "acetaminofen-500-mg-20-tabletas", name: "Acetaminofén 500 mg", image_url: null, category: null },
    quantity: 2,
    price_usd: "2.50",
    price_ves: "91.25",
    line_usd: "5.00",
    line_ves: "182.50",
    availability: "available",
    status: "ok",
    unavailable_reason: null,
    ...overrides,
  };
}

function store(lines: CartLine[], overrides: Partial<CartStore> = {}): CartStore {
  return {
    store: {
      slug: "farmacia-central-valencia",
      name: "Farmacia Central",
      logo_url: null,
      address: "Av. Bolívar Norte",
      city: { slug: "valencia", name: "Valencia" },
      latitude: 10.18,
      longitude: -68,
      phone: null,
      whatsapp: null,
      is_premium: false,
      accepts_orders: true,
    },
    is_open: true,
    accepts_orders: true,
    offers_delivery: false,
    lines,
    subtotal_usd: "5.00",
    subtotal_ves: "182.50",
    ...overrides,
  };
}

function cart(stores: CartStore[]): Cart {
  return { stores, total_usd: "7.40", total_ves: "270.10", line_count: 1, rate };
}

describe("CartContent", () => {
  it.each([
    ["null", null],
    ["sin tiendas", { stores: [], total_usd: "0.00", total_ves: "0.00", line_count: 0, rate }],
  ])("vacío (%s) invita a buscar", (_name, value) => {
    render(<CartContent cart={value} />);

    expect(screen.getByText("Tu carrito está vacío.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Buscar productos" }).getAttribute("href")).toBe("/buscar");
  });

  it("pinta las cadenas del carrito formateadas, sin calcular", () => {
    render(<CartContent cart={cart([store([line()])])} />);

    expect(screen.getByText("$ 2,50 · Bs 91,25 c/u")).toBeTruthy();
    expect(screen.getByText("$ 5,00")).toBeTruthy();
    expect(screen.getByText("$ 7,40")).toBeTruthy();
    expect(screen.getByText("Bs 270,10")).toBeTruthy();
    expect(screen.getByText("Tasa BCV del 26/09/2026: Bs 36,50")).toBeTruthy();
  });

  it("una línea no disponible muestra su motivo, sólo Quitar, y sin precio si sus montos son nulos", () => {
    const gone = line({
      product: { slug: "jarabe-para-la-tos-120-ml", name: "Jarabe para la tos", image_url: null, category: null },
      price_usd: null,
      price_ves: null,
      line_usd: null,
      line_ves: null,
      availability: null,
      status: "unavailable",
      unavailable_reason: "offer_gone",
    });
    render(<CartContent cart={cart([store([gone])])} />);

    const item = screen.getByRole("listitem");
    expect(within(item).getByText("Ya no se ofrece en esta tienda")).toBeTruthy();
    expect(within(item).queryByRole("button", { name: /^Quitar uno/ })).toBeNull();
    expect(within(item).queryByRole("button", { name: /^Agregar uno/ })).toBeNull();
    expect(within(item).getByRole("button", { name: "Quitar: Jarabe para la tos" })).toBeTruthy();
    expect(within(item).queryByText(/c\/u/)).toBeNull();
  });

  it("Quitar uno se deshabilita en 1 y Agregar uno en 99", () => {
    render(<CartContent cart={cart([store([line({ quantity: 1 })])])} />);
    expect((screen.getByRole("button", { name: "Quitar uno: Acetaminofén 500 mg" }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();

    render(<CartContent cart={cart([store([line({ quantity: 99 })])])} />);
    expect((screen.getByRole("button", { name: "Agregar uno: Acetaminofén 500 mg" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("una tienda cerrada lo indica", () => {
    render(<CartContent cart={cart([store([line()], { is_open: false })])} />);

    expect(screen.getByText("Cerrada ahora")).toBeTruthy();
  });
});
