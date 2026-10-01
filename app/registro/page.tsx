import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RegisterForm } from "@/features/account/components/RegisterForm";
import { safeReturnPath } from "@/features/account/returnPath";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function RegisterPanel({ searchParams }: { searchParams: SearchParams }) {
  const volver = safeReturnPath((await searchParams).volver);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <RegisterForm volver={volver} />
        </CardContent>
      </Card>
      <Link
        href={`/entrar?volver=${encodeURIComponent(volver)}`}
        className="text-sm font-medium text-foreground underline underline-offset-4"
      >
        ¿Ya tienes cuenta? Entra
      </Link>
    </div>
  );
}

export default function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Crear cuenta</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full max-w-md" />}>
        <RegisterPanel searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
