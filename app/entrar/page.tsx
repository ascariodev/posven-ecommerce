import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/account/LoginForm";
import { safeReturnPath } from "@/features/account/returnPath";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const NOTICES: Record<string, string> = {
  contrasena: "Tu contraseña cambió. Entra con la nueva.",
  sesion: "Tu sesión terminó. Entra de nuevo.",
};

const linkClasses = "text-sm font-medium text-foreground underline underline-offset-4";

async function LoginPanel({ searchParams }: { searchParams: SearchParams }) {
  const { volver: rawVolver, aviso } = await searchParams;
  const volver = safeReturnPath(rawVolver);
  const notice = typeof aviso === "string" && Object.hasOwn(NOTICES, aviso) ? NOTICES[aviso] : null;

  return (
    <div className="flex flex-col gap-4">
      {notice !== null && (
        <p role="status" className="text-sm text-foreground">
          {notice}
        </p>
      )}
      <Card>
        <LoginForm volver={volver} />
      </Card>
      <Link href="/recuperar" className={linkClasses}>
        ¿Olvidaste tu contraseña?
      </Link>
      <Link href={`/registro?volver=${encodeURIComponent(volver)}`} className={linkClasses}>
        ¿No tienes cuenta? Crea una
      </Link>
    </div>
  );
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Entrar</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full max-w-md" />}>
        <LoginPanel searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
