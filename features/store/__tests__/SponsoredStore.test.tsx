import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { NearbyStore } from "@/lib/marketplace/schemas";
import { SponsoredStore } from "../components/SponsoredStore";

function store(overrides: Partial<NearbyStore> = {}): NearbyStore {
  return {
    slug: "farmacia-santa-ana",
    name: "Farmacia Santa Ana",
    logo_url: null,
    address: "Av. Bolívar Norte",
    city: { slug: "valencia", name: "Valencia" },
    latitude: 10.18,
    longitude: -68.0,
    phone: null,
    whatsapp: null,
    is_premium: false,
    accepts_orders: false,
    distance_km: 1.2,
    outside_radius: false,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("SponsoredStore", () => {
  it("es un enlace a la tienda con PATROCINADO y Ver tienda sin botón anidado", () => {
    const { container } = render(<SponsoredStore store={store()} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/tienda/farmacia-santa-ana");
    expect(screen.getByText("PATROCINADO")).toBeTruthy();
    expect(screen.getByText("Farmacia Santa Ana")).toBeTruthy();
    expect(screen.getByText("Ver tienda")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector("a button, a a")).toBeNull();
  });

  it("sin is_open no muestra estado de abierto ni cerrado", () => {
    render(<SponsoredStore store={store()} />);
    expect(screen.queryByText(/Abierto/)).toBeNull();
    expect(screen.queryByText("Cerrado")).toBeNull();
  });

  it("con outside_radius no muestra Fuera de tu zona", () => {
    render(<SponsoredStore store={store({ outside_radius: true })} />);
    expect(screen.queryByText("Fuera de tu zona")).toBeNull();
  });

  it("el sello Aliado PosVen sale sólo si la tienda es premium", () => {
    const { rerender } = render(<SponsoredStore store={store({ is_premium: false })} />);
    expect(screen.queryByText("Aliado PosVen")).toBeNull();
    rerender(<SponsoredStore store={store({ is_premium: true })} />);
    expect(screen.getByText("Aliado PosVen")).toBeTruthy();
  });
});
