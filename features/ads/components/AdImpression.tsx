"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { sendBeaconEvent } from "@/features/events/lib/beacon";

export const IMPRESSION_VISIBLE_RATIO = 0.5;
export const IMPRESSION_DWELL_MS = 1000;

export function AdImpression({ token, children, className }: { token: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let sent = false;
    const clear = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry === undefined) return;
        if (!entry.isIntersecting || entry.intersectionRatio < IMPRESSION_VISIBLE_RATIO) {
          clear();
          return;
        }
        if (sent || timer !== null) return;
        timer = setTimeout(() => {
          timer = null;
          sent = true;
          observer.disconnect();
          sendBeaconEvent({ type: "ad_impression", ad_token: token });
        }, IMPRESSION_DWELL_MS);
      },
      { threshold: IMPRESSION_VISIBLE_RATIO },
    );
    observer.observe(element);
    return () => {
      clear();
      observer.disconnect();
    };
  }, [token]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
