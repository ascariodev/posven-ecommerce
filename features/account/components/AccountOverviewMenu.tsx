import { ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { accountListLinks, accountQuickLinks } from "../lib/accountLinks";
import { logout } from "../server/actions";

export function AccountQuickLinks({ showPurchases }: { showPurchases: boolean }) {
  return (
    <nav aria-label="Accesos" className="lg:hidden">
      <Card size="sm" className="flex-row gap-0 py-0">
        {accountQuickLinks(showPurchases).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-11 flex-1 flex-col items-center gap-2 px-1.5 py-3.5 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            {label}
          </Link>
        ))}
      </Card>
    </nav>
  );
}

export function AccountMenuList() {
  const rowClass =
    "flex min-h-13 w-full items-center gap-3 px-3.5 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground";
  return (
    <Card size="sm" className="gap-0 py-0 lg:hidden">
      <ul className="flex flex-col">
        {accountListLinks().map(({ href, label, icon: Icon }) => (
          <li key={href} className="border-b border-border">
            <Link href={href} className={`${rowClass} text-foreground`}>
              <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
              <span className="flex-1">{label}</span>
              <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
        <li>
          <form action={logout}>
            <button type="submit" className={`${rowClass} text-destructive-text`}>
              <LogOut aria-hidden="true" className="size-5" />
              Cerrar sesión
            </button>
          </form>
        </li>
      </ul>
    </Card>
  );
}
