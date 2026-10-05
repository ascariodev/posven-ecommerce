import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getBuyAgain } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { BuyAgainItem } from "@/lib/marketplace/schemas";
import { BuyAgain } from "@/features/purchases/components/BuyAgain";
import { order } from "@/features/purchases/__tests__/fixtures/testPurchase";

vi.mock("@/lib/marketplace/client", () => ({ getBuyAgain: vi.fn() }));
vi.mock("@/features/cart/server/actions", () => ({ addToCart: vi.fn() }));
vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));

const ctx = { session: "7|token", clientIp: null };
const rate = { usd_ves: "36.5000", valid_on: "2026-09-30" };

afterEach(() => {
  cleanup();
  vi.mocked(getBuyAgain).mockReset();
});

function item(overrides: Partial<BuyAgainItem> = {}): BuyAgainItem {
  return {
    product: { slug: "acetaminofen-500-mg-20-tabletas", name: "Acetaminofén 500 mg", image_url: null, category: null },
    store: order().store,
    price_usd: "2.50",
    price_ves: "91.25",
    availability: "available",
    status: "ok",
    unavailable_reason: null,
    last_purchased_at: "2026-09-30T18:00:05Z",
    ...overrides,
  };
}

describe("BuyAgain", () => {
  it("pinta una tarjeta por ítem con tienda, precio de la API y Agregar", async () => {
    vi.mocked(getBuyAgain).mockResolvedValue({ data: [item()], rate });

    render((await BuyAgain({ ctx }))!);

    const list = screen.getByRole("list", { name: "Volver a comprar" });
    expect(within(list).getByRole("link", { name: "Acetaminofén 500 mg" }).getAttribute("href")).toBe(
      "/p/acetaminofen-500-mg-20-tabletas",
    );
    expect(within(list).getByRole("link", { name: "Farmacia Central" }).getAttribute("href")).toBe(
      "/tienda/farmacia-central-valencia",
    );
    expect(within(list).getByText("$ 2,50 · Bs 91,25")).toBeTruthy();
    expect(
      within(list).getByRole("button", { name: "Agregar al carrito: Acetaminofén 500 mg de Farmacia Central" }),
    ).toBeTruthy();
  });

  it("un ítem no disponible va sin botón y con su motivo", async () => {
    vi.mocked(getBuyAgain).mockResolvedValue({
      data: [item({ status: "unavailable", unavailable_reason: "out_of_stock", availability: null })],
      rate,
    });

    render((await BuyAgain({ ctx }))!);

    expect(screen.getByText("Sin existencias")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText(/\$ 2,50/)).toBeNull();
  });

  it("respeta el orden recibido y pinta el mismo producto de dos tiendas sin keys duplicadas", async () => {
    const otherStore = { ...order().store, slug: "farmacia-norte-valencia", name: "Farmacia Norte" };
    const ibuprofeno = { slug: "ibuprofeno-400-mg", name: "Ibuprofeno 400 mg", image_url: null, category: null };
    vi.mocked(getBuyAgain).mockResolvedValue({
      data: [item({ product: ibuprofeno }), item({ store: otherStore }), item()],
      rate,
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render((await BuyAgain({ ctx }))!);

    const rows = within(screen.getByRole("list", { name: "Volver a comprar" })).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByRole("link", { name: "Ibuprofeno 400 mg" })).toBeTruthy();
    expect(within(rows[1]).getByRole("link", { name: "Farmacia Norte" })).toBeTruthy();
    expect(within(rows[2]).getByRole("link", { name: "Farmacia Central" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Acetaminofén 500 mg" })).toHaveLength(2);
    const keyWarnings = consoleError.mock.calls.filter((call) => String(call[0]).includes("same key"));
    consoleError.mockRestore();
    expect(keyWarnings).toHaveLength(0);
  });

  it("no pinta nada sin ítems", async () => {
    vi.mocked(getBuyAgain).mockResolvedValue({ data: [], rate });
    expect(await BuyAgain({ ctx })).toBeNull();
  });

  it.each([
    ["la API caída", new MarketplaceUnavailableError("/me/buy-again")],
    ["un 429", new MarketplaceAccountError({ status: 429, code: "too_many_attempts", message: "Demasiados intentos.", retryAfter: 30 })],
  ])("no pinta nada con %s", async (_name, error) => {
    vi.mocked(getBuyAgain).mockRejectedValue(error);
    expect(await BuyAgain({ ctx })).toBeNull();
  });

  it("un 401 sube", async () => {
    const error = new MarketplaceAccountError({ status: 401, code: "unauthenticated", message: "Sesión vencida." });
    vi.mocked(getBuyAgain).mockRejectedValue(error);
    await expect(BuyAgain({ ctx })).rejects.toBe(error);
  });
});
