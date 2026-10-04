import { LEGAL_DRAFT, type LegalDocumentContent } from "../lib/legal";

export function LegalDocument({ document }: { document: LegalDocumentContent }) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{document.title}</h1>
        {LEGAL_DRAFT ? (
          <p
            role="note"
            className="rounded-lg border border-border bg-card p-4 text-sm font-medium text-foreground"
          >
            Borrador pendiente de revisión legal. Este texto aún no tiene validez.
          </p>
        ) : null}
      </header>
      {document.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
          {section.items ? (
            <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}
