import { describe, expect, it } from "vitest";
import { listNearbyStores, searchProducts } from "./adapter";

describe("adaptador simulado", () => {
  it("la búsqueda no distingue mayúsculas ni acentos", async () => {
    const base = { category: null, geo: null, radiusKm: null, page: 1 };
    const upper = await searchProducts({ ...base, q: "ACETAMINOFEN" });
    const accented = await searchProducts({ ...base, q: "acetaminofén" });

    expect(upper.meta.total).toBeGreaterThanOrEqual(3);
    expect(accented).toEqual(upper);
  });

  it("featured queda vacío en la página 2", async () => {
    const response = await searchProducts({
      q: "",
      category: null,
      geo: null,
      radiusKm: null,
      page: 2,
    });

    expect(response.featured).toEqual([]);
  });

  it("con la ciudad caracas sólo devuelve tiendas de Caracas", async () => {
    const response = await listNearbyStores({ geo: { city: "caracas" }, radiusKm: 10, page: 1 });

    expect(response.data.length).toBeGreaterThan(0);
    for (const store of response.data) expect(store.city.slug).toBe("caracas");
  });
});
