import { describe, expect, it } from "vitest";
import { assertProductionEnv } from "@/lib/env";

describe("assertProductionEnv", () => {
  it("lanza en producción sin MARKETPLACE_MODE", () => {
    expect(() => assertProductionEnv({ NODE_ENV: "production" })).toThrow(/MARKETPLACE_MODE/);
    expect(() => assertProductionEnv({ NODE_ENV: "production", MARKETPLACE_MODE: "" })).toThrow(
      /MARKETPLACE_MODE/,
    );
  });

  it("lanza en producción con un modo inválido", () => {
    expect(() =>
      assertProductionEnv({ NODE_ENV: "production", MARKETPLACE_MODE: "API", SITE_URL: "https://posven.io" }),
    ).toThrow(/MARKETPLACE_MODE/);
  });

  it("lanza en producción con api y sin SITE_URL", () => {
    expect(() => assertProductionEnv({ NODE_ENV: "production", MARKETPLACE_MODE: "api" })).toThrow(
      /SITE_URL/,
    );
  });

  it("pasa en producción con api y SITE_URL", () => {
    expect(() =>
      assertProductionEnv({ NODE_ENV: "production", MARKETPLACE_MODE: "api", SITE_URL: "https://posven.io" }),
    ).not.toThrow();
  });

  it("pasa en producción con mock aunque falte SITE_URL", () => {
    expect(() => assertProductionEnv({ NODE_ENV: "production", MARKETPLACE_MODE: "mock" })).not.toThrow();
  });

  it("no exige nada fuera de producción", () => {
    expect(() => assertProductionEnv({ NODE_ENV: "development" })).not.toThrow();
    expect(() => assertProductionEnv({ NODE_ENV: "test" })).not.toThrow();
    expect(() => assertProductionEnv({})).not.toThrow();
  });
});
