import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site";

type ContactPurpose = "merchant" | "support";

const MESSAGES: Record<ContactPurpose, string> = {
  merchant: `Hola, quiero que mi comercio aparezca en ${SITE_NAME}`,
  support: `Hola, necesito ayuda con mi compra en ${SITE_NAME}`,
};

const SUPPORT_SECONDARY =
  "border-ink-foreground/30 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground";

export function merchantContactHref(
  whatsapp: string | null,
  email: string | null,
  purpose: ContactPurpose = "merchant",
): string | null {
  if (whatsapp !== null) return `https://wa.me/${whatsapp}?text=${encodeURIComponent(MESSAGES[purpose])}`;
  if (email !== null) return `mailto:${email}`;
  return null;
}

export function MerchantContact({ whatsapp, email }: { whatsapp: string | null; email: string | null }) {
  if (whatsapp === null && email === null) return null;
  return (
    <section aria-labelledby="ayuda-contacto" className="rounded-3xl bg-ink p-6 text-ink-foreground md:p-10">
      <h2 id="ayuda-contacto" className="text-xl font-semibold">
        ¿No encontraste la respuesta?
      </h2>
      <p className="mt-2">Escríbenos y te respondemos.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {whatsapp !== null && (
          <a href={merchantContactHref(whatsapp, null, "support") ?? undefined} className={buttonVariants()}>
            Escribir por WhatsApp
          </a>
        )}
        {email !== null && (
          <a href={`mailto:${email}`} className={cn(buttonVariants({ variant: "outline" }), SUPPORT_SECONDARY)}>
            {email}
          </a>
        )}
      </div>
    </section>
  );
}
