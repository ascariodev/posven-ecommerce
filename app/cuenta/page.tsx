import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCustomer } from "@/features/account/server/session";
import { ResendVerificationForm } from "@/features/account/components/VerifyEmailForm";
import { cartEnabled } from "@/features/cart/lib/flag";
import { BuyAgain } from "@/features/purchases/components/BuyAgain";
import { LastPurchase, RecentPurchases } from "@/features/purchases/components/RecentPurchases";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

async function AccountSummary() {
  const { customer, ctx } = await requireCustomer("/cuenta");
  const withPurchases = cartEnabled();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Hola, {customer.name}</h1>
      {!customer.email_verified && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-foreground">Tu correo {customer.email} no está verificado.</p>
            <ResendVerificationForm />
          </CardContent>
        </Card>
      )}
      {customer.pending_email !== null && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-foreground">
              Confirma tu correo nuevo {customer.pending_email} con el enlace que te enviamos.
            </p>
            <ResendVerificationForm />
          </CardContent>
        </Card>
      )}
      {withPurchases && (
        <Suspense fallback={<Skeleton className="h-28 w-full" />}>
          <LastPurchase ctx={ctx} />
        </Suspense>
      )}
      {withPurchases && (
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <BuyAgain ctx={ctx} />
        </Suspense>
      )}
      {withPurchases && (
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <RecentPurchases ctx={ctx} />
        </Suspense>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <AccountSummary />
    </Suspense>
  );
}
