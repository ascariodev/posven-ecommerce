import { Heart, LayoutDashboard, MapPin, Receipt, Settings, UserRound, type LucideIcon } from "lucide-react";

export type AccountLink = { href: string; label: string; icon: LucideIcon };

const SUMMARY_LINK: AccountLink = { href: "/cuenta", label: "Resumen", icon: LayoutDashboard };
const PURCHASES_LINK: AccountLink = { href: "/cuenta/compras", label: "Mis compras", icon: Receipt };
const OTHER_LINKS: AccountLink[] = [
  { href: "/cuenta/perfil", label: "Perfil", icon: UserRound },
  { href: "/cuenta/direcciones", label: "Direcciones", icon: MapPin },
  { href: "/cuenta/favoritos", label: "Favoritos", icon: Heart },
  { href: "/cuenta/configuracion", label: "Configuración", icon: Settings },
];

export function accountLinks(showPurchases: boolean): AccountLink[] {
  return [SUMMARY_LINK, ...(showPurchases ? [PURCHASES_LINK] : []), ...OTHER_LINKS];
}

export function isActiveLink(href: string, pathname: string): boolean {
  if (href === "/cuenta") return pathname === "/cuenta";
  return pathname === href || pathname.startsWith(`${href}/`);
}
