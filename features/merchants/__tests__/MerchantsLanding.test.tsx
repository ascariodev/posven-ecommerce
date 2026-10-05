import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MerchantsLanding } from "@/features/merchants/components/MerchantsLanding";
import { MERCHANT_QUESTIONS } from "@/features/merchants/lib/content";

afterEach(cleanup);

describe("MerchantsLanding", () => {
  it("pinta el héroe, la tarjeta de ejemplo con montos de lib/format, los pasos y las preguntas", () => {
    render(<MerchantsLanding whatsapp={null} email={null} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("compradores de tu zona");
    expect(screen.getByText("$ 1,35")).toBeTruthy();
    expect(screen.getByText(/a 800 m/)).toBeTruthy();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByRole("group")).toHaveLength(MERCHANT_QUESTIONS.length);
  });

  it("sin destino de contacto no muestra ningún CTA ni la banda final (RN-MERCHANTS-03)", () => {
    render(<MerchantsLanding whatsapp={null} email={null} />);
    expect(screen.queryByRole("link", { name: "Quiero aparecer" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "¿Listo para que te encuentren?" })).toBeNull();
  });

  it("con WhatsApp los dos CTA van a wa.me con el mensaje de alta", () => {
    render(<MerchantsLanding whatsapp="584121234567" email="hola@ejemplo.com" />);
    const links = screen.getAllByRole("link", { name: "Quiero aparecer" });
    expect(links).toHaveLength(2);
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href).toMatch(/^https:\/\/wa\.me\/584121234567\?text=/);
      expect(decodeURIComponent(href)).toContain("quiero que mi comercio aparezca");
    }
  });

  it("sin WhatsApp usa el correo", () => {
    render(<MerchantsLanding whatsapp={null} email="hola@ejemplo.com" />);
    for (const link of screen.getAllByRole("link", { name: "Quiero aparecer" })) {
      expect(link.getAttribute("href")).toBe("mailto:hola@ejemplo.com");
    }
  });
});
