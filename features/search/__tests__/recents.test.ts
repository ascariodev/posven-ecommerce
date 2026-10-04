import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_RECENTS, addRecent, readRecents } from "@/features/search/lib/recents";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("recientes del navegador", () => {
  it("guarda el más nuevo primero y sin repetir aunque cambie la mayúscula", () => {
    addRecent("leche");
    addRecent("harina");
    expect(addRecent("  LECHE ")).toEqual(["LECHE", "harina"]);
  });

  it("conserva sólo los últimos cinco", () => {
    for (let n = 1; n <= MAX_RECENTS + 2; n += 1) addRecent(`term ${n}`);
    expect(readRecents()).toHaveLength(MAX_RECENTS);
    expect(readRecents()[0]).toBe(`term ${MAX_RECENTS + 2}`);
  });

  it("ignora un término vacío y un valor guardado corrupto", () => {
    expect(addRecent("   ")).toEqual([]);
    window.localStorage.setItem("recent-searches", "{no es json");
    expect(readRecents()).toEqual([]);
    window.localStorage.setItem("recent-searches", JSON.stringify([1, "ok"]));
    expect(readRecents()).toEqual(["ok"]);
  });

  it("con localStorage bloqueado no lanza y devuelve vacío", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("denegado", "SecurityError");
    });
    expect(readRecents()).toEqual([]);
    expect(() => addRecent("leche")).not.toThrow();
  });

  it("si setItem falla (cuota), devuelve lo que había", () => {
    addRecent("leche");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("lleno", "QuotaExceededError");
    });
    expect(addRecent("harina")).toEqual(["leche"]);
  });
});
