"use client";

import { useEffect } from "react";
import type { EventInput } from "@/lib/marketplace/schemas";
import { sendBeaconEvent } from "./beacon";

export function ViewBeacon({ event }: { event: EventInput }) {
  const { type, store_slug, product_slug } = event;

  useEffect(() => {
    sendBeaconEvent({ type, store_slug, product_slug });
  }, [type, store_slug, product_slug]);

  return null;
}
