import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cartEnabled } from "@/features/cart/lib/flag";
import { CheckoutResult, CheckoutResultSkeleton, PURCHASE_CODE_PATTERN } from "@/features/checkout/CheckoutResult";

export const metadata: Metadata = {
  title: "Resultado del pago",
  robots: { index: false, follow: false },
};

async function Result({ searchParams }: { searchParams: PageProps<"/checkout/resultado">["searchParams"] }) {
  const { compra } = await searchParams;
  if (typeof compra !== "string" || !PURCHASE_CODE_PATTERN.test(compra)) notFound();
  return <CheckoutResult code={compra} />;
}

export default function CheckoutResultPage({ searchParams }: PageProps<"/checkout/resultado">) {
  if (!cartEnabled()) notFound();
  return (
    <Suspense fallback={<CheckoutResultSkeleton />}>
      <Result searchParams={searchParams} />
    </Suspense>
  );
}
