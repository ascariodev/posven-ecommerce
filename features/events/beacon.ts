import type { EventInput } from "@/lib/marketplace/schemas";

const EVENTS_ENDPOINT = "/api/events";

export function sendBeaconEvent(input: EventInput): void {
  try {
    const body = JSON.stringify(input);
    // Un tipo que no es "simple" para CORS hace fallar a sendBeacon en Chromium.
    const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(EVENTS_ENDPOINT, blob)) return;
    fetch(EVENTS_ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => undefined);
  } catch {
    return;
  }
}
