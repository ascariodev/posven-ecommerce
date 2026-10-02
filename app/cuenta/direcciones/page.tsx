import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressActionButton } from "@/features/account/components/AddressActionButton";
import { AddressForm } from "@/features/account/components/AddressForm";
import { requireCustomer } from "@/features/account/server/session";
import { listAddresses, listLocations } from "@/lib/marketplace/client";

export const metadata: Metadata = {
  title: "Direcciones",
  robots: { index: false, follow: false },
};

const NEW_ADDRESS_HEADING_ID = "agregar-direccion-titulo";

const linkClasses = "text-sm font-medium text-foreground underline underline-offset-4";

// Sólo el checkout pide volver: cualquier otro `volver` se ignora (decisión 3 del plan 4b).
const CHECKOUT_RETURN = "/checkout";

async function AddressesPanel({ searchParams }: { searchParams: PageProps<"/cuenta/direcciones">["searchParams"] }) {
  const { ctx } = await requireCustomer("/cuenta/direcciones");
  const backToCheckout = (await searchParams).volver === CHECKOUT_RETURN;
  const [addresses, states] = await Promise.all([listAddresses(ctx), listLocations()]);
  const cities = states.flatMap((state) =>
    state.municipalities.flatMap((municipality) =>
      municipality.cities.map((city) => ({ slug: city.slug, name: city.name, state: state.name })),
    ),
  );

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Direcciones</h1>
      {backToCheckout && (
        <Link href={CHECKOUT_RETURN} className={linkClasses}>
          Volver al checkout
        </Link>
      )}
      {addresses.length === 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground">Todavía no tienes direcciones guardadas.</p>
          <Link href="/buscar" className={linkClasses}>
            Buscar productos
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {addresses.map((address) => (
            <li key={address.id}>
              <Card>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">{address.label}</h2>
                    {address.is_default && <Badge variant="secondary">Predeterminada</Badge>}
                  </div>
                  <div className="flex flex-col text-sm text-foreground">
                    <p>{address.line}</p>
                    <p>{address.city.name}</p>
                    <p>{address.recipient_name}</p>
                    <p>{address.phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!address.is_default && (
                      <AddressActionButton kind="default" addressId={address.id} addressLabel={address.label} />
                    )}
                    <AddressActionButton kind="delete" addressId={address.id} addressLabel={address.label} />
                  </div>
                  <details>
                    <summary className="cursor-pointer text-sm font-medium text-foreground underline underline-offset-4">
                      Editar
                    </summary>
                    <div className="pt-4">
                      <AddressForm address={address} cities={cities} />
                    </div>
                  </details>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <section aria-labelledby={NEW_ADDRESS_HEADING_ID}>
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2 id={NEW_ADDRESS_HEADING_ID} className="text-xl font-bold tracking-tight text-foreground">
              Agregar dirección
            </h2>
            <AddressForm address={null} cities={cities} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default function AddressesPage({ searchParams }: PageProps<"/cuenta/direcciones">) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <AddressesPanel searchParams={searchParams} />
    </Suspense>
  );
}
