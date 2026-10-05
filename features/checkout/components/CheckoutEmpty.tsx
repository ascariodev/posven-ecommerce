import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { EmptyState, emptyActionClass } from "@/components/EmptyState";

export const CART_EMPTY_MESSAGE = "Tu carrito no tiene productos disponibles.";

export function CheckoutEmpty({ message = CART_EMPTY_MESSAGE }: { message?: string }) {
  return (
    <EmptyState icon={ShoppingCart} title={message} titleClassName="md:text-xl">
      <Link href="/carrito" className={emptyActionClass}>
        Volver al carrito
      </Link>
    </EmptyState>
  );
}
