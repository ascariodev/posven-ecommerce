import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CartView, CartViewSkeleton } from "@/features/cart/components/CartView";
import { cartEnabled } from "@/features/cart/lib/flag";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  if (!cartEnabled()) notFound();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Tu carrito</h1>
      <Suspense fallback={<CartViewSkeleton />}>
        <CartView />
      </Suspense>
    </div>
  );
}
