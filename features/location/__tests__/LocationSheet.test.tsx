import { cleanup, render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocationSheet } from "@/features/location/components/LocationSheet";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/features/location/components/LocationPicker", () => ({
  LocationPicker: () => null,
}));

vi.mock("@/features/location/server/actions", () => ({
  loadLocationStates: vi.fn(async () => []),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function renderSheet(kind: "city" | "coords", radio: string | null) {
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams(radio === null ? "" : `radio=${radio}`) as unknown as ReturnType<typeof useSearchParams>,
  );
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  render(<LocationSheet label="Valencia" kind={kind} />);
}

describe("LocationSheet: detalle del radio", () => {
  it("coordenadas sin radio muestran el radio por defecto", () => {
    renderSheet("coords", null);

    expect(screen.getByRole("button", { name: "Buscar cerca de Valencia · 10 km" })).toBeTruthy();
  });

  it("coordenadas con un radio válido lo muestran", () => {
    renderSheet("coords", "25");

    expect(screen.getByRole("button", { name: "Buscar cerca de Valencia · 25 km" })).toBeTruthy();
  });

  it("coordenadas con un radio fuera de las opciones vuelven al por defecto", () => {
    renderSheet("coords", "7");

    expect(screen.getByRole("button", { name: "Buscar cerca de Valencia · 10 km" })).toBeTruthy();
  });

  it("radio=pais muestra Todo el país", () => {
    renderSheet("coords", "pais");

    expect(screen.getByRole("button", { name: "Buscar cerca de Valencia · Todo el país" })).toBeTruthy();
  });

  it("una ciudad sin radio no lleva detalle", () => {
    renderSheet("city", null);

    expect(screen.getByRole("button", { name: "Buscar cerca de Valencia" })).toBeTruthy();
  });

  it("una ciudad con radio=pais muestra Todo el país", () => {
    renderSheet("city", "pais");

    expect(screen.getByRole("button", { name: "Buscar cerca de Valencia · Todo el país" })).toBeTruthy();
  });
});
