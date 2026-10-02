import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import { accountContext } from "@/features/account/server/session";
import { cn } from "@/lib/utils";
import { readGuestCart } from "../server/cookie";
import { cartEnabled } from "../lib/flag";
import { getSessionCart } from "../server/cart";

// Contador del carrito en la cabecera. El layout raíz no lo cubre app/error.tsx (L-02): ante
// cualquier error de la API degrada a "Carrito" sin número. El invitado cuenta las entradas de
// `mp_cart` sin llamar a la API; el usuario, `line_count` de su carrito.
async function cartCount(): Promise<number | null> {
  const ctx = await accountContext();
  if (ctx.session !== null) {
    try {
      const cart = await getSessionCart();
      if (cart !== null) return cart.line_count;
    } catch (error) {
      if (error instanceof MarketplaceUnavailableError) return null;
      if (!(error instanceof MarketplaceAccountError)) throw error;
      if (error.code !== "unauthenticated") return null;
    }
  }
  return (await readGuestCart()).length;
}

export async function CartLink() {
  if (!cartEnabled()) return null;
  const count = await cartCount();
  const label =
    count === null || count === 0 ? "Carrito" : `Carrito, ${count} ${count === 1 ? "producto" : "productos"}`;
  return (
    <Link
      href="/carrito"
      rel="nofollow"
      aria-label={label}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-w-11")}
    >
      <ShoppingCart aria-hidden="true" className="size-4" />
      <span className="hidden sm:inline">Carrito</span>
      {count !== null && count > 0 && (
        <span className="min-w-5 rounded-full bg-primary px-1.5 text-center text-xs font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

export function CartLinkSkeleton() {
  return <Skeleton className="h-11 w-11 md:h-9 sm:w-24" />;
}
