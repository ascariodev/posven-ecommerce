import Image from "next/image";
import type { NearbyStore } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { storeInitials } from "../lib/initials";

export function StoreLogo({ store, className }: { store: NearbyStore; className: string }) {
  if (store.is_premium && store.logo_url !== null) {
    return (
      <Image
        src={store.logo_url}
        alt=""
        width={56}
        height={56}
        className={cn(className, "object-cover")}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(className, "flex items-center justify-center bg-primary-soft font-heading font-semibold text-primary-text")}
    >
      {storeInitials(store.name)}
    </div>
  );
}
