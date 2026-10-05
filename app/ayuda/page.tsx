import type { Metadata } from "next";
import { HelpCenter } from "@/features/help/components/HelpCenter";
import { MerchantContact } from "@/features/site/components/MerchantContact";
import { merchantEmail, merchantWhatsapp } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ayuda",
  description:
    "Respuestas a las preguntas frecuentes de quienes compran: precios, pagos, retiro o entrega, cuenta y factura.",
  alternates: { canonical: "/ayuda" },
};

export default function HelpPage() {
  const whatsapp = merchantWhatsapp();
  const email = merchantEmail();
  return (
    <div className="flex flex-col gap-10">
      <HelpCenter canContact={whatsapp !== null || email !== null} />
      <MerchantContact purpose="support" whatsapp={whatsapp} email={email} />
    </div>
  );
}
