import { describe, expect, it } from "vitest";
import { loginHref, safeReturnPath } from "@/features/account/lib/returnPath";

describe("safeReturnPath (RN-ACCOUNT-02)", () => {
  it("acepta una ruta interna con consulta", () => {
    expect(safeReturnPath("/p/x?y=1")).toBe("/p/x?y=1");
  });

  it.each([
    ["//evil.test"],
    ["/\\evil.test"],
    ["https://evil.test"],
    ["cuenta"],
    [""],
    [undefined],
    [`/${"a".repeat(512)}`],
  ])("devuelve /cuenta ante %j", (raw) => {
    expect(safeReturnPath(raw)).toBe("/cuenta");
  });
});

describe("loginHref", () => {
  it("codifica la ruta de vuelta", () => {
    expect(loginHref("/cuenta")).toBe("/entrar?volver=%2Fcuenta");
  });
});
