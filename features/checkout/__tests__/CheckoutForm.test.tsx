import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Address, DeliveryUnavailableReason } from "@/lib/marketplace/schemas";
import { payCheckout } from "@/features/checkout/server/actions";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
import { ABASTO, CENTRAL, cartStore, quote, quoteStore } from "@/features/checkout/__tests__/fixtures/testQuote";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/features/checkout/server/actions", () => ({ payCheckout: vi.fn() }));
vi.mock("@/features/account/server/actions", () => ({ resendVerificationAction: vi.fn(), verifyEmailAction: vi.fn() }));

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
      hasBilling={false}
      idempotencyKey="3f1c2a9e-8b7d-4c6a-9e2f-1a2b3c4d5e6f"
      {...overrides}
    />,
  );
}

function address(id: number, label: string): Address {
  return {
    id,
    label,
    recipient_name: "Comprador",
    phone: "+584141234569",
    city: { slug: "valencia", name: "Valencia" },
    line: "Av. Bolívar Norte",
    reference: null,
    lat: 10.17,
    lng: -68,
    is_default: id === 2,
  };
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
    expect(screen.getByRole("button", { name: "Pagar Bs 255,60 de forma segura" })).toBeTruthy();
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
    renderForm({ addresses: [address(2, "Oficina")], addressId: 2 });

    const group = screen.getByRole("radiogroup", { name: "Entrega en Farmacia Central" });
    fireEvent.click(within(group).getByRole("radio", { name: "Entrega a domicilio" }));

    expect(replace).toHaveBeenCalledWith(`/checkout?direccion=2&f-${CENTRAL}=delivery`, { scroll: false });
  });

  it("las direcciones son tarjetas de radio y elegir otra vuelve a cotizar con direccion=", () => {
    renderForm({
      quote: quote([quoteStore({ fulfillment: "delivery" }), quoteStore({ store_slug: ABASTO })]),
      addresses: [address(2, "Oficina"), address(5, "Casa")],
      addressId: 2,
    });

    const group = screen.getByRole("radiogroup", { name: "Dirección de entrega" });
    expect((within(group).getByRole("radio", { name: /^Oficina/ }) as HTMLButtonElement).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(within(group).getByRole("radio", { name: /^Casa/ }));

    expect(replace).toHaveBeenCalledWith(`/checkout?direccion=5&f-${CENTRAL}=delivery`, { scroll: false });
    expect(screen.getByRole("link", { name: "Agregar otra dirección" }).getAttribute("href")).toBe("/cuenta/direcciones?volver=/checkout");
  });

  it("el botón de pago va dentro del formulario y en la barra de pago", () => {
    renderForm();

    const pay = screen.getByRole("button", { name: "Pagar Bs 255,60 de forma segura" }) as HTMLButtonElement;
    expect(pay.type).toBe("submit");
    expect(pay.form).not.toBeNull();
    expect(screen.getByTestId("checkout-pay-bar").contains(pay)).toBe(true);
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
      fireEvent.click(screen.getByRole("button", { name: "Pagar Bs 255,60 de forma segura" }));
    });

    expect(screen.getByRole("alert").textContent).toBe("Tu compra cambió. Revisa los precios y la entrega.");
    expect(screen.getByText("$ 7,80")).toBeTruthy();
    expect(hiddenValue(container, "quote_hash")).toBe("hash-2");
    const [central, abasto] = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.parentElement as HTMLElement);
    expect(within(central).queryByText("Cambió")).toBeTruthy();
    expect(within(abasto).queryByText("Cambió")).toBeNull();
  });

  it("tras dos quote_changed seguidos, Cambió compara contra la Quote mostrada justo antes", async () => {
    const first = quote([quoteStore({ total_usd: "5.90" }), quoteStore({ store_slug: ABASTO })], { quote_hash: "hash-2" });
    const second = quote([quoteStore({ total_usd: "5.90" }), quoteStore({ store_slug: ABASTO, total_usd: "1.10" })], {
      quote_hash: "hash-3",
    });
    const changed = (next: typeof first) => ({
      status: "quote_changed" as const,
      message: "Tu compra cambió. Revisa los precios y la entrega.",
      quote: next,
    });
    vi.mocked(payCheckout).mockResolvedValueOnce(changed(first)).mockResolvedValueOnce(changed(second));
    const { container } = renderForm();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Pagar Bs / }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Pagar Bs / }));
    });

    expect(hiddenValue(container, "quote_hash")).toBe("hash-3");
    const [central, abasto] = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.parentElement as HTMLElement);
    expect(within(central).queryByText("Cambió")).toBeNull();
    expect(within(abasto).queryByText("Cambió")).toBeTruthy();
  });

  it("un email_unverified de la acción ofrece reenviar la verificación y deja de ofrecer pagar", async () => {
    vi.mocked(payCheckout).mockResolvedValue({ status: "email_unverified", message: "Verifica tu correo para comprar." });
    renderForm();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Pagar Bs 255,60 de forma segura" }));
    });

    expect(screen.getByRole("alert").textContent).toBe("Verifica tu correo para comprar.");
    expect(screen.getByRole("button", { name: "Reenviar verificación" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Pagar/ })).toBeNull();
  });

  it("con datos de facturación la casilla viene marcada y se envía", () => {
    const { container } = renderForm({ hasBilling: true });

    const box = screen.getByRole("checkbox", { name: "Factura a mi nombre" }) as HTMLInputElement;
    expect(box.checked).toBe(true);
    expect(box.disabled).toBe(false);
    expect(box.name).toBe("bill_to_me");
    expect(container.querySelector('a[href="/cuenta/perfil"]')).toBeNull();
  });

  it("se puede desmarcar la casilla", () => {
    renderForm({ hasBilling: true });

    fireEvent.click(screen.getByRole("checkbox", { name: "Factura a mi nombre" }));

    expect((screen.getByRole("checkbox", { name: "Factura a mi nombre" }) as HTMLInputElement).checked).toBe(false);
  });

  it("sin datos de facturación la casilla está deshabilitada y enlaza al perfil", () => {
    renderForm({ hasBilling: false });

    const box = screen.getByRole("checkbox", { name: "Factura a mi nombre" }) as HTMLInputElement;
    expect(box.checked).toBe(false);
    expect(box.disabled).toBe(true);
    expect(screen.getByRole("link", { name: "Agregar mis datos" }).getAttribute("href")).toBe("/cuenta/perfil");
  });

  it("un billing_incomplete de la acción muestra el aviso con enlace al perfil y deja pagar", async () => {
    vi.mocked(payCheckout).mockResolvedValue({ status: "billing_incomplete", message: "Completa tus datos de facturación." });
    renderForm({ hasBilling: true });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Pagar Bs 255,60 de forma segura" }));
    });

    expect(screen.getByRole("alert").textContent).toContain("Completa tus datos de facturación.");
    expect(screen.getByRole("link", { name: "Completar mis datos" }).getAttribute("href")).toBe("/cuenta/perfil");
    expect(screen.getByRole("button", { name: "Pagar Bs 255,60 de forma segura" })).toBeTruthy();
  });

  it("sin el correo verificado no ofrece pagar", () => {
    renderForm({ verified: false });

    expect(screen.queryByRole("button", { name: /^Pagar/ })).toBeNull();
  });
});
