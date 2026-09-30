import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifyEmailForm } from "@/features/account/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verificar correo",
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;

async function VerifyPanel({ params }: { params: Params }) {
  const { token } = await params;
  return (
    <Card>
      <CardContent>
        <VerifyEmailForm token={token} />
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Verificar correo</h1>
      <p className="text-foreground">Confirma que este correo es tuyo.</p>
      <Suspense fallback={<Skeleton className="h-64 w-full max-w-md" />}>
        <VerifyPanel params={params} />
      </Suspense>
    </div>
  );
}
