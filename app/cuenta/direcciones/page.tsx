import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteAddressAction, setDefaultAddress } from "@/features/account/accountActions";
import { AddressForm } from "@/features/account/AddressForm";
import { requireCustomer } from "@/features/account/session";
import { listAddresses, listLocations } from "@/lib/marketplace/client";

export const metadata: Metadata = {
  title: "Direcciones",
  robots: { index: false, follow: false },
};

const NEW_ADDRESS_HEADING_ID = "agregar-direccion-titulo";

const linkClasses = "text-sm font-medium text-foreground underline underline-offset-4";

async function AddressesPanel() {
  const { ctx } = await requireCustomer("/cuenta/direcciones");
  const [addresses, states] = await Promise.all([listAddresses(ctx), listLocations()]);
  const cities = states.flatMap((state) =>
    state.municipalities.flatMap((municipality) =>
      municipality.cities.map((city) => ({ slug: city.slug, name: city.name, state: state.name })),
    ),
  );

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Direcciones</h1>
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
              <Card className="flex flex-col gap-3">
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
                    <form action={setDefaultAddress}>
                      <input type="hidden" name="address_id" value={address.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        aria-label={`Marcar como predeterminada: ${address.label}`}
                      >
                        Marcar como predeterminada
                      </Button>
                    </form>
                  )}
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="address_id" value={address.id} />
                    <Button type="submit" variant="outline" size="sm" aria-label={`Eliminar ${address.label}`}>
                      Eliminar
                    </Button>
                  </form>
                </div>
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-foreground underline underline-offset-4">
                    Editar
                  </summary>
                  <div className="pt-4">
                    <AddressForm address={address} cities={cities} />
                  </div>
                </details>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <section aria-labelledby={NEW_ADDRESS_HEADING_ID}>
        <Card className="flex flex-col gap-4">
          <h2 id={NEW_ADDRESS_HEADING_ID} className="text-xl font-bold tracking-tight text-foreground">
            Agregar dirección
          </h2>
          <AddressForm address={null} cities={cities} />
        </Card>
      </section>
    </div>
  );
}

export default function AddressesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <AddressesPanel />
    </Suspense>
  );
}
