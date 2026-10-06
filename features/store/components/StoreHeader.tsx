import { Clock, MapPin } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ContactButtons } from "@/features/events/components/ContactButtons";
import type { Store } from "@/lib/marketplace/schemas";
import { storeInitials } from "../lib/initials";
import { formatSchedule } from "../lib/schedule";

function StoreHeaderStatus({ store }: { store: Store }) {
  if (store.is_open === undefined) return null;
  if (!store.is_open) return <Badge variant="secondary" className="w-fit">Cerrada ahora</Badge>;
  return (
    <Badge variant="success" className="w-fit">
      {store.closes_at ? `Abierta · hasta ${store.closes_at}` : "Abierta"}
    </Badge>
  );
}

export function StoreHeader({ store, children }: { store: Store; children?: ReactNode }) {
  const coverUrl = store.is_premium ? store.cover_url : null;
  const logoUrl = store.is_premium ? store.logo_url : null;
  return (
    <header className="flex flex-col gap-4">
      {coverUrl !== null && (
        <Image
          src={coverUrl}
          alt=""
          width={1200}
          height={300}
          preload
          className="h-40 w-full rounded-2xl object-cover sm:h-56"
        />
      )}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
        <div className="flex items-center gap-4">
          {logoUrl !== null ? (
            <Image
              src={logoUrl}
              alt=""
              width={72}
              height={72}
              className="size-18 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-18 shrink-0 items-center justify-center rounded-full bg-primary-soft text-2xl font-bold text-warning"
            >
              {storeInitials(store.name)}
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {store.name}
            </h1>
            <p className="text-sm text-muted-foreground">{store.company_name}</p>
            <StoreHeaderStatus store={store} />
          </div>
        </div>
        <p className="flex items-start gap-2 text-foreground">
          <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0" />
          <span>
            {store.address}, {store.city.name}
          </span>
        </p>
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight">
            <Clock aria-hidden="true" className="size-4" />
            Horario
          </h2>
          <ul className="text-sm text-foreground">
            {formatSchedule(store.schedule).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ContactButtons store={store} product={null} />
          {children}
        </div>
      </div>
    </header>
  );
}
