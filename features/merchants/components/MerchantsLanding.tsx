import { Boxes, ChevronDown, MapPin, ShoppingBag, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { merchantContactHref } from "@/features/site/components/MerchantContact";
import { POS_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  MERCHANT_BENEFITS,
  MERCHANT_QUESTIONS,
  MERCHANT_STEPS,
  type MerchantBenefitIcon,
} from "../lib/content";
import { ExampleStoreCard } from "./ExampleStoreCard";

const BENEFIT_ICONS: Record<MerchantBenefitIcon, LucideIcon> = {
  nearby: MapPin,
  inventory: Boxes,
  online: ShoppingBag,
};

const HERO_SECONDARY =
  "border-ink-foreground/30 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground";

export function MerchantsLanding({ whatsapp, email }: { whatsapp: string | null; email: string | null }) {
  const contactHref = merchantContactHref(whatsapp, email);
  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <section className="grid grid-cols-[minmax(0,1fr)] items-center gap-8 rounded-3xl bg-ink p-6 text-ink-foreground md:grid-cols-2 md:p-10">
        <div className="flex flex-col items-start gap-4">
          <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
            Para comercios que ya usan {POS_NAME} en caja
          </span>
          <h1 className="font-heading text-3xl leading-tight font-semibold md:text-4xl">
            Tu inventario, visible para los compradores de tu zona
          </h1>
          <p className="opacity-80 md:text-lg">
            Tus productos y precios aparecen en el buscador sin cargarlos de nuevo. Quien busca cerca de ti te
            encuentra, te llama o compra en línea.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {contactHref !== null && (
              <a href={contactHref} className={buttonVariants({ size: "lg" })}>
                Quiero aparecer
              </a>
            )}
            <a href="#como" className={cn(buttonVariants({ variant: "outline", size: "lg" }), HERO_SECONDARY)}>
              Cómo funciona
            </a>
          </div>
        </div>
        <div className="flex justify-center">
          <ExampleStoreCard />
        </div>
      </section>

      <section aria-labelledby="como" className="flex scroll-mt-20 flex-col gap-5">
        <h2 id="como" className="font-heading text-2xl font-semibold md:text-3xl">
          Tres pasos y estás en línea
        </h2>
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
          {MERCHANT_STEPS.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full gap-3 px-5">
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-full bg-primary font-heading font-semibold text-primary-foreground"
                >
                  {index + 1}
                </span>
                <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="beneficios" className="flex flex-col gap-5">
        <h2 id="beneficios" className="font-heading text-2xl font-semibold md:text-3xl">
          Lo que ganas al estar en {POS_NAME}
        </h2>
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-3">
          {MERCHANT_BENEFITS.map((benefit) => {
            const Icon = BENEFIT_ICONS[benefit.icon];
            return (
              <li key={benefit.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="preguntas-comercios" className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <h2 id="preguntas-comercios" className="font-heading text-2xl font-semibold md:text-3xl">
          Preguntas de comercios
        </h2>
        <Card className="gap-0 py-0">
          {MERCHANT_QUESTIONS.map((item) => (
            <details key={item.id} className="group border-b border-border last:border-0">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 font-semibold md:px-6 [&::-webkit-details-marker]:hidden">
                <span className="flex-1">{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-4.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="px-4 pb-4 text-muted-foreground md:px-6">{item.answer}</p>
            </details>
          ))}
        </Card>
      </section>

      {contactHref !== null && (
        <section
          aria-labelledby="vende-contacto"
          className="flex flex-col items-start gap-4 rounded-3xl bg-primary p-6 text-primary-foreground md:flex-row md:items-center md:justify-between md:p-10"
        >
          <div className="flex flex-col gap-1">
            <h2 id="vende-contacto" className="font-heading text-xl font-semibold md:text-2xl">
              ¿Listo para que te encuentren?
            </h2>
            <p>Escríbenos y te explicamos cómo activar tu tienda.</p>
          </div>
          <a
            href={contactHref}
            className={cn(buttonVariants({ size: "lg" }), "w-full bg-ink text-ink-foreground hover:bg-ink/90 md:w-auto")}
          >
            Quiero aparecer
          </a>
        </section>
      )}
    </div>
  );
}
