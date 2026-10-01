import type { Metadata } from "next";

export const LEGAL_DRAFT = true;

export const LEGAL_MARKERS = [
  "[RAZÓN SOCIAL]",
  "[RIF]",
  "[DOMICILIO]",
  "[CORREO LEGAL]",
  "[FECHA DE VIGENCIA]",
] as const;

export const LEGAL_PATHS = ["/terminos", "/privacidad"] as const;

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  items?: string[];
};

export type LegalDocumentContent = {
  title: string;
  sections: LegalSection[];
};

export function legalText(document: LegalDocumentContent): string {
  return [
    document.title,
    ...document.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.items ?? []),
    ]),
  ].join("\n");
}

export function legalSitemapPaths(draft: boolean = LEGAL_DRAFT): readonly string[] {
  return draft ? [] : LEGAL_PATHS;
}

export function legalMetadata(
  { title, description, path }: { title: string; description: string; path: string },
  draft: boolean = LEGAL_DRAFT,
): Metadata {
  return draft
    ? { title, description, robots: { index: false, follow: true } }
    : { title, description, alternates: { canonical: path } };
}
