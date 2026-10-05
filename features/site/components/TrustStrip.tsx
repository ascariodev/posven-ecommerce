import { PackageCheck, ShieldCheck, Tag, Wallet } from "lucide-react";

const items = [
  { icon: PackageCheck, title: "Retira hoy", text: "En tiendas cerca de ti" },
  { icon: Tag, title: "Mejor precio", text: "Compara antes de comprar" },
  { icon: Wallet, title: "Paga en $ y Bs", text: "Con la tasa del día" },
  { icon: ShieldCheck, title: "Tiendas verificadas", text: "Comercios de tu zona" },
] as const;

export function TrustStrip() {
  return (
    <ul aria-label="Ventajas de comprar" className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text"
          >
            <Icon className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            <span className="text-xs text-muted-foreground">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
