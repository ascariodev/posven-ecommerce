import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Cart } from "@/lib/marketplace/schemas";
import { accountContext } from "@/features/account/server/session";
import { loginHref } from "@/features/account/lib/returnPath";
import { checkoutPathFor, deliveryKey, readDeliveryStores, type SearchParams } from "../lib/fulfillment";
import { getCurrentCart } from "../server/cart";
import { CartStoreGroup } from "./CartStoreGroup";
import { CartPayBar, CartSummary } from "./CartSummary";

export function CartContent({
  cart,
  signedIn,
  delivery = [],
}: {
  cart: Cart | null;
  signedIn: boolean;
  delivery?: string[];
}) {
  if (cart === null || cart.stores.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-muted-foreground">Tu carrito está vacío.</p>
        <Link href="/buscar" className={buttonVariants({ variant: "outline" })}>
          Buscar productos
        </Link>
      </div>
    );
  }
  const checkoutPath = checkoutPathFor(delivery);
  const payHref = signedIn ? checkoutPath : loginHref(checkoutPath);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 pb-28 md:grid-cols-[minmax(0,1fr)_360px] md:gap-6 md:pb-0">
      <div className="flex flex-col gap-4">
        {cart.stores.map((entry) => (
          <CartStoreGroup key={entry.store.slug} entry={entry} delivery={delivery} />
        ))}
      </div>
      <div className="hidden md:sticky md:top-24 md:block">
        <CartSummary cart={cart} payHref={payHref} signedIn={signedIn} />
      </div>
      <CartPayBar cart={cart} payHref={payHref} signedIn={signedIn} />
    </div>
  );
}

export async function CartView({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const delivery = readDeliveryStores(await searchParams);
  const [cart, ctx] = await Promise.all([getCurrentCart(deliveryKey(delivery)), accountContext()]);
  return <CartContent cart={cart} signedIn={ctx.session !== null} delivery={delivery} />;
}

export function CartViewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}
