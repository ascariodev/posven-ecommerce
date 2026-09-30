import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCustomer } from "@/features/account/session";
import { ResendVerificationForm } from "@/features/account/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

const SHORTCUTS = [
  { href: "/cuenta/perfil", title: "Perfil", description: "Nombre, correo y teléfono" },
  { href: "/cuenta/direcciones", title: "Direcciones", description: "Dónde recibes tus pedidos" },
  { href: "/cuenta/favoritos", title: "Favoritos", description: "Productos y tiendas guardados" },
  { href: "/cuenta/configuracion", title: "Configuración", description: "Contraseña, avisos y eliminar cuenta" },
];

const shortcutClasses =
  "rounded-2xl border border-border bg-surface p-4 shadow-card transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-raised motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

async function AccountSummary() {
  const { customer } = await requireCustomer("/cuenta");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Hola, {customer.name}</h1>
      {!customer.email_verified && (
        <Card className="flex flex-col gap-3">
          <p className="text-foreground">Tu correo {customer.email} no está verificado.</p>
          <ResendVerificationForm />
        </Card>
      )}
      {customer.pending_email !== null && (
        <Card className="flex flex-col gap-3">
          <p className="text-foreground">
            Confirma tu correo nuevo {customer.pending_email} con el enlace que te enviamos.
          </p>
          <ResendVerificationForm />
        </Card>
      )}
      <ul className="grid gap-4 sm:grid-cols-2">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.href} className="flex">
            <Link href={shortcut.href} className={cn(shortcutClasses, "flex w-full flex-col gap-1")}>
              <span className="text-lg font-bold tracking-tight text-foreground">{shortcut.title}</span>
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
            </Link>
          </li>
        ))}
      </ul>
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
