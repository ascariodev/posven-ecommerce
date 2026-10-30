type Env = Record<string, string | undefined>;

export function assertProductionEnv(env: Env): void {
  if (env.NODE_ENV !== "production") return;

  const mode = env.MARKETPLACE_MODE;
  if (mode !== "mock" && mode !== "api") {
    throw new Error(
      `MARKETPLACE_MODE debe ser mock o api en producción (recibido: ${mode === undefined || mode === "" ? "vacío" : mode})`,
    );
  }
  if (mode === "api" && !env.SITE_URL) {
    throw new Error("SITE_URL es obligatoria en producción con MARKETPLACE_MODE=api");
  }
}
