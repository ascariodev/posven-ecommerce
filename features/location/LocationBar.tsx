import { Skeleton } from "@/components/ui/skeleton";
import { listLocations } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { LocationState } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { LocationSheet } from "./LocationSheet";
import { getEffectiveLocation } from "./server";

function Divider() {
  return <span aria-hidden="true" className="h-6 w-px shrink-0 bg-border" />;
}

// En la cabecera (`degrade`), app/error.tsx no cubre el layout raíz (L-02): sin API, el segmento
// no se pinta y la píldora queda con "qué" y "Buscar".
async function locationData(degrade: boolean): Promise<{ name: string | null; states: LocationState[] } | null> {
  try {
    const [{ name }, states] = await Promise.all([getEffectiveLocation(), listLocations()]);
    return { name, states };
  } catch (error) {
    if (degrade && error instanceof MarketplaceUnavailableError) return null;
    throw error;
  }
}

export async function LocationBar({ compact = false, degrade = false }: { compact?: boolean; degrade?: boolean }) {
  const data = await locationData(degrade);
  if (data === null) return null;
  return (
    <>
      <Divider />
      <LocationSheet label={data.name} states={data.states} compact={compact} />
    </>
  );
}

export function LocationBarSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <Divider />
      <Skeleton className={cn("w-28 shrink-0 rounded-full", compact ? "h-11 md:h-9" : "h-11")} />
    </>
  );
}
