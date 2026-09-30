import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { Customer } from "@/lib/marketplace/schemas";
import { AccountSlot } from "./AccountMenu";
import { getCurrentCustomer } from "./session";

vi.mock("./session", () => ({
  getCurrentCustomer: vi.fn(),
}));

vi.mock("./actions", () => ({
  logout: vi.fn(),
}));

const customer: Customer = {
  name: "Comprador",
  email: "comprador@posven.test",
  phone: "+584141234567",
  email_verified: true,
  pending_email: null,
  settings: { order_status_emails: true },
};

afterEach(() => {
  cleanup();
  vi.mocked(getCurrentCustomer).mockReset();
});

describe("AccountSlot", () => {
  it("sin comprador muestra el enlace Entrar", async () => {
    vi.mocked(getCurrentCustomer).mockResolvedValue(null);

    render(await AccountSlot());

    expect(screen.getByRole("link", { name: "Entrar" }).getAttribute("href")).toBe("/entrar");
  });

  it("con la API caída muestra Entrar (RN-ACCOUNT-05)", async () => {
    vi.mocked(getCurrentCustomer).mockRejectedValue(new MarketplaceUnavailableError("/me"));

    render(await AccountSlot());

    expect(screen.getByRole("link", { name: "Entrar" })).toBeTruthy();
    expect(screen.queryByText("Mi cuenta")).toBeNull();
  });

  it("con comprador, Mi cuenta abre el menú con sus enlaces y Salir", async () => {
    vi.mocked(getCurrentCustomer).mockResolvedValue(customer);

    render(await AccountSlot());
    fireEvent.keyDown(screen.getByRole("button", { name: "Mi cuenta" }), { key: "Enter" });

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Resumen",
      "Perfil",
      "Direcciones",
      "Favoritos",
      "Configuración",
      "Salir",
    ]);
    expect(items.slice(0, 5).map((item) => item.getAttribute("href"))).toEqual([
      "/cuenta",
      "/cuenta/perfil",
      "/cuenta/direcciones",
      "/cuenta/favoritos",
      "/cuenta/configuracion",
    ]);
  });
});
