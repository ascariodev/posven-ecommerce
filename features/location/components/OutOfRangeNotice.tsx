import { MapPinOff } from "lucide-react";

export function OutOfRangeNotice({ cityName }: { cityName: string | null }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-2xl border border-border bg-warning-soft p-4 text-sm text-foreground">
      <MapPinOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
      <p>
        <strong className="font-semibold">
          {cityName === null ? "Las tiendas están fuera de tu rango." : `Las tiendas están fuera del rango de ${cityName}.`}
        </strong>{" "}
        Te mostramos las de todo el país, de la más cercana a la más lejana.
      </p>
    </div>
  );
}
