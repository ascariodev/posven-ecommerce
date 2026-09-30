"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function HeaderSearchSlot({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/buscar")) return null;
  return children;
}
