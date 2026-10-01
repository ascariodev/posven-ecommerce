import { cacheLife } from "next/cache";

export async function footerYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
