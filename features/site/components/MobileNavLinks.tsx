"use client";

import { Heart, House, Search, ShoppingBag, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loginHref } from "@/features/account/lib/returnPath";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; icon: LucideIcon; active: boolean; badge?: number };

function tabs({
  pathname,
  signedIn,
  cartEnabled,
  cartCount,
}: {
  pathname: string;
  signedIn: boolean;
  cartEnabled: boolean;
  cartCount: number | null;
}): Tab[] {
  const onFavorites = pathname === "/cuenta/favoritos";
  const list: Tab[] = [
    { href: "/", label: "Inicio", icon: House, active: pathname === "/" },
    { href: "/buscar", label: "Buscar", icon: Search, active: pathname.startsWith("/buscar") },
    {
      href: signedIn ? "/cuenta/favoritos" : loginHref("/cuenta/favoritos"),
      label: "Favoritos",
      icon: Heart,
      active: onFavorites,
    },
  ];
  if (cartEnabled) {
    list.push({
      href: "/carrito",
      label: "Carrito",
      icon: ShoppingBag,
      active: pathname.startsWith("/carrito"),
      badge: cartCount ?? 0,
    });
  }
  list.push({
    href: signedIn ? "/cuenta" : loginHref("/cuenta"),
    label: "Cuenta",
    icon: User,
    active: pathname.startsWith("/cuenta") && !onFavorites,
  });
  return list;
}

function cartName(count: number): string {
  if (count === 0) return "Carrito";
  return `Carrito, ${count} ${count === 1 ? "producto" : "productos"}`;
}

export function MobileNavLinks({
  signedIn,
  cartEnabled,
  cartCount,
}: {
  signedIn: boolean;
  cartEnabled: boolean;
  cartCount: number | null;
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {tabs({ pathname, signedIn, cartEnabled, cartCount }).map(({ href, label, icon: Icon, active, badge }) => (
          <li key={label} className="flex-1">
            <Link
              href={href}
              rel={label === "Inicio" || label === "Buscar" ? undefined : "nofollow"}
              aria-current={active ? "page" : undefined}
              aria-label={badge === undefined ? undefined : cartName(badge)}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "relative flex h-7 w-12 items-center justify-center rounded-full",
                  active && "bg-primary-soft"
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                {badge !== undefined && badge > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
                  >
                    {badge}
                  </span>
                )}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
