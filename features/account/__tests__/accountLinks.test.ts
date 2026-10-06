import { describe, expect, it } from "vitest";
import { accountLinks, accountListLinks, accountQuickLinks, isActiveLink } from "../lib/accountLinks";

describe("accountLinks", () => {
  it("ordena el menú como el lienzo: resumen, accesos y lista", () => {
    expect(accountLinks(true).map((link) => link.href)).toEqual([
      "/cuenta",
      "/cuenta/compras",
      "/cuenta/favoritos",
      "/cuenta/direcciones",
      "/cuenta/perfil",
      "/cuenta/configuracion",
      "/ayuda",
    ]);
  });

  it("sin carrito no ofrece Compras", () => {
    expect(accountLinks(false).map((link) => link.href)).not.toContain("/cuenta/compras");
    expect(accountQuickLinks(false).map((link) => link.label)).toEqual(["Favoritos", "Direcciones"]);
  });

  it("los accesos rápidos y la lista no se repiten", () => {
    const quick = accountQuickLinks(true).map((link) => link.href);
    expect(accountListLinks().filter((link) => quick.includes(link.href))).toEqual([]);
  });

  it("Resumen sólo está activo en /cuenta exacto", () => {
    expect(isActiveLink("/cuenta", "/cuenta/perfil")).toBe(false);
    expect(isActiveLink("/cuenta/compras", "/cuenta/compras/PV-1")).toBe(true);
  });
});
