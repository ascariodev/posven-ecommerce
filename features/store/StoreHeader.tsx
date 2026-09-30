import Image from "next/image";
import { ContactButtons } from "@/features/events/ContactButtons";
import type { Store } from "@/lib/marketplace/schemas";
import { storeInitials } from "./initials";
import { formatSchedule } from "./schedule";

export function StoreHeader({ store }: { store: Store }) {
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
          className="h-40 w-full rounded-lg object-cover sm:h-56"
        />
      )}
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{store.name}</h1>
          <p className="text-muted-foreground">{store.company_name}</p>
        </div>
      </div>
      <p className="text-foreground">
        {store.address}, {store.city.name}
      </p>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight">Horario</h2>
        <ul className="text-sm text-foreground">
          {formatSchedule(store.schedule).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <ContactButtons store={store} product={null} />
    </header>
  );
}
