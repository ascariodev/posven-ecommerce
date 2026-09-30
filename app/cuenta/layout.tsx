import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cartEnabled } from "@/features/cart/flag";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const SUMMARY_LINK = { href: "/cuenta", label: "Resumen" };
const PURCHASES_LINK = { href: "/cuenta/compras", label: "Mis compras" };
const NAV_LINKS = [
  { href: "/cuenta/perfil", label: "Perfil" },
  { href: "/cuenta/direcciones", label: "Direcciones" },
  { href: "/cuenta/favoritos", label: "Favoritos" },
  { href: "/cuenta/configuracion", label: "Configuración" },
];

export default function AccountLayout({ children }: LayoutProps<"/cuenta">) {
  const links = [SUMMARY_LINK, ...(cartEnabled() ? [PURCHASES_LINK] : []), ...NAV_LINKS];
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Mi cuenta">
        <ul className="flex flex-wrap gap-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={buttonVariants({ variant: "outline", size: "sm" })}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
