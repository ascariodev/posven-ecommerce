import { Skeleton } from "@/components/ui/skeleton";
import { listLocations } from "@/lib/marketplace/client";
import { describeLocation } from "./cookie";
import { LocationPicker } from "./LocationPicker";
import { getUserLocation } from "./server";

export async function LocationBar() {
  const [location, states] = await Promise.all([getUserLocation(), listLocations()]);
  return <LocationPicker label={describeLocation(location, states)} states={states} />;
}

export function LocationBarSkeleton() {
  return <Skeleton className="h-9 w-full max-w-md" />;
}
