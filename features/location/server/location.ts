import "server-only";
import { cookies } from "next/headers";
import { listLocations } from "@/lib/marketplace/client";
import { describeLocation, LOCATION_COOKIE, parseLocationCookie, type UserLocation } from "../lib/cookie";

export async function getUserLocation(): Promise<UserLocation | null> {
  const cookieStore = await cookies();
  return parseLocationCookie(cookieStore.get(LOCATION_COOKIE)?.value);
}

export async function getEffectiveLocation(): Promise<{ location: UserLocation | null; name: string | null }> {
  const [stored, states] = await Promise.all([getUserLocation(), listLocations()]);
  const name = describeLocation(stored, states);
  return name === null ? { location: null, name: null } : { location: stored, name };
}
