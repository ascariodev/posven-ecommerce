import { assertProductionEnv } from "@/lib/env";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") assertProductionEnv(process.env);
}
