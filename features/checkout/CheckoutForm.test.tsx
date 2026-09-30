import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeliveryUnavailableReason } from "@/lib/marketplace/schemas";
import { payCheckout } from "./actions";
import { CheckoutForm } from "./CheckoutForm";
import { ABASTO, CENTRAL, cartStore, quote, quoteStore } from "./testQuote";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("./actions", () => ({ payCheckout: vi.fn() }));

afterEach(() => {
  cleanup();
  replace.mockReset();
  vi.mocked(payCheckout).mockReset();
});

const stores = [cartStore(CENTRAL, "Farmacia Central"), cartStore(ABASTO, "Abasto La Esquina")];

function renderForm(overrides: Partial<Parameters<typeof CheckoutForm>[0]> = {}) {
  return render(
    <CheckoutForm
      quote={quote([quoteStore(), quoteStore({ store_slug: ABASTO })])}
      stores={stores}
      addresses={[]}
      addressId={null}
      verified
      idempotencyKey="3f1c2a9e-8b7d-4c6a-9e2f-1a2b3c4d5e6f"
      {...overrides}
    />,
  );
}

function hiddenValue(container: HTMLElement, name: string): string | null {
  return container.querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`)?.value ?? null;
}

describe("CheckoutForm", () => {
  // 5,10 + 5,10 ≠ 7,00 y 255,55 ≠ 255,60: si el formulario sumara o convirtiera, no aparecerían.
  it("pinta las cadenas de la Quote formateadas, sin calcular", () => {
    renderForm({
      quote: quote([quoteStore({ fulfillment: "delivery", delivery_fee_usd: "1.70", delivery_fee_ves: "62.05" }), quoteStore({ store_slug: ABASTO })]),
    });

    expect(screen.getByText("$ 7,00")).toBeTruthy();
    expect(screen.getByText("Bs 255,55")).toBeTruthy();
    expect(screen.getByText("Se cobrará Bs 255,60")).toBeTruthy();
    expect(screen.getByText("$ 1,70 · Bs 62,05")).toBeTruthy();
    expect(screen.getAllByText("$ 5,10 · Bs 186,15")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Pagar Bs 255,60" })).toBeTruthy();
  });

  it.each<[DeliveryUnavailableReason, string]>([
    ["no_delivery", "Esta tienda no hace entregas."],
    ["out_of_radius", "Tu dirección está fuera de su zona de entrega."],
    ["no_address", "Agrega una dirección para pedir entrega."],
  ])("con %s deshabilita la entrega y dice por qué", (reason, text) => {
    renderForm({
      quote: quote([quoteStore({ delivery_available: false, delivery_unavailable_reason: reason })]),
    });

    const group = screen.getByRole("radiogroup", { name: "Entrega en Farmacia Central" });
    const delivery = within(group).getByRole("radio", { name: "Entrega a domicilio" });
    expect((delivery as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(text).id).toBe(delivery.getAttribute("aria-describedby"));
  });

  it("sin direcciones ofrece agregar una y volver al checkout", () => {
    renderForm();

    expect(screen.getByRole("link", { name: "Agregar dirección" }).getAttribute("href")).toBe(
      "/cuenta/direcciones?volver=/checkout",
    );
  });

  it("elegir entrega vuelve a cotizar por la URL, sin mover el scroll", () => {
    renderForm({
      addresses: [
        {
          id: 2,
          label: "Oficina",
          recipient_name: "Comprador",
          phone: "+584141234569",
          city: { slug: "valencia", name: "Valencia" },
          line: "Av. Bolívar Norte",
          reference: null,
          lat: 10.17,
          lng: -68,
          is_default: true,
        },
      ],
      addressId: 2,
    });

    const group = screen.getByRole("radiogroup", { name: "Entrega en Farmacia Central" });
    fireEvent.click(within(group).getByRole("radio", { name: "Entrega a domicilio" }));

    expect(replace).toHaveBeenCalledWith(`/checkout?direccion=2&f-${CENTRAL}=delivery`, { scroll: false });
  });

  it("los campos ocultos llevan lo de la Quote vigente", () => {
    const { container } = renderForm({ quote: quote([quoteStore({ fulfillment: "delivery" })], { quote_hash: "hash-9" }), addressId: 2 });

    expect(hiddenValue(container, "quote_hash")).toBe("hash-9");
    expect(hiddenValue(container, "address_id")).toBe("2");
    expect(hiddenValue(container, `f-${CENTRAL}`)).toBe("delivery");
    expect(hiddenValue(container, "idempotency_key")).toBe("3f1c2a9e-8b7d-4c6a-9e2f-1a2b3c4d5e6f");
  });

  it("tras quote_changed muestra la Quote nueva y marca sólo la tienda que cambió", async () => {
    const changed = quote([quoteStore({ total_usd: "5.90" }), quoteStore({ store_slug: ABASTO })], {
      quote_hash: "hash-2",
      total_usd: "7.80",
    });
    vi.mocked(payCheckout).mockResolvedValue({
      status: "quote_changed",
      message: "Tu compra cambió. Revisa los precios y la entrega.",
      quote: changed,
    });
    const { container } = renderForm();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Pagar Bs 255,60" }));
    });

    expect(screen.getByRole("alert").textContent).toBe("Tu compra cambió. Revisa los precios y la entrega.");
    expect(screen.getByText("$ 7,80")).toBeTruthy();
    expect(hiddenValue(container, "quote_hash")).toBe("hash-2");
    const [central, abasto] = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.parentElement as HTMLElement);
    expect(within(central).queryByText("Cambió")).toBeTruthy();
    expect(within(abasto).queryByText("Cambió")).toBeNull();
  });

  it("sin el correo verificado no ofrece pagar", () => {
    renderForm({ verified: false });

    expect(screen.queryByRole("button", { name: /^Pagar/ })).toBeNull();
  });
});
