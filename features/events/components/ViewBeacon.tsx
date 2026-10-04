"use client";

import { useEffect } from "react";
import type { EventInput } from "@/lib/marketplace/schemas";
import { sendBeaconEvent } from "../lib/beacon";

export function ViewBeacon({ event }: { event: EventInput }) {
  const { type, store_slug, product_slug, query, category_slug, results_count } = event;

  useEffect(() => {
    sendBeaconEvent({ type, store_slug, product_slug, query, category_slug, results_count });
  }, [type, store_slug, product_slug, query, category_slug, results_count]);

  return null;
}
