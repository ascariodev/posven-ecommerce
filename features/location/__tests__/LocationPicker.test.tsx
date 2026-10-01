import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LocationState } from "@/lib/marketplace/schemas";
import { setLocationCity } from "@/features/location/server/actions";
import { LocationPicker } from "@/features/location/components/LocationPicker";

const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

vi.mock("@/features/location/server/actions", () => ({
  setLocationFromCoords: vi.fn(async () => ({ ok: true })),
  setLocationCity: vi.fn(async () => ({ ok: true })),
  clearLocation: vi.fn(async () => undefined),
}));

const states: LocationState[] = [
  {
    slug: "carabobo",
    name: "Carabobo",
    municipalities: [
      { slug: "valencia", name: "Valencia", cities: [{ slug: "valencia", name: "Valencia" }] },
      { slug: "naguanagua", name: "Naguanagua", cities: [{ slug: "naguanagua", name: "Naguanagua" }] },
    ],
  },
  {
    slug: "distrito-capital",
    name: "Distrito Capital",
    municipalities: [{ slug: "libertador", name: "Libertador", cities: [{ slug: "caracas", name: "Caracas" }] }],
  },
];

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
  Reflect.deleteProperty(navigator, "geolocation");
  refresh.mockReset();
  vi.clearAllMocks();
  restore("hasPointerCapture", originalHasPointerCapture);
  restore("releasePointerCapture", originalReleasePointerCapture);
  restore("scrollIntoView", originalScrollIntoView);
});

function choose(field: string, option: string) {
  fireEvent.click(screen.getByRole("combobox", { name: field }));
  fireEvent.click(screen.getByRole("option", { name: option }));
}

describe("LocationPicker", () => {
  it("sin ubicación muestra los dos botones", () => {
    render(<LocationPicker label={null} states={states} />);
    expect(screen.getByRole("button", { name: "Usar mi ubicación" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Elegir ciudad" })).toBeTruthy();
  });

  it("si la geolocalización falla muestra el aviso y el selector de ciudad", () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) =>
          error({ code: 1, message: "denegada" } as GeolocationPositionError),
      },
    });
    render(<LocationPicker label={null} states={states} />);
    fireEvent.click(screen.getByRole("button", { name: "Usar mi ubicación" }));
    expect(screen.getByRole("alert").textContent).toBe("No pudimos obtener tu ubicación. Elige tu ciudad.");
    expect(screen.getByRole("combobox", { name: "Estado" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Municipio" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Ciudad" })).toBeTruthy();
  });

  it("al elegir Carabobo el municipio ofrece sólo Valencia y Naguanagua", () => {
    render(<LocationPicker label={null} states={states} />);
    fireEvent.click(screen.getByRole("button", { name: "Elegir ciudad" }));
    choose("Estado", "Carabobo");
    fireEvent.click(screen.getByRole("combobox", { name: "Municipio" }));
    const municipalityOptions = screen.getAllByRole("option").map((option) => option.textContent);
    expect(municipalityOptions).toEqual(["Valencia", "Naguanagua"]);
  });

  it("llama a onDone tras guardar la ciudad", async () => {
    const onDone = vi.fn();
    render(<LocationPicker label={null} states={states} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: "Elegir ciudad" }));
    choose("Estado", "Carabobo");
    choose("Municipio", "Valencia");
    choose("Ciudad", "Valencia");
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(setLocationCity).toHaveBeenCalledWith("valencia");
  });
});
