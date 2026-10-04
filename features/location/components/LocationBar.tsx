import { Skeleton } from "@/components/ui/skeleton";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { LocationSheet } from "./LocationSheet";
import { getEffectiveLocation } from "../server/location";

// En la cabecera (`degrade`), app/error.tsx no cubre el layout raíz (L-02): sin API, el botón
// no se pinta y la cabecera conserva logo, buscador y accesos.
async function locationData(degrade: boolean): Promise<{ name: string | null; kind: "city" | "coords" } | null> {
  try {
    const { name, location } = await getEffectiveLocation();
    return { name, kind: location?.kind ?? "city" };
  } catch (error) {
    if (degrade && error instanceof MarketplaceUnavailableError) return null;
    throw error;
  }
}

export async function LocationBar({ degrade = false }: { degrade?: boolean }) {
  const data = await locationData(degrade);
  if (data === null) return null;
  return <LocationSheet label={data.name} kind={data.kind} />;
}

export function LocationBarSkeleton() {
  return <Skeleton className="h-11 w-40 shrink-0 rounded-xl" />;
}
