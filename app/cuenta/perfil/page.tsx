import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BillingForm } from "@/features/account/components/BillingForm";
import { ProfileForm } from "@/features/account/components/ProfileForm";
import { requireCustomer } from "@/features/account/server/session";

export const metadata: Metadata = {
  title: "Perfil",
  robots: { index: false, follow: false },
};

async function ProfilePanel() {
  const { customer } = await requireCustomer("/cuenta/perfil");

  return (
    <div className="flex max-w-md flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Perfil</h1>
      <Card>
        <CardContent>
          <ProfileForm customer={customer} />
        </CardContent>
      </Card>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">Datos de facturación</h2>
      <p className="text-sm text-muted-foreground">
        Los usamos para facturar tus compras a tu nombre cuando lo pidas al pagar.
      </p>
      <Card>
        <CardContent>
          <BillingForm billing={customer.billing} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ProfilePanel />
    </Suspense>
  );
}
