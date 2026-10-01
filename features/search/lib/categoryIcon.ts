import {
  Baby,
  CupSoda,
  Package,
  PawPrint,
  Pencil,
  Pill,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  SprayCan,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/marketplace/schemas";

const ROOT_ICONS: Record<string, LucideIcon> = {
  "salud-y-medicamentos": Pill,
  "cuidado-personal": Sparkles,
  "bebes-y-maternidad": Baby,
  alimentos: ShoppingBasket,
  bebidas: CupSoda,
  "hogar-y-limpieza": SprayCan,
  mascotas: PawPrint,
  ferreteria: Wrench,
  tecnologia: Smartphone,
  papeleria: Pencil,
  otros: Package,
};

export function categoryIcon(category: Category | null): LucideIcon {
  if (category === null) return Package;
  return ROOT_ICONS[category.parent_slug ?? category.slug] ?? Package;
}
