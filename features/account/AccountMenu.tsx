import { User } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { Customer } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";
import { logout } from "./actions";
import { getCurrentCustomer } from "./session";

const MENU_LINKS = [
  { href: "/cuenta", label: "Resumen" },
  { href: "/cuenta/perfil", label: "Perfil" },
  { href: "/cuenta/direcciones", label: "Direcciones" },
  { href: "/cuenta/favoritos", label: "Favoritos" },
  { href: "/cuenta/configuracion", label: "Configuración" },
];

const menuItemClasses =
  "block w-full rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

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
  return (
    <details className="relative">
      <summary className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer list-none [&::-webkit-details-marker]:hidden")}>
        <User aria-hidden="true" className="size-4" />
        Mi cuenta
      </summary>
      <ul className="absolute right-0 top-full z-50 mt-2 flex w-52 flex-col gap-1 rounded-lg border border-border bg-surface p-2 shadow-raised">
        {MENU_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={menuItemClasses}>
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <form action={logout}>
            <button type="submit" className={menuItemClasses}>
              Salir
            </button>
          </form>
        </li>
      </ul>
    </details>
  );
}

export function AccountSlotSkeleton() {
  return <Skeleton className="h-11 w-24 md:h-9" />;
}
