import type { Metadata } from "next";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResetPasswordForm } from "@/features/account/RecoveryForms";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;

async function ResetPanel({ params }: { params: Params }) {
  const { token } = await params;
  return (
    <Card>
      <ResetPasswordForm token={token} />
    </Card>
  );
}

export default function ResetPasswordPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Nueva contraseña</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full max-w-md" />}>
        <ResetPanel params={params} />
      </Suspense>
    </div>
  );
}
