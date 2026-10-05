import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRate, formatUsd, formatVes } from "@/lib/format";
import type { Cart } from "@/lib/marketplace/schemas";
import { cn } from "@/lib/utils";

type SummaryProps = { cart: Cart; payHref: string; signedIn: boolean };

function payLabel(signedIn: boolean): string {
  return signedIn ? "Ir a pagar" : "Entra para pagar";
}

export function CartSummary({ cart, payHref, signedIn }: SummaryProps) {
  return (
    <Card data-testid="cart-summary">
      <CardContent className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold">Resumen</h2>
        <p className="flex items-baseline justify-between gap-4 pt-2">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-heading text-2xl font-extrabold tabular-nums text-foreground">
            {formatUsd(cart.total_usd)}
          </span>
        </p>
        <p className="text-right tabular-nums text-foreground">{formatVes(cart.total_ves)}</p>
        <p className="text-right text-sm text-muted-foreground">{formatRate(cart.rate)}</p>
        {cart.line_count > 0 && (
          <Link href={payHref} className={cn(buttonVariants({ size: "lg" }), "mt-3 w-full")}>
            {payLabel(signedIn)}
          </Link>
        )}
        <p className="pt-2 text-sm text-muted-foreground">Pagas todo junto. Cada tienda recibe su parte del pedido.</p>
      </CardContent>
    </Card>
  );
}

// Barra fija sobre la navegación inferior del layout; sólo en móvil.
export function CartPayBar({ cart, payHref, signedIn }: SummaryProps) {
  if (cart.line_count === 0) return null;
  return (
    <div
      data-testid="cart-pay-bar"
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-border bg-card px-4 py-3 md:hidden"
    >
      <div className="flex flex-1 flex-col">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
          {formatUsd(cart.total_usd)}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">{formatVes(cart.total_ves)}</span>
      </div>
      <Link href={payHref} className={cn(buttonVariants({ size: "lg" }), "px-7")}>
        {payLabel(signedIn)}
      </Link>
    </div>
  );
}
