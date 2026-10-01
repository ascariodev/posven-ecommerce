import { LegalDocument } from "@/features/site/components/LegalDocument";
import { legalMetadata } from "@/features/site/lib/legal";
import { privacyDocument } from "@/features/site/lib/privacy";

export const metadata = legalMetadata({
  title: "Política de privacidad",
  description: "Qué datos y cookies usa el sitio, para qué y cómo ejercer tus derechos.",
  path: "/privacidad",
});

export default function PrivacyPage() {
  return <LegalDocument document={privacyDocument} />;
}
