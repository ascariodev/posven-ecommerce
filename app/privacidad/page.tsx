import { LegalDocument } from "@/features/site/LegalDocument";
import { legalMetadata } from "@/features/site/legal";
import { privacyDocument } from "@/features/site/privacy";

export const metadata = legalMetadata({
  title: "Política de privacidad",
  description: "Qué datos y cookies usa el sitio, para qué y cómo ejercer tus derechos.",
  path: "/privacidad",
});

export default function PrivacyPage() {
  return <LegalDocument document={privacyDocument} />;
}
