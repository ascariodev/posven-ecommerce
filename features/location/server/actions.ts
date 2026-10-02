"use server";

import { cookies } from "next/headers";
import { listLocations } from "@/lib/marketplace/client";
import { MarketplaceUnavailableError } from "@/lib/marketplace/errors";
import type { LocationState } from "@/lib/marketplace/schemas";
import {
  LOCATION_COOKIE,
  describeLocation,
  isValidCoords,
  serializeLocation,
  type UserLocation,
} from "../lib/cookie";

async function saveLocation(loc: UserLocation): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCATION_COOKIE, serializeLocation(loc), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 2592000,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function setLocationFromCoords(lat: number, lng: number): Promise<{ ok: boolean }> {
  if (!isValidCoords(lat, lng)) return { ok: false };
  await saveLocation({ kind: "coords", lat, lng });
  return { ok: true };
}

export async function setLocationCity(citySlug: string): Promise<{ ok: boolean }> {
  const location: UserLocation = { kind: "city", city: citySlug };
  const states = await listLocations();
  if (describeLocation(location, states) === null) return { ok: false };
  await saveLocation(location);
  return { ok: true };
}

export async function loadLocationStates(): Promise<LocationState[] | null> {
  try {
    return await listLocations();
  } catch (error) {
    if (error instanceof MarketplaceUnavailableError) return null;
    throw error;
  }
}

export async function clearLocation(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(LOCATION_COOKIE);
}
