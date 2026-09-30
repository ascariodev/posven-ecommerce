import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cartEnabled } from "@/features/cart/flag";
import { CheckoutView, CheckoutViewSkeleton } from "@/features/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Pagar",
  robots: { index: false, follow: false },
};

export default function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  if (!cartEnabled()) notFound();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Pagar</h1>
      <Suspense fallback={<CheckoutViewSkeleton />}>
        <CheckoutView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
