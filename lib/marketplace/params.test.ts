import { describe, expect, it } from "vitest";
import { searchQuery, storesQuery } from "./params";

const LOCATION_KEYS = ["lat", "lng", "city", "radius_km"];

function keysOf(query: URLSearchParams): string[] {
  return [...query.keys()];
}

describe("searchQuery", () => {
  it("sin geo no envía ubicación aunque haya radio (RN-MARKETPLACE-03)", () => {
    const query = searchQuery({ q: "arroz", category: null, geo: null, radiusKm: 25, page: 1 });
    for (const key of LOCATION_KEYS) expect(query.has(key)).toBe(false);
  });

  it("con coordenadas y radio envía lat, lng y radius_km", () => {
    const query = searchQuery({
      q: "arroz",
      category: null,
      geo: { lat: 10.18, lng: -68.01 },
      radiusKm: 25,
      page: 1,
    });
    expect(query.get("lat")).toBe("10.18");
    expect(query.get("lng")).toBe("-68.01");
    expect(query.get("radius_km")).toBe("25");
  });

  it("con coordenadas y todo el país envía lat y lng sin radius_km", () => {
    const query = searchQuery({
      q: "arroz",
      category: null,
      geo: { lat: 10.18, lng: -68.01 },
      radiusKm: null,
      page: 1,
    });
    expect(query.has("lat")).toBe(true);
    expect(query.has("lng")).toBe(true);
    expect(query.has("radius_km")).toBe(false);
  });

  it("con ciudad y radio envía city sin radius_km", () => {
    const query = searchQuery({
      q: "arroz",
      category: null,
      geo: { city: "valencia" },
      radiusKm: 10,
      page: 1,
    });
    expect(query.get("city")).toBe("valencia");
    expect(query.has("radius_km")).toBe(false);
  });

  it("con ciudad y todo el país no envía ubicación", () => {
    const query = searchQuery({
      q: "arroz",
      category: null,
      geo: { city: "valencia" },
      radiusKm: null,
      page: 1,
    });
    for (const key of LOCATION_KEYS) expect(query.has(key)).toBe(false);
  });

  it("omite q vacío y category null", () => {
    const query = searchQuery({ q: "", category: null, geo: null, radiusKm: 10, page: 2 });
    expect(keysOf(query)).toEqual(["page"]);
    expect(query.get("page")).toBe("2");
  });
});

describe("storesQuery", () => {
  it("sin geo no envía ubicación aunque haya radio (RN-MARKETPLACE-03)", () => {
    const query = storesQuery({ geo: null, radiusKm: 25, page: 1 });
    expect(keysOf(query)).toEqual(["page"]);
  });
});
