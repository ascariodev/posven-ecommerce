import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { listLocations } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { cn } from "@/lib/utils";
import { LocationSheet } from "./LocationSheet";
import { getEffectiveLocation } from "./server";

export async function LocationBar({ compact = false }: { compact?: boolean }) {
  const [{ name }, states] = await Promise.all([getEffectiveLocation(), listLocations()]);
  return <LocationSheet label={name} states={states} compact={compact} />;
}

export function LocationBarSkeleton({ compact = false }: { compact?: boolean }) {
  return <Skeleton className={cn("w-28 shrink-0 rounded-full", compact ? "h-11 md:h-9" : "h-11")} />;
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
