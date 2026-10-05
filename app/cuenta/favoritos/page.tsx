import { Heart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteToggleForm } from "@/features/account/components/FavoriteToggleForm";
import { requireCustomer } from "@/features/account/server/session";
import { ProductThumb } from "@/features/search/components/ProductThumb";
import { listFavorites } from "@/lib/marketplace/client";
import type { FavoriteTarget } from "@/lib/marketplace/params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Favoritos",
  robots: { index: false, follow: false },
};

function RemoveFavoriteForm({ target, name }: { target: FavoriteTarget; name: string }) {
  return (
    <FavoriteToggleForm
      target={target}
      mode="remove"
      returnTo="/cuenta/favoritos"
      ariaLabel={`Quitar ${name} de favoritos`}
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
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Favoritos</h1>
      {isEmpty && (
        <EmptyState icon={Heart} title="Todavía no tienes favoritos.">
          <Link href="/buscar" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-card")}>
            Buscar productos
          </Link>
        </EmptyState>
      )}
      {products.length > 0 && (
        <section aria-labelledby="favoritos-productos" className="flex flex-col gap-3">
          <h2 id="favoritos-productos" className="text-xl font-bold tracking-tight text-foreground">
            Productos
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-card">
            {products.map((product) => (
              <li key={product.slug}>
                <div className="flex items-center gap-4 p-4">
                  <ProductThumb imageUrl={product.image_url} category={product.category} size="md" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Link href={`/p/${product.slug}`} className="font-medium text-foreground hover:underline">
                      {product.name}
                    </Link>
                    <RemoveFavoriteForm target={{ kind: "product", slug: product.slug }} name={product.name} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {stores.length > 0 && (
        <section aria-labelledby="favoritos-tiendas" className="flex flex-col gap-3">
          <h2 id="favoritos-tiendas" className="text-xl font-bold tracking-tight text-foreground">
            Tiendas
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-card">
            {stores.map((store) => (
              <li key={store.slug}>
                <div className="flex items-center gap-4 p-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Link href={`/tienda/${store.slug}`} className="font-medium text-foreground hover:underline">
                      {store.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{store.city.name}</p>
                    <RemoveFavoriteForm target={{ kind: "store", slug: store.slug }} name={store.name} />
                  </div>
                </div>
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
