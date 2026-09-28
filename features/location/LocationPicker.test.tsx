import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LocationState } from "@/lib/marketplace/schemas";
import { LocationPicker } from "./LocationPicker";

const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

vi.mock("./actions", () => ({
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

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, "geolocation");
  refresh.mockReset();
});

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
    expect(screen.getByLabelText("Estado")).toBeTruthy();
    expect(screen.getByLabelText("Municipio")).toBeTruthy();
    expect(screen.getByLabelText("Ciudad")).toBeTruthy();
  });

  it("al elegir Carabobo el municipio ofrece sólo Valencia y Naguanagua", () => {
    render(<LocationPicker label={null} states={states} />);
    fireEvent.click(screen.getByRole("button", { name: "Elegir ciudad" }));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "carabobo" } });
    const municipalityOptions = within(screen.getByLabelText("Municipio"))
      .getAllByRole<HTMLOptionElement>("option")
      .filter((option) => option.value !== "")
      .map((option) => option.textContent);
    expect(municipalityOptions).toEqual(["Valencia", "Naguanagua"]);
  });
});
