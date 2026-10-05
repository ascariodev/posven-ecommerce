import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Cart, CartLine, CartStore } from "@/lib/marketplace/schemas";
import { CartContent, CartView } from "@/features/cart/components/CartView";
import { accountContext } from "@/features/account/server/session";
import { getCurrentCart } from "@/features/cart/server/cart";

vi.mock("@/features/cart/server/actions", () => ({ setQuantity: vi.fn(), removeLine: vi.fn() }));
vi.mock("@/features/cart/server/cart", () => ({ getCurrentCart: vi.fn() }));
vi.mock("@/features/account/server/session", () => ({ accountContext: vi.fn() }));

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
    line_usd: "5.10",
    line_ves: "186.15",
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
    subtotal_usd: "6.20",
    subtotal_ves: "226.30",
    ...overrides,
  };
}

function cart(stores: CartStore[]): Cart {
  return { stores, total_usd: "7.40", total_ves: "270.10", line_count: 1, rate };
}

// El resumen de escritorio y la barra de móvil llevan cada uno su enlace de pago.
function payLinks(name: string): (string | null)[] {
  return screen.getAllByRole("link", { name }).map((link) => link.getAttribute("href"));
}

function both(href: string): string[] {
  return [href, href];
}

function deliveryStore(overrides: Partial<CartStore> = {}): CartStore {
  return store([line()], {
    offers_delivery: true,
    fulfillment: "pickup",
    delivery_fee_usd: "1.50",
    delivery_fee_ves: "54.75",
    total_usd: "6.20",
    total_ves: "226.30",
    ...overrides,
  });
}

describe("CartContent", () => {
  it.each([
    ["null", null],
    ["sin tiendas", { stores: [], total_usd: "0.00", total_ves: "0.00", line_count: 0, rate }],
  ])("vacío (%s) invita a buscar", (_name, value) => {
    render(<CartContent signedIn cart={value} />);

    expect(screen.getByText("Tu carrito está vacío.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Buscar productos" }).getAttribute("href")).toBe("/buscar");
  });

  // Montos que no salen de multiplicar ni sumar (2,50 × 2 ≠ 5,10; 5,10 ≠ 6,20 ≠ 7,40): si el
  // componente calculara algo, estas cadenas no aparecerían.
  it("pinta las cadenas del carrito formateadas, sin calcular", () => {
    render(<CartContent signedIn cart={cart([store([line()])])} />);

    expect(screen.getByText("$ 2,50 · Bs 91,25 c/u")).toBeTruthy();
    expect(screen.getByText("$ 5,10")).toBeTruthy();
    expect(screen.getAllByText("$ 6,20 · Bs 226,30")).toHaveLength(2);
    for (const container of [screen.getByTestId("cart-summary"), screen.getByTestId("cart-pay-bar")]) {
      expect(within(container).getByText("$ 7,40")).toBeTruthy();
      expect(within(container).getByText("Bs 270,10")).toBeTruthy();
    }
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
    render(<CartContent signedIn cart={cart([store([line(), gone])])} />);

    const [okItem, item] = screen.getAllByRole("listitem");
    const quantity = within(okItem).getByRole("group", { name: "Cantidad de Acetaminofén 500 mg" });
    expect(quantity.textContent).toContain("Cantidad: 2");
    expect(within(item).getByText("Ya no se ofrece en esta tienda")).toBeTruthy();
    expect(within(item).queryByRole("button", { name: /^Quitar uno/ })).toBeNull();
    expect(within(item).queryByRole("button", { name: /^Agregar uno/ })).toBeNull();
    expect(within(item).getByRole("button", { name: "Quitar: Jarabe para la tos" })).toBeTruthy();
    expect(within(item).queryByText(/c\/u/)).toBeNull();
  });

  it("Quitar uno se deshabilita en 1 y Agregar uno en 99", () => {
    render(<CartContent signedIn cart={cart([store([line({ quantity: 1 })])])} />);
    expect((screen.getByRole("button", { name: "Quitar uno: Acetaminofén 500 mg" }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();

    render(<CartContent signedIn cart={cart([store([line({ quantity: 99 })])])} />);
    expect((screen.getByRole("button", { name: "Agregar uno: Acetaminofén 500 mg" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("con sesión ofrece Ir a pagar; sin ella, Entra para pagar hacia el checkout", () => {
    render(<CartContent signedIn cart={cart([store([line()])])} />);
    expect(payLinks("Ir a pagar")).toEqual(both("/checkout"));
    cleanup();

    render(<CartContent signedIn={false} cart={cart([store([line()])])} />);
    expect(payLinks("Entra para pagar")).toEqual(both("/entrar?volver=%2Fcheckout"));
  });

  it("Ir a pagar lleva la entrega elegida y Entra para pagar la conserva en volver", () => {
    const delivery = ["farmacia-central-valencia"];
    render(<CartContent signedIn delivery={delivery} cart={cart([store([line()])])} />);
    expect(payLinks("Ir a pagar")).toEqual(both("/checkout?f-farmacia-central-valencia=delivery"));
    cleanup();

    render(<CartContent signedIn={false} delivery={delivery} cart={cart([store([line()])])} />);
    expect(payLinks("Entra para pagar")).toEqual(both(
      `/entrar?volver=${encodeURIComponent("/checkout?f-farmacia-central-valencia=delivery")}`,
    ));
  });

  it("sin líneas disponibles no ofrece pagar", () => {
    const unavailable = store([line({ status: "unavailable", unavailable_reason: "offer_gone" })]);
    render(<CartContent signedIn cart={{ ...cart([unavailable]), line_count: 0 }} />);
    expect(screen.queryByRole("link", { name: "Ir a pagar" })).toBeNull();
  });

  it("una tienda cerrada lo indica", () => {
    render(<CartContent signedIn cart={cart([store([line()], { is_open: false })])} />);

    expect(screen.getByText("Cerrada ahora")).toBeTruthy();
  });
});

describe("retiro o entrega por tienda", () => {
  it("ofrece Retiro y Entrega con la tarifa como enlaces que cambian la URL", () => {
    render(<CartContent signedIn cart={cart([deliveryStore()])} />);

    const switcher = screen.getByRole("navigation", { name: "Cómo recibir lo de Farmacia Central" });
    const pickup = within(switcher).getByRole("link", { name: "Retiro" });
    const delivery = within(switcher).getByRole("link", { name: "Entrega · $ 1,50" });
    expect(pickup.getAttribute("href")).toBe("/carrito");
    expect(pickup.getAttribute("aria-current")).toBe("true");
    expect(delivery.getAttribute("href")).toBe("/carrito?f-farmacia-central-valencia=delivery");
    expect(delivery.getAttribute("aria-current")).toBeNull();
  });

  it("con entrega elegida marca Entrega, conserva las otras tiendas y desglosa la tarifa y el total de la API", () => {
    const other = store([line({ product: { slug: "harina", name: "Harina", image_url: null, category: null } })], {
      store: { ...store([]).store, slug: "abasto-la-esquina", name: "Abasto La Esquina" },
    });
    render(
      <CartContent
        signedIn
        delivery={["farmacia-central-valencia", "abasto-la-esquina"]}
        cart={cart([deliveryStore({ fulfillment: "delivery", total_usd: "9.99", total_ves: "364.64" }), other])}
      />,
    );

    const switcher = screen.getByRole("navigation", { name: "Cómo recibir lo de Farmacia Central" });
    const delivery = within(switcher).getByRole("link", { name: "Entrega · $ 1,50" });
    expect(delivery.getAttribute("aria-current")).toBe("true");
    expect(within(switcher).getByRole("link", { name: "Retiro" }).getAttribute("href")).toBe(
      "/carrito?f-abasto-la-esquina=delivery",
    );
    expect(screen.getByText("Entrega a domicilio")).toBeTruthy();
    expect(screen.getByText("$ 1,50 · Bs 54,75")).toBeTruthy();
    expect(screen.getByText("$ 9,99 · Bs 364,64")).toBeTruthy();
  });

  it("sin tarifa de entrega, Retiro sin costo y sin enlaces", () => {
    render(<CartContent signedIn cart={cart([store([line()], { offers_delivery: false, delivery_fee_usd: null, delivery_fee_ves: null })])} />);

    expect(screen.getByText("Retiro sin costo")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: /Cómo recibir/ })).toBeNull();
    expect(screen.getByText("Retiro en tienda")).toBeTruthy();
  });

  it("el resumen y la barra móvil muestran el total del carrito", () => {
    render(<CartContent signedIn cart={cart([store([line()])])} />);

    expect(screen.getByRole("heading", { name: "Resumen" })).toBeTruthy();
    expect(within(screen.getByTestId("cart-pay-bar")).getByText("$ 7,40")).toBeTruthy();
  });
});

describe("CartView", () => {
  it("/carrito?f-<tienda>=delivery pide el carrito con esa tienda y la lleva al checkout", async () => {
    vi.mocked(accountContext).mockResolvedValue({ session: "7|token", clientIp: null });
    vi.mocked(getCurrentCart).mockResolvedValue(cart([store([line()])]));
    render(await CartView({ searchParams: Promise.resolve({ "f-farmacia-central-valencia": "delivery" }) }));
    expect(getCurrentCart).toHaveBeenCalledWith("farmacia-central-valencia");
    expect(payLinks("Ir a pagar")).toEqual(both("/checkout?f-farmacia-central-valencia=delivery"));
  });
});
