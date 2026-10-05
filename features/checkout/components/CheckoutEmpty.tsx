import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CART_EMPTY_MESSAGE = "Tu carrito no tiene productos disponibles.";

export function CheckoutEmpty({ message = CART_EMPTY_MESSAGE }: { message?: string }) {
  return (
    <EmptyState icon={ShoppingCart} title={message} titleClassName="md:text-xl">
      <Link href="/carrito" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-card")}>
        Volver al carrito
      </Link>
    </EmptyState>
  );
}
