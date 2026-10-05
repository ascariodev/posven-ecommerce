import { Pill } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDistance, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EXAMPLE_DISTANCE_KM, EXAMPLE_PRICE_USD } from "../lib/content";

const BADGE = "rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success";
const MOCK_BUTTON = "flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-semibold";

export function ExampleStoreCard() {
  return (
    <Card className="w-full max-w-md gap-4 px-5 text-foreground">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Así te ven los compradores
      </p>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-primary font-heading font-semibold text-primary-foreground"
        >
          TU
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-semibold">[Nombre de tu comercio]</span>
          <span className="text-sm text-muted-foreground">Farmacia · {formatDistance(EXAMPLE_DISTANCE_KM)}</span>
        </div>
        <span className={BADGE}>Abierto</span>
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-muted p-2.5">
        <span
          aria-hidden="true"
          className="flex size-13 shrink-0 items-center justify-center rounded-xl bg-card text-tile-foreground"
        >
          <Pill className="size-6" />
        </span>
        <span className="flex-1 text-sm font-semibold">Acetaminofén 500 mg × 20</span>
        <span className={BADGE}>Mejor precio</span>
        <span className="font-heading font-semibold tabular-nums">{formatUsd(EXAMPLE_PRICE_USD)}</span>
      </div>
      <div aria-hidden="true" className="flex gap-2">
        <span className={cn(MOCK_BUTTON, "border-transparent bg-primary text-primary-foreground")}>Agregar</span>
        <span className={cn(MOCK_BUTTON, "border-border")}>Llamar</span>
      </div>
    </Card>
  );
}
