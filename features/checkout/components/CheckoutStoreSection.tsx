import { Store, Truck } from "lucide-react";
import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatUsd, formatVes } from "@/lib/format";
import type { CartStore, DeliveryUnavailableReason, QuoteStore } from "@/lib/marketplace/schemas";

export const DELIVERY_UNAVAILABLE_TEXT: Record<DeliveryUnavailableReason, string> = {
  no_delivery: "Esta tienda no hace entregas.",
  out_of_radius: "Tu dirección está fuera de su zona de entrega.",
  no_address: "Agrega una dirección para pedir entrega.",
};

const OPTION_CLASSES =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border-2 border-border px-4 py-3 text-sm font-medium text-foreground has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-soft has-disabled:cursor-not-allowed has-disabled:opacity-60";

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className={strong ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</dt>
      <dd className={strong ? "font-semibold tabular-nums text-foreground" : "tabular-nums text-foreground"}>{value}</dd>
    </div>
  );
}

export function CheckoutStoreSection({
  entry,
  store,
  changed,
  delivery,
  disabled,
  onFulfillment,
}: {
  entry: CartStore;
  store: QuoteStore;
  changed: boolean;
  delivery: boolean;
  disabled: boolean;
  onFulfillment: (delivery: boolean) => void;
}) {
  const reasonId = useId();
  const name = entry.store.name;
  const reason = store.delivery_unavailable_reason;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-lg font-bold tracking-tight">{name}</h3>
          {!entry.is_open && <Badge variant="secondary">Cerrada ahora</Badge>}
          {changed && <Badge variant="warning">Cambió</Badge>}
        </div>
        <ul aria-label={`Productos de ${name}`} className="flex flex-col gap-2">
          {entry.lines
            .filter((line) => line.status === "ok")
            .map((line) => (
              <li key={line.product.slug} className="flex justify-between gap-4 text-sm">
                <span className="text-foreground">
                  {line.product.name} <span className="text-muted-foreground">× {line.quantity}</span>
                </span>
                {line.line_usd !== null && <span className="shrink-0 whitespace-nowrap tabular-nums text-foreground">{formatUsd(line.line_usd)}</span>}
              </li>
            ))}
        </ul>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-foreground">Entrega en {name}</legend>
          <RadioGroup
            value={delivery && store.delivery_available ? "delivery" : "pickup"}
            onValueChange={(value) => onFulfillment(value === "delivery")}
            disabled={disabled}
            aria-label={`Entrega en ${name}`}
            className="grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2"
          >
            <label className={OPTION_CLASSES}>
              <RadioGroupItem value="pickup" />
              <Store aria-hidden="true" className="size-4.5 shrink-0 text-primary-text" />
              Retiro en tienda
            </label>
            <label className={OPTION_CLASSES}>
              <RadioGroupItem
                value="delivery"
                disabled={!store.delivery_available}
                aria-describedby={reason === null ? undefined : reasonId}
              />
              <Truck aria-hidden="true" className="size-4.5 shrink-0 text-primary-text" />
              Entrega a domicilio
            </label>
          </RadioGroup>
          {reason !== null && (
            <p id={reasonId} className="text-sm text-muted-foreground">
              {DELIVERY_UNAVAILABLE_TEXT[reason]}
            </p>
          )}
        </fieldset>
        <dl className="flex flex-col gap-1 border-t border-border pt-3">
          <Row label="Subtotal" value={`${formatUsd(store.subtotal_usd)} · ${formatVes(store.subtotal_ves)}`} />
          {store.fulfillment === "delivery" && (
            <Row label="Envío" value={`${formatUsd(store.delivery_fee_usd)} · ${formatVes(store.delivery_fee_ves)}`} />
          )}
          <Row label="Total de la tienda" value={`${formatUsd(store.total_usd)} · ${formatVes(store.total_ves)}`} strong />
        </dl>
      </CardContent>
    </Card>
  );
}
