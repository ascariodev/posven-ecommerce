import { User } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { Customer } from "@/lib/marketplace/schemas";
import { cartEnabled } from "@/features/cart/lib/flag";
import { AccountDropdown } from "./AccountDropdown";
import { getCurrentCustomer } from "../session";

// app/error.tsx no cubre el layout raíz (L-02): sin API, la cabecera degrada a invitado.
async function currentCustomerOrGuest(): Promise<Customer | null> {
  try {
    return await getCurrentCustomer();
  } catch (error) {
    if (error instanceof MarketplaceUnavailableError || error instanceof MarketplaceAccountError) return null;
    throw error;
  }
}

export async function AccountSlot() {
  const customer = await currentCustomerOrGuest();
  if (customer === null) {
    return (
      <Link href="/entrar" rel="nofollow" className={buttonVariants({ variant: "outline", size: "sm" })}>
        <User aria-hidden="true" className="size-4" />
        Entrar
      </Link>
    );
  }
  return <AccountDropdown showPurchases={cartEnabled()} />;
}

export function AccountSlotSkeleton() {
  return <Skeleton className="h-11 w-24 md:h-9" />;
}
