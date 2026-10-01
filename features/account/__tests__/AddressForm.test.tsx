import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Address } from "@/lib/marketplace/schemas";
import { saveAddress } from "../accountActions";
import { AddressForm } from "../components/AddressForm";

vi.mock("../accountActions", () => ({ saveAddress: vi.fn() }));

const cities = [
  { slug: "valencia", name: "Valencia", state: "Carabobo" },
  { slug: "naguanagua", name: "Naguanagua", state: "Carabobo" },
  { slug: "caracas", name: "Caracas", state: "Distrito Capital" },
];

const address: Address = {
  id: 7,
  label: "Casa",
  recipient_name: "Ana Pérez",
  phone: "04141234567",
  city: { slug: "valencia", name: "Valencia" },
  line: "Calle 1",
  reference: null,
  lat: 10.162,
  lng: -68.007,
  is_default: true,
};

const elementPrototype = Element.prototype as Partial<
  Pick<Element, "hasPointerCapture" | "releasePointerCapture" | "scrollIntoView">
>;
const originalHasPointerCapture = elementPrototype.hasPointerCapture;
const originalReleasePointerCapture = elementPrototype.releasePointerCapture;
const originalScrollIntoView = elementPrototype.scrollIntoView;

function restore<K extends keyof typeof elementPrototype>(key: K, original: (typeof elementPrototype)[K]) {
  if (original === undefined) Reflect.deleteProperty(elementPrototype, key);
  else elementPrototype[key] = original;
}

beforeEach(() => {
  elementPrototype.hasPointerCapture = () => false;
  elementPrototype.releasePointerCapture = () => undefined;
  elementPrototype.scrollIntoView = () => undefined;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  restore("hasPointerCapture", originalHasPointerCapture);
  restore("releasePointerCapture", originalReleasePointerCapture);
  restore("scrollIntoView", originalScrollIntoView);
});

function citySelect(container: HTMLElement): HTMLSelectElement {
  const select = container.querySelector<HTMLSelectElement>('select[name="city_slug"]');
  if (select === null) throw new Error("falta el select de city_slug");
  return select;
}

describe("AddressForm", () => {
  it("sin dirección, Ciudad muestra Elige tu ciudad", () => {
    render(<AddressForm address={null} cities={cities} />);

    expect(screen.getByRole("combobox", { name: "Ciudad" }).textContent).toContain("Elige tu ciudad");
  });

  it("con una dirección, Ciudad muestra su ciudad y el formulario lleva su slug", async () => {
    const { container } = render(<AddressForm address={address} cities={cities} />);

    expect(screen.getByRole("combobox", { name: "Ciudad" }).textContent).toContain("Valencia");
    await waitFor(() => expect(citySelect(container).value).toBe("valencia"));
  });

  it("al abrir Ciudad los estados agrupan sus ciudades", () => {
    render(<AddressForm address={null} cities={cities} />);

    fireEvent.click(screen.getByRole("combobox", { name: "Ciudad" }));

    const groups = screen.getAllByRole("group");
    expect(groups.map((group) => group.textContent)).toEqual([
      "CaraboboValenciaNaguanagua",
      "Distrito CapitalCaracas",
    ]);
    expect(screen.getByRole("group", { name: "Carabobo" })).toBe(groups[0]);
    expect(screen.getByRole("group", { name: "Distrito Capital" })).toBe(groups[1]);
  });

  it("tras un envío con error conserva la ciudad elegida", async () => {
    vi.mocked(saveAddress).mockResolvedValue({
      status: "error",
      message: "Revisa los datos.",
      fields: { line: "Escribe la dirección." },
      values: { city_slug: "caracas" },
    });
    const { container } = render(<AddressForm address={null} cities={cities} />);

    fireEvent.click(screen.getByRole("combobox", { name: "Ciudad" }));
    fireEvent.click(screen.getByRole("option", { name: "Caracas" }));
    const form = container.querySelector("form");
    if (form === null) throw new Error("falta el formulario");
    fireEvent.submit(form);

    await screen.findByText("Escribe la dirección.");
    await waitFor(() => expect(citySelect(container).value).toBe("caracas"));
    expect(screen.getByRole("combobox", { name: "Ciudad" }).textContent).toContain("Caracas");
    expect(vi.mocked(saveAddress).mock.calls[0][1].get("city_slug")).toBe("caracas");
  });
});
