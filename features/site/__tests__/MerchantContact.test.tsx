import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MerchantContact } from "@/features/site/components/MerchantContact";

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
