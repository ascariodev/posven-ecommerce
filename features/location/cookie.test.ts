import { describe, expect, it } from "vitest";
import type { LocationState } from "@/lib/marketplace/schemas";
import { describeLocation, parseLocationCookie, serializeLocation, toGeoFilter } from "./cookie";

const states: LocationState[] = [
  {
    slug: "carabobo",
    name: "Carabobo",
    municipalities: [{ slug: "valencia", name: "Valencia", cities: [{ slug: "valencia", name: "Valencia" }] }],
  },
];

describe("parseLocationCookie", () => {
  it("lee coordenadas de un JSON válido", () => {
    expect(parseLocationCookie('{"lat":10.162,"lng":-68.007}')).toEqual({
      kind: "coords",
      lat: 10.162,
      lng: -68.007,
    });
  });

  it("lee una ciudad de un JSON válido", () => {
    expect(parseLocationCookie('{"city":"valencia"}')).toEqual({ kind: "city", city: "valencia" });
  });

  it("devuelve null ante texto basura (RN-LOCATION-02)", () => {
    expect(parseLocationCookie("no-es-json{")).toBeNull();
    expect(parseLocationCookie(undefined)).toBeNull();
  });

  it("devuelve null con lat fuera de [-90, 90] (RN-LOCATION-02)", () => {
    expect(parseLocationCookie('{"lat":91,"lng":-68.007}')).toBeNull();
  });
});

describe("serializeLocation", () => {
  it("redondea las coordenadas a 3 decimales (RN-LOCATION-01)", () => {
    expect(serializeLocation({ kind: "coords", lat: 10.16249, lng: -68.00749 })).toBe(
      '{"lat":10.162,"lng":-68.007}',
    );
  });

  it("guarda la ciudad por su slug", () => {
    expect(serializeLocation({ kind: "city", city: "valencia" })).toBe('{"city":"valencia"}');
  });
});

describe("toGeoFilter", () => {
  it("traduce cada ubicación al filtro del cliente", () => {
    expect(toGeoFilter(null)).toBeNull();
    expect(toGeoFilter({ kind: "coords", lat: 10.162, lng: -68.007 })).toEqual({ lat: 10.162, lng: -68.007 });
    expect(toGeoFilter({ kind: "city", city: "valencia" })).toEqual({ city: "valencia" });
  });
});

describe("describeLocation", () => {
  it("describe las coordenadas como la ubicación actual", () => {
    expect(describeLocation({ kind: "coords", lat: 10.162, lng: -68.007 }, states)).toBe("Tu ubicación actual");
  });

  it("describe una ciudad conocida por su nombre", () => {
    expect(describeLocation({ kind: "city", city: "valencia" }, states)).toBe("Valencia");
  });

  it("devuelve null con una ciudad desconocida o sin ubicación", () => {
    expect(describeLocation({ kind: "city", city: "maracaibo" }, states)).toBeNull();
    expect(describeLocation(null, states)).toBeNull();
  });
});
