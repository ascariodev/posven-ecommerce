import { Skeleton } from "@/components/ui/skeleton";
import { listLocations } from "@/lib/marketplace/client";
import { LocationPicker } from "./LocationPicker";
import { getEffectiveLocation } from "./server";

export async function LocationBar() {
  const [{ name }, states] = await Promise.all([getEffectiveLocation(), listLocations()]);
  return <LocationPicker label={name} states={states} />;
}

export function LocationBarSkeleton() {
  return <Skeleton className="h-9 w-full max-w-md" />;
}
