"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function HeaderSearchSlot({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/buscar")) return null;
  return <div className="flex w-full items-center gap-3 sm:w-auto sm:flex-1">{children}</div>;
}
