import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site";

export function MerchantContact({
  whatsapp,
  email,
}: {
  whatsapp: string | null;
  email: string | null;
}) {
  if (whatsapp === null && email === null) return null;
  const message = encodeURIComponent(`Hola, quiero que mi comercio aparezca en ${SITE_NAME}`);
  return (
    <section aria-labelledby="comercios-contacto" className="rounded-lg border border-border bg-card p-6">
      <h2 id="comercios-contacto" className="text-xl font-semibold text-foreground">
        Escríbenos
      </h2>
      <p className="mt-2 text-muted-foreground">
        Cuéntanos de tu tienda y te explicamos cómo publicar tu catálogo.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {whatsapp !== null && (
          <a href={`https://wa.me/${whatsapp}?text=${message}`} className={buttonVariants()}>
            Escribir por WhatsApp
          </a>
        )}
        {email !== null && (
          <a href={`mailto:${email}`} className={cn(buttonVariants({ variant: "outline" }))}>
            {email}
          </a>
        )}
      </div>
    </section>
  );
}
