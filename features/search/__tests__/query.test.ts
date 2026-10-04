import { describe, expect, it } from "vitest";
import { parseSearchQuery, searchHref } from "@/features/search/lib/query";

describe("parseSearchQuery", () => {
  it("lleva un radio que no está entre las opciones a 10", () => {
    expect(parseSearchQuery({ radio: "7" }).radio).toBe(10);
  });

  it("lee radio=pais como todo el país", () => {
    expect(parseSearchQuery({ radio: "pais" }).radio).toBeNull();
  });

  it("acepta un radio de las opciones", () => {
    expect(parseSearchQuery({ radio: "25" }).radio).toBe(25);
  });

  it("sin radio usa 10", () => {
    expect(parseSearchQuery({}).radio).toBe(10);
  });

  it("lleva una página negativa a 1", () => {
    expect(parseSearchQuery({ pagina: "-3" }).pagina).toBe(1);
  });

  it("corta q a 100 caracteres", () => {
    expect(parseSearchQuery({ q: "a".repeat(150) }).q).toHaveLength(100);
  });

  it("recorta q y toma el primer valor de un arreglo", () => {
    expect(parseSearchQuery({ q: ["  acetaminofen  ", "otro"] }).q).toBe("acetaminofen");
  });

  it("descarta una categoría con caracteres fuera de [a-z0-9-]", () => {
    expect(parseSearchQuery({ categoria: "Farmacia!" }).categoria).toBeNull();
    expect(parseSearchQuery({ categoria: "granos-y-harinas" }).categoria).toBe("granos-y-harinas");
  });
});

describe("orden", () => {
  it("lee orden=precio y orden=cercania como sort", () => {
    expect(parseSearchQuery({ orden: "precio" }).sort).toBe("price");
    expect(parseSearchQuery({ orden: "cercania" }).sort).toBe("distance");
  });

  it("sin orden o con un valor desconocido no trae sort", () => {
    expect("sort" in parseSearchQuery({})).toBe(false);
    expect("sort" in parseSearchQuery({ orden: "constructor" })).toBe(false);
  });
});

describe("searchHref", () => {
  it("omite los valores por defecto", () => {
    expect(searchHref({ q: "", categoria: null, radio: 10, pagina: 1 })).toBe("/buscar");
    expect(searchHref({ q: "acetaminofen", categoria: null, radio: 10, pagina: 1 })).toBe(
      "/buscar?q=acetaminofen",
    );
  });

  it("escribe radio=pais para todo el país", () => {
    expect(searchHref({ q: "arroz", categoria: "viveres", radio: null, pagina: 2 })).toBe(
      "/buscar?q=arroz&categoria=viveres&radio=pais&pagina=2",
    );
  });

  it("escribe orden y lo omite sin sort", () => {
    expect(searchHref({ q: "arroz", categoria: null, radio: 10, pagina: 1, sort: "price" })).toBe(
      "/buscar?q=arroz&orden=precio",
    );
    expect(searchHref({ q: "arroz", categoria: null, radio: 10, pagina: 2, sort: "distance" })).toBe(
      "/buscar?q=arroz&orden=cercania&pagina=2",
    );
  });
});
