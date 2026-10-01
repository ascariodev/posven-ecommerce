import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const CART_EMPTY_MESSAGE = "Tu carrito no tiene productos disponibles.";

export function CheckoutEmpty({ message = CART_EMPTY_MESSAGE }: { message?: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground">{message}</p>
      <Link href="/carrito" className={buttonVariants({ variant: "outline" })}>
        Volver al carrito
      </Link>
    </div>
  );
}
