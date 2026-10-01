import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireCustomer } from "@/features/account/session";
import { DeleteAccountForm, NotificationsForm, PasswordChangeForm } from "@/features/account/components/SettingsForms";

export const metadata: Metadata = {
  title: "Configuración",
  robots: { index: false, follow: false },
};

async function SettingsPanel() {
  const { customer } = await requireCustomer("/cuenta/configuracion");

  return (
    <div className="flex max-w-md flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración</h1>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Contraseña</h2>
          <PasswordChangeForm />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Avisos</h2>
          <NotificationsForm enabled={customer.settings.order_status_emails} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Eliminar cuenta</h2>
          <p className="text-sm text-muted-foreground">
            Borraremos tus direcciones y favoritos y cerraremos tus sesiones. Tus compras se conservan sin
            tus datos personales.
          </p>
          <DeleteAccountForm />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <SettingsPanel />
    </Suspense>
  );
}
