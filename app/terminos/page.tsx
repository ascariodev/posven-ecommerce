import { LegalDocument } from "@/features/site/components/LegalDocument";
import { legalMetadata } from "@/features/site/lib/legal";
import { termsDocument } from "@/features/site/lib/terms";

export const metadata = legalMetadata({
  title: "Términos de uso",
  description: "Condiciones para buscar productos y comprar a los comercios a través del sitio.",
  path: "/terminos",
});

export default function TermsPage() {
  return <LegalDocument document={termsDocument} />;
}
