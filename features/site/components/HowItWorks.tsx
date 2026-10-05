import { MapPin, PackageCheck, Search, Scale } from "lucide-react";

const steps = [
  { icon: Search, title: "Busca", text: "Escribe el producto o la marca que necesitas." },
  { icon: Scale, title: "Compara", text: "Mira precios en $ y Bs de las tiendas de tu zona." },
  { icon: MapPin, title: "Elige tu tienda", text: "Escoge la más cercana o la de mejor precio." },
  { icon: PackageCheck, title: "Retira o recibe", text: "Retira hoy o pide la entrega a tu casa." },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="flex flex-col gap-4 rounded-3xl bg-ink p-6 text-ink-foreground sm:p-8">
      <h2 id="how-title" className="font-heading text-xl font-semibold tracking-tight">
        Así de fácil comprar cerca de ti
      </h2>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/50 bg-primary/15 text-primary"
            >
              <Icon className="size-5" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-heading text-sm font-semibold">
                {index + 1}. {title}
              </span>
              <span className="text-sm opacity-80">{text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
