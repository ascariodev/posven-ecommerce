import { Heart } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { AccountSlot, AccountSlotSkeleton } from "@/features/account/components/AccountMenu";
import { CartLink, CartLinkSkeleton } from "@/features/cart/components/CartLink";
import { LocationBar, LocationBarSkeleton } from "@/features/location/components/LocationBar";
import { HeaderSearchSlot } from "@/features/search/components/HeaderSearchSlot";
import { SearchPill } from "@/features/search/components/SearchPill";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CategoryNav } from "./CategoryNav";

export function SiteHeader() {
  return (
    <>
    <div className="bg-ink text-xs font-medium text-ink-foreground">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-4 px-4 py-1.5 sm:justify-between">
        <p>
          <span className="text-primary">●</span> Retira hoy en tiendas cerca de ti · Precios en $ y Bs
        </p>
        <nav aria-label="Enlaces rápidos" className="hidden items-center gap-4 sm:flex">
          <Link href="/ayuda" className="opacity-85 hover:opacity-100 hover:underline">
            Ayuda
          </Link>
          <Link href="/vende" className="opacity-85 hover:opacity-100 hover:underline">
            Vende con posven
          </Link>
        </nav>
      </div>
    </div>
    <header className="header-elevate sticky top-0 z-40 border-b border-glass-border bg-glass text-foreground backdrop-blur-md shadow-card">
      <div className="mx-auto flex min-h-14 w-full max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 md:gap-x-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-xl bg-ink font-heading text-lg font-bold text-primary"
          >
            {SITE_NAME.charAt(0).toLowerCase()}
          </span>
          {SITE_NAME}
        </Link>
        <Suspense fallback={<LocationBarSkeleton />}>
          <LocationBar degrade />
        </Suspense>
        <Suspense fallback={null}>
          <HeaderSearchSlot>
            <div className="order-last flex w-full justify-center md:order-none md:w-auto md:min-w-0 md:flex-1">
              <div className="w-full md:max-w-xl">
                <SearchPill compact />
              </div>
            </div>
          </HeaderSearchSlot>
        </Suspense>
        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
          <Link href="/tiendas" className={buttonVariants({ variant: "ghost" })}>
            Tiendas
          </Link>
          <Link
            href="/cuenta/favoritos"
            rel="nofollow"
            aria-label="Favoritos"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "rounded-full",
            )}
          >
            <Heart aria-hidden="true" className="size-5" />
          </Link>
          <Suspense fallback={<CartLinkSkeleton />}>
            <CartLink />
          </Suspense>
          <Suspense fallback={<AccountSlotSkeleton />}>
            <AccountSlot />
          </Suspense>
        </div>
      </div>
      <div className="hidden border-t border-border md:block">
        <Suspense fallback={<div className="h-12" />}>
          <CategoryNav />
        </Suspense>
      </div>
    </header>
    </>
  );
}
