import "server-only";
import { cookies } from "next/headers";
import { LOCATION_COOKIE, parseLocationCookie, type UserLocation } from "./cookie";

export async function getUserLocation(): Promise<UserLocation | null> {
  const cookieStore = await cookies();
  return parseLocationCookie(cookieStore.get(LOCATION_COOKIE)?.value);
}
