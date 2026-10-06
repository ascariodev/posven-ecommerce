import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Store } from "@/lib/marketplace/schemas";
import { StoreHeader } from "../components/StoreHeader";

const COVER = "https://cdn.example.com/portada.png";

function store(overrides: Partial<Store> = {}): Store {
  return {
    slug: "farmacia-central-valencia",
    name: "Farmacia Central",
    company_name: "Farmacia Central C.A.",
    logo_url: null,
    cover_url: null,
    address: "Av. Bolívar Norte",
    city: { slug: "valencia", name: "Valencia" },
    latitude: 10.18,
    longitude: -68.0,
    phone: null,
    whatsapp: null,
    is_premium: false,
    accepts_orders: false,
    schedule: [],
    ...overrides,
  };
}

function coverImages(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll("img")).filter((img) =>
    decodeURIComponent(img.getAttribute("src") ?? "").includes("portada.png"),
  );
}

afterEach(() => {
  cleanup();
});

describe("StoreHeader", () => {
  it("muestra la portada si la tienda es premium y la trae", () => {
    const { container } = render(<StoreHeader store={store({ is_premium: true, cover_url: COVER })} />);
    expect(coverImages(container)).toHaveLength(1);
  });

  it("no muestra la portada si la tienda no es premium aunque la traiga", () => {
    const { container } = render(<StoreHeader store={store({ is_premium: false, cover_url: COVER })} />);
    expect(coverImages(container)).toHaveLength(0);
    expect(container.querySelector("img")).toBeNull();
  });

  it("no muestra la portada si la tienda es premium y no la trae", () => {
    const { container } = render(<StoreHeader store={store({ is_premium: true, cover_url: null })} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("pinta los hijos junto a los botones de contacto", () => {
    render(
      <StoreHeader store={store()}>
        <button type="button">Guardar favorito</button>
      </StoreHeader>,
    );
    expect(screen.getByRole("button", { name: "Guardar favorito" })).toBeTruthy();
  });
});
