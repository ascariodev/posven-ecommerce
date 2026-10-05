import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site";

type ContactPurpose = "merchant" | "support";

const COPY: Record<
  ContactPurpose,
  { id: string; title: string; text: string; message: string; section: string; secondary: string }
> = {
  merchant: {
    id: "comercios-contacto",
    title: "Escríbenos",
    text: "Cuéntanos de tu tienda y te explicamos cómo publicar tu catálogo.",
    message: `Hola, quiero que mi comercio aparezca en ${SITE_NAME}`,
    section: "rounded-lg border border-border bg-card p-6",
    secondary: "",
  },
  support: {
    id: "ayuda-contacto",
    title: "¿No encontraste la respuesta?",
    text: "Escríbenos y te respondemos.",
    message: `Hola, necesito ayuda con mi compra en ${SITE_NAME}`,
    section: "rounded-3xl bg-ink p-6 text-ink-foreground md:p-10",
    secondary: "border-ink-foreground/30 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground",
  },
};

export function merchantContactHref(
  whatsapp: string | null,
  email: string | null,
  purpose: ContactPurpose = "merchant",
): string | null {
  if (whatsapp !== null) return `https://wa.me/${whatsapp}?text=${encodeURIComponent(COPY[purpose].message)}`;
  if (email !== null) return `mailto:${email}`;
  return null;
}

export function MerchantContact({
  whatsapp,
  email,
  purpose = "merchant",
}: {
  whatsapp: string | null;
  email: string | null;
  purpose?: ContactPurpose;
}) {
  if (whatsapp === null && email === null) return null;
  const copy = COPY[purpose];
  const message = encodeURIComponent(copy.message);
  return (
    <section aria-labelledby={copy.id} className={copy.section}>
      <h2 id={copy.id} className="text-xl font-semibold">
        {copy.title}
      </h2>
      <p className={cn("mt-2", purpose === "merchant" && "text-muted-foreground")}>{copy.text}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {whatsapp !== null && (
          <a href={`https://wa.me/${whatsapp}?text=${message}`} className={buttonVariants()}>
            Escribir por WhatsApp
          </a>
        )}
        {email !== null && (
          <a href={`mailto:${email}`} className={cn(buttonVariants({ variant: "outline" }), copy.secondary)}>
            {email}
          </a>
        )}
      </div>
    </section>
  );
}
