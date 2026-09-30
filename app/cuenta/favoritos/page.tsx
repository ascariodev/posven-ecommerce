import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toggleFavorite } from "@/features/account/accountActions";
import { requireCustomer } from "@/features/account/session";
import { ProductThumb } from "@/features/search/ProductThumb";
import { listFavorites } from "@/lib/marketplace/client";
import type { FavoriteTarget } from "@/lib/marketplace/params";

export const metadata: Metadata = {
  title: "Favoritos",
  robots: { index: false, follow: false },
};

const linkClasses = "text-sm font-medium text-foreground underline underline-offset-4";

function RemoveFavoriteForm({ target, name }: { target: FavoriteTarget; name: string }) {
  return (
    <form action={toggleFavorite}>
      <input type="hidden" name="kind" value={target.kind} />
      <input type="hidden" name="slug" value={target.slug} />
      <input type="hidden" name="mode" value="remove" />
      <input type="hidden" name="volver" value="/cuenta/favoritos" />
      <Button type="submit" variant="outline" size="sm" aria-label={`Quitar ${name} de favoritos`}>
        Quitar
      </Button>
    </form>
  );
}

async function FavoritesPanel() {
  const { ctx } = await requireCustomer("/cuenta/favoritos");
  const { products, stores } = await listFavorites(ctx);
  const isEmpty = products.length === 0 && stores.length === 0;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Favoritos</h1>
      {isEmpty && (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground">Todavía no tienes favoritos.</p>
          <Link href="/buscar" className={linkClasses}>
            Buscar productos
          </Link>
        </div>
      )}
      {products.length > 0 && (
        <section aria-labelledby="favoritos-productos" className="flex flex-col gap-3">
          <h2 id="favoritos-productos" className="text-xl font-bold tracking-tight text-foreground">
            Productos
          </h2>
          <ul className="flex flex-col gap-3">
            {products.map((product) => (
              <li key={product.slug}>
                <Card className="flex items-center gap-4">
                  <ProductThumb imageUrl={product.image_url} category={product.category} size="md" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Link href={`/p/${product.slug}`} className="font-medium text-foreground hover:underline">
                      {product.name}
                    </Link>
                    <RemoveFavoriteForm target={{ kind: "product", slug: product.slug }} name={product.name} />
                  </div>
                </Card>
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
          <ul className="flex flex-col gap-3">
            {stores.map((store) => (
              <li key={store.slug}>
                <Card className="flex items-center gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Link href={`/tienda/${store.slug}`} className="font-medium text-foreground hover:underline">
                      {store.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{store.city.name}</p>
                    <RemoveFavoriteForm target={{ kind: "store", slug: store.slug }} name={store.name} />
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
