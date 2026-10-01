import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  LEGAL_DRAFT,
  LEGAL_MARKERS,
  LEGAL_PATHS,
  legalMetadata,
  legalSitemapPaths,
  legalText,
} from "./legal";
import { LegalDocument } from "./LegalDocument";
import { termsDocument } from "./terms";

afterEach(cleanup);

const registered = [termsDocument];

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

describe("LegalDocument", () => {
  it("pinta el título, las secciones y el aviso sólo en borrador", () => {
    render(<LegalDocument document={termsDocument} />);
    expect(screen.getByRole("heading", { level: 1, name: "Términos de uso" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(termsDocument.sections.length);
    expect(screen.queryByRole("note") !== null).toBe(LEGAL_DRAFT);
  });
});
