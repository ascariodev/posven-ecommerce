import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { NearbyStore } from "@/lib/marketplace/schemas";
import { StoreCard } from "./StoreCard";

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
    distance_km: 1.2,
    outside_radius: false,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("StoreCard", () => {
  it("toma las iniciales de las dos primeras palabras del nombre", () => {
    render(<StoreCard store={store({ name: "Farmacia Santa Ana" })} />);
    expect(screen.getByText("FS")).toBeTruthy();
  });

  it("premium sin logo muestra las iniciales", () => {
    render(<StoreCard store={store({ is_premium: true, logo_url: null })} />);
    expect(screen.getByText("FS")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("no premium con logo_url muestra las iniciales y no el logo", () => {
    const { container } = render(
      <StoreCard store={store({ is_premium: false, logo_url: "https://cdn.example.com/logo.png" })} />,
    );
    expect(screen.getByText("FS")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("featured muestra Destacado", () => {
    render(<StoreCard store={store()} featured />);
    expect(screen.getByText("Destacado")).toBeTruthy();
  });
});
