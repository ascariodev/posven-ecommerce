import type { Metadata } from "next";
import { MerchantContact } from "@/features/site/components/MerchantContact";
import { merchantEmail, merchantWhatsapp, POS_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Para comercios",
  description:
    "Publica el catálogo de tu tienda y aparece ante quienes buscan productos cerca, con precios en dólares y bolívares.",
  alternates: { canonical: "/comercios" },
};

const steps = [
  {
    title: "Usa el punto de venta",
    text: `Tu tienda registra sus ventas e inventario en la caja de ${POS_NAME}.`,
  },
  {
    title: "Publica tu catálogo",
    text: "Desde la pestaña eCommerce del backoffice eliges qué productos mostrar.",
  },
  {
    title: "Te encuentran",
    text: "Quien busca cerca ve tus productos, te escribe o te compra.",
  },
];

export default function MerchantsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Que tus productos los encuentre quien está cerca
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Los productos de tu tienda aparecen a quien los busca en tu zona, con el precio en dólares
          y en bolívares.
        </p>
      </header>
      <section aria-labelledby="comercios-pasos">
        <h2 id="comercios-pasos" className="text-xl font-semibold text-foreground">
          Cómo funciona
        </h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-lg border border-border bg-card p-4">
              <span className="text-sm font-semibold text-muted-foreground">Paso {index + 1}</span>
              <h3 className="mt-1 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <MerchantContact whatsapp={merchantWhatsapp()} email={merchantEmail()} />
    </div>
  );
}
