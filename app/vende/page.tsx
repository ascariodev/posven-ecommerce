import type { Metadata } from "next";
import { MerchantsLanding } from "@/features/merchants/components/MerchantsLanding";
import { merchantEmail, merchantWhatsapp } from "@/lib/site";

export const metadata: Metadata = {
  title: "Vende con nosotros",
  description:
    "Publica el inventario y los precios de tu tienda y aparece ante quienes buscan productos cerca, con precios en dólares y bolívares.",
  alternates: { canonical: "/vende" },
};

export default function SellPage() {
  return <MerchantsLanding whatsapp={merchantWhatsapp()} email={merchantEmail()} />;
}
