import { Heart } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { listFavorites } from "@/lib/marketplace/client";
import { MarketplaceAccountError, MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { FavoriteTarget } from "@/lib/marketplace/params";
import type { FavoritesResponse } from "@/lib/marketplace/schemas";
import { toggleFavorite } from "../accountActions";
import { loginHref } from "../returnPath";
import { accountContext } from "../session";

const SAVE_LABEL = "Guardar en favoritos";
const REMOVE_LABEL = "Quitar de favoritos";

function isSaved(favorites: FavoritesResponse, target: FavoriteTarget): boolean {
  const list = target.kind === "product" ? favorites.products : favorites.stores;
  return list.some((item) => item.slug === target.slug);
}

function LoginLink({ returnTo }: { returnTo: string }) {
  return (
    <Link href={loginHref(returnTo)} rel="nofollow" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "self-start")}>
      <Heart aria-hidden="true" className="size-4" />
      {SAVE_LABEL}
    </Link>
  );
}

export async function FavoriteButton({ target, returnTo }: { target: FavoriteTarget; returnTo: string }) {
  const ctx = await accountContext();
  if (ctx.session === null) return <LoginLink returnTo={returnTo} />;

  let favorites: FavoritesResponse;
  try {
    favorites = await listFavorites(ctx);
  } catch (error) {
    if (error instanceof MarketplaceAccountError && error.code === "unauthenticated") {
      return <LoginLink returnTo={returnTo} />;
    }
    if (error instanceof MarketplaceUnavailableError || error instanceof MarketplaceAccountError) return null;
    throw error;
  }

  const saved = isSaved(favorites, target);
  return (
    <form action={toggleFavorite} className="self-start">
      <input type="hidden" name="kind" value={target.kind} />
      <input type="hidden" name="slug" value={target.slug} />
      <input type="hidden" name="mode" value={saved ? "remove" : "add"} />
      <input type="hidden" name="volver" value={returnTo} />
      <Button type="submit" variant="outline" size="sm" aria-pressed={saved}>
        <Heart aria-hidden="true" className={cn("size-4", saved && "fill-current")} />
        {saved ? REMOVE_LABEL : SAVE_LABEL}
      </Button>
    </form>
  );
}

export function FavoriteButtonSkeleton() {
  return <Skeleton className="h-11 w-44 md:h-9" />;
}
