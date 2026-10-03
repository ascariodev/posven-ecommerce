"use client";

import { ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { accountLinks, isActiveLink } from "../lib/accountLinks";
import { logout } from "../server/actions";

export function AccountNavSkeleton() {
  return (
    <>
      <Skeleton className="hidden h-96 w-full lg:block" />
      <Skeleton className="h-11 w-full lg:hidden" />
    </>
  );
}

// `showPurchases` lo decide el servidor con el interruptor del carrito: aquí no se lee el entorno.
export function AccountNav({ showPurchases }: { showPurchases: boolean }) {
  const pathname = usePathname();
  const links = accountLinks(showPurchases);
  const activeTab = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeTab.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, []);

  return (
    <>
      <nav aria-label="Mi cuenta" className="hidden lg:block">
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3 shadow-card">
          <ul className="flex flex-col gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = isActiveLink(href, pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className="flex min-h-11 items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                  >
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md",
                        active ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="flex-1">{label}</span>
                    <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <form action={logout} className="mt-2 border-t border-border pt-2">
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-muted">
                <LogOut aria-hidden="true" className="size-4" />
              </span>
              Salir
            </button>
          </form>
        </div>
      </nav>
      <nav aria-label="Mi cuenta" className="lg:hidden">
        <ul className="flex gap-1 overflow-x-auto border-b border-border">
          {links.map(({ href, label }) => {
            const active = isActiveLink(href, pathname);
            return (
              <li key={href} className="shrink-0">
                <Link
                  ref={active ? activeTab : undefined}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground",
                    active ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
                  )}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
