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
  it("muestra la portada si la tienda la trae, premium o no", () => {
    const { container, rerender } = render(<StoreHeader store={store({ is_premium: true, cover_url: COVER })} />);
    expect(coverImages(container)).toHaveLength(1);
    rerender(<StoreHeader store={store({ is_premium: false, cover_url: COVER })} />);
    expect(coverImages(container)).toHaveLength(1);
  });

  it("muestra el logo si la tienda lo trae aunque no sea premium", () => {
    const { container } = render(
      <StoreHeader store={store({ is_premium: false, logo_url: "https://cdn.example.com/logo.png" })} />,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toContain("logo.png");
  });

  it("no muestra la portada si la tienda no la trae", () => {
    const { container } = render(<StoreHeader store={store({ is_premium: true, cover_url: null })} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("muestra Abierta con la hora de cierre que entrega la API", () => {
    render(<StoreHeader store={store({ is_open: true, closes_at: "20:00" })} />);
    expect(screen.getByText("Abierta · hasta 20:00")).toBeTruthy();
  });

  it("muestra Abierta sin hora si la API no trae closes_at", () => {
    render(<StoreHeader store={store({ is_open: true, closes_at: null })} />);
    expect(screen.getByText("Abierta")).toBeTruthy();
  });

  it("muestra Cerrada ahora si la API dice que no está abierta y nada si no informa", () => {
    const closed = render(<StoreHeader store={store({ is_open: false, closes_at: null })} />);
    expect(screen.getByText("Cerrada ahora")).toBeTruthy();
    closed.unmount();
    render(<StoreHeader store={store()} />);
    expect(screen.queryByText(/Abierta|Cerrada/)).toBeNull();
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
