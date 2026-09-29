import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { listLocations } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { LocationPicker } from "./LocationPicker";
import { getEffectiveLocation } from "./server";

export async function LocationBar() {
  const [{ name }, states] = await Promise.all([getEffectiveLocation(), listLocations()]);
  return <LocationPicker label={name} states={states} />;
}

export function LocationBarSkeleton() {
  return <Skeleton className="h-9 w-full max-w-md" />;
}

async function summaryName(): Promise<string | null> {
  try {
    return (await getEffectiveLocation()).name;
  } catch (error) {
    if (error instanceof MarketplaceUnavailableError) return null;
    throw error;
  }
}

export async function LocationSummary() {
  const name = await summaryName();
  return (
    <p className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
      <MapPin aria-hidden="true" className="size-4" />
      {name === null ? "Sin ubicación" : `Cerca de: ${name}`}
    </p>
  );
}

export function LocationSummarySkeleton() {
  return <Skeleton className="h-5 w-32" />;
}
