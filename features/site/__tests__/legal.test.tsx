import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  LEGAL_DRAFT,
  LEGAL_MARKERS,
  LEGAL_PATHS,
  legalMetadata,
  legalSitemapPaths,
  legalText,
} from "@/features/site/lib/legal";
import { LOCATION_COOKIE } from "@/features/location/lib/cookie";
import { LegalDocument } from "@/features/site/components/LegalDocument";
import { privacyDocument } from "@/features/site/lib/privacy";
import { termsDocument } from "@/features/site/lib/terms";

afterEach(cleanup);

const registered = [termsDocument, privacyDocument];

describe("marcadores legales", () => {
  it("el texto sólo usa los cinco marcadores permitidos", () => {
    for (const document of registered) {
      const found = legalText(document).match(/\[[^\]]+\]/g) ?? [];
      for (const marker of found) expect(LEGAL_MARKERS).toContain(marker);
    }
  });

  it("sin borrador no queda ningún marcador en el texto", () => {
    if (LEGAL_DRAFT) return;
    for (const document of registered) {
      expect(legalText(document)).not.toMatch(/\[[^\]]+\]/);
    }
  });
});

describe("interruptor de borrador", () => {
  it("en borrador: noindex y fuera del sitemap", () => {
    const metadata = legalMetadata({ title: "T", description: "D", path: "/terminos" }, true);
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(legalSitemapPaths(true)).toEqual([]);
  });

  it("sin borrador: canónica propia y dentro del sitemap", () => {
    const metadata = legalMetadata({ title: "T", description: "D", path: "/terminos" }, false);
    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates?.canonical).toBe("/terminos");
    expect(legalSitemapPaths(false)).toEqual(LEGAL_PATHS);
  });
});

describe("privacidad", () => {
  it("nombra las cuatro cookies del sitio y ninguna otra mp_", () => {
    const text = legalText(privacyDocument);
    for (const name of ["mp_session", "mp_cart", LOCATION_COOKIE, "sid"]) {
      expect(text).toContain(`${name}:`);
    }
    expect(new Set(text.match(/mp_[a-z]+/g))).toEqual(new Set(["mp_session", "mp_cart"]));
  });
});

describe("privacidad: búsquedas y carrito", () => {
  it("declara el texto y los resultados de las búsquedas y los agregados al carrito", () => {
    const text = legalText(privacyDocument);
    expect(text).toContain("buscas");
    expect(text).toContain("cantidad de resultados");
    expect(text).toContain("agregas un producto al carrito");
    expect(text).toContain("al registrar las vistas, los contactos, las búsquedas y los agregados al carrito, el sitio reenvía tu dirección IP");
  });
});

describe("LegalDocument", () => {
  it("pinta el título, las secciones y el aviso sólo en borrador", () => {
    render(<LegalDocument document={termsDocument} />);
    expect(screen.getByRole("heading", { level: 1, name: "Términos de uso" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(termsDocument.sections.length);
    expect(screen.queryByRole("note") !== null).toBe(LEGAL_DRAFT);
  });
});
