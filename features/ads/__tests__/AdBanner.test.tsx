import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sendBeaconEvent } from "@/features/events/lib/beacon";
import type { Piece } from "@/lib/marketplace/schemas";
import { AdBanner } from "../components/AdBanner";

vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));

const IMG = "data:image/png;base64,AA";

function piece(overrides: Partial<Piece> = {}): Piece {
  return {
    kind: "ad",
    format: "banner",
    image_desktop_url: IMG,
    image_mobile_url: IMG,
    alt: "Oferta del mes",
    badge: null,
    title: null,
    cta: null,
    href: "/tiendas",
    external: false,
    advertiser_name: "Farmacia",
    token: "tok-1",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdBanner", () => {
  it("sin pieza o sin imágenes no pinta nada", () => {
    const { container, rerender } = render(<AdBanner piece={null} />);
    expect(container.innerHTML).toBe("");
    rerender(<AdBanner piece={piece({ image_desktop_url: null, image_mobile_url: null })} />);
    expect(container.innerHTML).toBe("");
  });

  it("pinta las dos imágenes con alt y la marca Patrocinado sólo en kind ad", () => {
    const { rerender } = render(<AdBanner piece={piece()} />);
    expect(screen.getAllByAltText("Oferta del mes")).toHaveLength(2);
    expect(screen.getByText("Patrocinado")).toBeTruthy();
    rerender(<AdBanner piece={piece({ kind: "house" })} />);
    expect(screen.queryByText("Patrocinado")).toBeNull();
  });

  it("el clic en un destino interno manda ad_click sin target", () => {
    render(<AdBanner piece={piece()} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/tiendas");
    expect(link.getAttribute("target")).toBeNull();
    fireEvent.click(link);
    expect(sendBeaconEvent).toHaveBeenCalledWith({ type: "ad_click", ad_token: "tok-1" });
  });

  it("un destino externo abre otra pestaña con rel sponsored noopener", () => {
    render(<AdBanner piece={piece({ href: "https://anunciante.example/oferta", external: true })} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("sponsored noopener");
    fireEvent.click(link);
    expect(sendBeaconEvent).toHaveBeenCalledTimes(1);
  });
});
