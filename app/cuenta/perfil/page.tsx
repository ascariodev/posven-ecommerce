import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
