import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MerchantContact, merchantContactHref } from "@/features/site/components/MerchantContact";

afterEach(cleanup);

describe("MerchantContact", () => {
  it("sin variables no pinta nada", () => {
    const { container } = render(<MerchantContact whatsapp={null} email={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("pinta sólo el botón de WhatsApp si no hay correo", () => {
    render(<MerchantContact whatsapp="584121234567" email={null} />);
    const link = screen.getByRole("link", { name: /whatsapp/i });
    expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/584121234567\?text=Hola/);
    expect(screen.queryByRole("link", { name: /@/ })).toBeNull();
  });

  it("pinta sólo el correo si no hay WhatsApp", () => {
    render(<MerchantContact whatsapp={null} email="hola@ejemplo.com" />);
    expect(screen.getByRole("link", { name: "hola@ejemplo.com" }).getAttribute("href")).toBe(
      "mailto:hola@ejemplo.com",
    );
    expect(screen.queryByRole("link", { name: /whatsapp/i })).toBeNull();
  });
});

describe("MerchantContact de soporte", () => {
  it("lleva el mensaje de ayuda y la banda oscura", () => {
    const { container } = render(<MerchantContact purpose="support" whatsapp="584121234567" email={null} />);
    const link = screen.getByRole("link", { name: /whatsapp/i });
    expect(decodeURIComponent(link.getAttribute("href") ?? "")).toContain("necesito ayuda");
    expect(screen.getByRole("heading", { name: "¿No encontraste la respuesta?" })).toBeTruthy();
    expect(container.querySelector("section")?.className).toContain("bg-ink");
  });

  it("sin variables no pinta nada", () => {
    const { container } = render(<MerchantContact purpose="support" whatsapp={null} email={null} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("merchantContactHref", () => {
  it("prefiere WhatsApp con el mensaje del propósito, luego el correo y si no, null", () => {
    expect(decodeURIComponent(merchantContactHref("584121234567", "a@b.com") ?? "")).toContain("quiero que mi comercio aparezca");
    expect(decodeURIComponent(merchantContactHref("584121234567", null, "support") ?? "")).toContain("necesito ayuda");
    expect(merchantContactHref(null, "a@b.com")).toBe("mailto:a@b.com");
    expect(merchantContactHref(null, null)).toBeNull();
  });
});
