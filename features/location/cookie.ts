import type { GeoFilter } from "@/lib/marketplace/params";
import type { LocationState } from "@/lib/marketplace/schemas";

export const LOCATION_COOKIE = "loc";

export type UserLocation = { kind: "coords"; lat: number; lng: number } | { kind: "city"; city: string };

function isLatitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isLongitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidCoords(lat: number, lng: number): boolean {
  return isLatitude(lat) && isLongitude(lng);
}

export function parseLocationCookie(raw: string | undefined): UserLocation | null {
  if (raw === undefined) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if ("lat" in record || "lng" in record) {
    return isLatitude(record.lat) && isLongitude(record.lng)
      ? { kind: "coords", lat: record.lat, lng: record.lng }
      : null;
  }
  if (typeof record.city === "string" && record.city !== "") {
    return { kind: "city", city: record.city };
  }
  return null;
}

function roundTo3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function serializeLocation(loc: UserLocation): string {
  if (loc.kind === "coords") {
    return JSON.stringify({ lat: roundTo3(loc.lat), lng: roundTo3(loc.lng) });
  }
  return JSON.stringify({ city: loc.city });
}

export function toGeoFilter(loc: UserLocation | null): GeoFilter {
  if (loc === null) return null;
  if (loc.kind === "coords") return { lat: loc.lat, lng: loc.lng };
  return { city: loc.city };
}

export function describeLocation(loc: UserLocation | null, states: LocationState[]): string | null {
  if (loc === null) return null;
  if (loc.kind === "coords") return "Tu ubicación actual";
  for (const state of states) {
    for (const municipality of state.municipalities) {
      const city = municipality.cities.find((candidate) => candidate.slug === loc.city);
      if (city) return city.name;
    }
  }
  return null;
}
