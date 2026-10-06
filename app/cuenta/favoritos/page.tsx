import { Heart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, emptyActionClass } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteToggleForm } from "@/features/account/components/FavoriteToggleForm";
import { requireCustomer } from "@/features/account/server/session";
import { ProductThumb } from "@/features/search/components/ProductThumb";
import { StoreLogo } from "@/features/store/components/StoreLogo";
import { listFavorites } from "@/lib/marketplace/client";
import type { FavoriteTarget } from "@/lib/marketplace/params";

export const metadata: Metadata = {
  title: "Favoritos",
  robots: { index: false, follow: false },
};

function RemoveFavoriteForm({ target, name, className }: { target: FavoriteTarget; name: string; className?: string }) {
  return (
    <FavoriteToggleForm
      target={target}
      mode="remove"
      returnTo="/cuenta/favoritos"
      ariaLabel={`Quitar ${name} de favoritos`}
      className={className}
    >
      Quitar
    </FavoriteToggleForm>
  );
}

async function FavoritesPanel() {
  const { ctx } = await requireCustomer("/cuenta/favoritos");
  const { products, stores } = await listFavorites(ctx);
  const isEmpty = products.length === 0 && stores.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Favoritos</h1>
      {isEmpty && (
        <EmptyState icon={Heart} title="Todavía no tienes favoritos.">
          <Link href="/buscar" className={emptyActionClass}>
            Buscar productos
          </Link>
        </EmptyState>
      )}
      {products.length > 0 && (
        <section aria-labelledby="favoritos-productos" className="flex flex-col gap-3">
          <h2 id="favoritos-productos" className="font-heading text-lg font-semibold text-foreground">
            Productos
          </h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <li key={product.slug}>
                <Card className="relative h-full gap-2.5 p-2.5 pb-3 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-foreground">
                  <ProductThumb
                    imageUrl={product.image_url}
                    category={product.category}
                    size="card"
                    className="rounded-xl bg-tile"
                  />
                  <div className="flex flex-1 flex-col gap-1 px-1">
                    {product.brand !== null && (
                      <span className="text-xs text-muted-foreground">{product.brand}</span>
                    )}
                    <Link
                      href={`/p/${product.slug}`}
                      className="line-clamp-2 text-[15px] leading-snug font-semibold text-foreground after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
                    >
                      {product.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">Ver tiendas</span>
                  </div>
                  <RemoveFavoriteForm
                    target={{ kind: "product", slug: product.slug }}
                    name={product.name}
                    className="relative z-10 w-fit px-1"
                  />
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
      {stores.length > 0 && (
        <section aria-labelledby="favoritos-tiendas" className="flex flex-col gap-3">
          <h2 id="favoritos-tiendas" className="font-heading text-lg font-semibold text-foreground">
            Tiendas
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {stores.map((store) => (
              <li key={store.slug}>
                <Card className="relative h-full gap-0 py-0 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-foreground">
                  <div className="flex items-center gap-3 p-3">
                    <StoreLogo store={store} className="size-12 shrink-0 rounded-xl" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <Link
                        href={`/tienda/${store.slug}`}
                        className="truncate font-semibold text-foreground after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
                      >
                        {store.name}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">{store.city.name}</p>
                    </div>
                    <RemoveFavoriteForm
                      target={{ kind: "store", slug: store.slug }}
                      name={store.name}
                      className="relative z-10 w-fit shrink-0"
                    />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <FavoritesPanel />
    </Suspense>
  );
}
