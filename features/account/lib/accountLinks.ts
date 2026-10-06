import {
  CircleQuestionMark,
  Heart,
  LayoutDashboard,
  MapPin,
  Receipt,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type AccountLink = { href: string; label: string; icon: LucideIcon };

const SUMMARY_LINK: AccountLink = { href: "/cuenta", label: "Resumen", icon: LayoutDashboard };
const PURCHASES_LINK: AccountLink = { href: "/cuenta/compras", label: "Compras", icon: Receipt };
const FAVORITES_LINK: AccountLink = { href: "/cuenta/favoritos", label: "Favoritos", icon: Heart };
const ADDRESSES_LINK: AccountLink = { href: "/cuenta/direcciones", label: "Direcciones", icon: MapPin };
const PROFILE_LINK: AccountLink = { href: "/cuenta/perfil", label: "Perfil y facturación", icon: UserRound };
const SETTINGS_LINK: AccountLink = { href: "/cuenta/configuracion", label: "Configuración", icon: Settings };
const HELP_LINK: AccountLink = { href: "/ayuda", label: "Ayuda", icon: CircleQuestionMark };

export function accountQuickLinks(showPurchases: boolean): AccountLink[] {
  return [...(showPurchases ? [PURCHASES_LINK] : []), FAVORITES_LINK, ADDRESSES_LINK];
}

export function accountListLinks(): AccountLink[] {
  return [PROFILE_LINK, SETTINGS_LINK, HELP_LINK];
}

export function accountLinks(showPurchases: boolean): AccountLink[] {
  return [SUMMARY_LINK, ...accountQuickLinks(showPurchases), ...accountListLinks()];
}

export function isActiveLink(href: string, pathname: string): boolean {
  if (href === "/cuenta") return pathname === "/cuenta";
  return pathname === href || pathname.startsWith(`${href}/`);
}
