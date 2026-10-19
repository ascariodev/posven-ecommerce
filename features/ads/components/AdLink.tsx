"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { sendBeaconEvent } from "@/features/events/lib/beacon";
import type { Piece } from "@/lib/marketplace/schemas";

export function AdLink({
  piece,
  children,
  className,
}: {
  piece: Pick<Piece, "href" | "external" | "token">;
  children: ReactNode;
  className?: string;
}) {
  const registerClick = () => sendBeaconEvent({ type: "ad_click", ad_token: piece.token });

  if (piece.external) {
    return (
      <a href={piece.href} target="_blank" rel="sponsored noopener" onClick={registerClick} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={piece.href} onClick={registerClick} className={className}>
      {children}
    </Link>
  );
}
