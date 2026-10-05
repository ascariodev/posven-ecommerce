import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logout } from "../server/actions";
import { accountListLinks, accountQuickLinks } from "../lib/accountLinks";
import { AccountMenuList, AccountQuickLinks } from "../components/AccountOverviewMenu";

vi.mock("../server/actions", () => ({
  logout: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.mocked(logout).mockReset();
});

describe("AccountQuickLinks", () => {
  it("pinta los accesos con su etiqueta y href, con Compras", () => {
    render(<AccountQuickLinks showPurchases />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(
      accountQuickLinks(true).map((link) => link.label),
    );
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/cuenta/compras",
      "/cuenta/favoritos",
      "/cuenta/direcciones",
    ]);
  });

  it("sin Compras no la ofrece", () => {
    render(<AccountQuickLinks showPurchases={false} />);

    expect(screen.queryByRole("link", { name: "Compras" })).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});

describe("AccountMenuList", () => {
  it("pinta la lista con sus href y Ayuda a /ayuda", () => {
    render(<AccountMenuList />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(
      accountListLinks().map((link) => link.label),
    );
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/cuenta/perfil",
      "/cuenta/configuracion",
      "/ayuda",
    ]);
    expect(screen.getByRole("link", { name: "Ayuda" }).getAttribute("href")).toBe("/ayuda");
  });

  it("Cerrar sesión es un formulario cuya acción es logout", async () => {
    render(<AccountMenuList />);

    const button = screen.getByRole("button", { name: "Cerrar sesión" });
    expect(button.getAttribute("type")).toBe("submit");
    const form = button.closest("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });
});
