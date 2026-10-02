import { describe, expect, it } from "vitest";
import {
  addressCoordsSchema,
  addressSchema,
  billingFormSchema,
  deleteAccountSchema,
  loginSchema,
  profileSchema,
  registerSchema,
} from "../lib/formSchemas";

const REGISTER = { name: "Ana", email: "ana@example.com", phone: "04121234567", password: "secreta-123" };
const ADDRESS = {
  label: "Casa",
  recipient_name: "Ana",
  phone: "04121234567",
  city_slug: "caracas",
  line: "Av. Principal",
  reference: "",
};

describe("formSchemas no son más estrictos que la API", () => {
  it("contraseña de 72 caracteres pasa y de 73 no", () => {
    expect(registerSchema.safeParse({ ...REGISTER, password: "a".repeat(72) }).success).toBe(true);
    expect(registerSchema.safeParse({ ...REGISTER, password: "a".repeat(73) }).success).toBe(false);
  });

  it("contraseña con espacios en los extremos pasa sin recortar", () => {
    const result = registerSchema.safeParse({ ...REGISTER, password: "  abcd  " });
    expect(result.success && result.data.password).toBe("  abcd  ");
  });

  it("borrar cuenta acepta una contraseña de un carácter", () => {
    expect(deleteAccountSchema.safeParse({ password: "x" }).success).toBe(true);
  });

  it("teléfono con +, espacios, paréntesis y guiones pasa", () => {
    expect(registerSchema.safeParse({ ...REGISTER, phone: "+58 (412) 123-4567" }).success).toBe(true);
  });

  it("correo sin dominio de nivel superior pasa", () => {
    expect(loginSchema.safeParse({ email: "a@b", password: "x" }).success).toBe(true);
  });

  it("perfil sin email pasa", () => {
    expect(profileSchema.safeParse({ name: "Ana", phone: "04121234567" }).success).toBe(true);
  });

  it("dirección con referencia vacía pasa", () => {
    expect(addressSchema.safeParse(ADDRESS).success).toBe(true);
  });

  it("coordenadas en los bordes pasan y fuera de rango no", () => {
    expect(addressCoordsSchema.safeParse({ lat: -90, lng: -180 }).success).toBe(true);
    expect(addressCoordsSchema.safeParse({ lat: 90, lng: 180 }).success).toBe(true);
    expect(addressCoordsSchema.safeParse({ lat: 90.1, lng: 0 }).success).toBe(false);
    expect(addressCoordsSchema.safeParse({ lat: 0, lng: -180.1 }).success).toBe(false);
  });
});

describe("billingFormSchema", () => {
  const BILLING = {
    "billing.document_type": "V",
    "billing.document": "12345678",
    "billing.name": "Ana Pérez",
    "billing.phone": "04141234567",
    "billing.address": "Av. Principal, Valencia",
    "billing.taxpayer_type": "ordinary",
  };
  const failing = (patch: Record<string, string>): string[] => {
    const result = billingFormSchema.safeParse({ ...BILLING, ...patch });
    return result.success ? [] : result.error.issues.map((issue) => String(issue.path[0]));
  };

  it("acepta datos válidos y los bordes de documento, nombre y dirección", () => {
    expect(failing({})).toEqual([]);
    expect(failing({ "billing.document": "12345" })).toEqual([]);
    expect(failing({ "billing.document": "123456789" })).toEqual([]);
    expect(failing({ "billing.name": "a".repeat(100) })).toEqual([]);
    expect(failing({ "billing.address": "12345678" })).toEqual([]);
    expect(failing({ "billing.address": "a".repeat(250) })).toEqual([]);
  });

  it("rechaza fuera de rango", () => {
    expect(failing({ "billing.document": "1234" })).toEqual(["billing.document"]);
    expect(failing({ "billing.document": "1234567890" })).toEqual(["billing.document"]);
    expect(failing({ "billing.document": "12a45" })).toEqual(["billing.document"]);
    expect(failing({ "billing.name": "a".repeat(101) })).toEqual(["billing.name"]);
    expect(failing({ "billing.address": "1234567" })).toEqual(["billing.address"]);
    expect(failing({ "billing.address": "a".repeat(251) })).toEqual(["billing.address"]);
  });

  it("el teléfono acepta los siete prefijos con 11 dígitos y rechaza el resto", () => {
    for (const prefix of ["0212", "0412", "0422", "0414", "0424", "0416", "0426"]) {
      expect(failing({ "billing.phone": `${prefix}1234567` })).toEqual([]);
    }
    expect(failing({ "billing.phone": "02511234567" })).toEqual(["billing.phone"]);
    expect(failing({ "billing.phone": "0414123456" })).toEqual(["billing.phone"]);
    expect(failing({ "billing.phone": "041412345678" })).toEqual(["billing.phone"]);
    expect(failing({ "billing.phone": "+584141234567" })).toEqual(["billing.phone"]);
  });

  it("tipo de documento y de contribuyente sólo aceptan el catálogo", () => {
    for (const type of ["V", "E", "J", "G"]) expect(failing({ "billing.document_type": type })).toEqual([]);
    for (const type of ["", "P", "v"]) expect(failing({ "billing.document_type": type })).toEqual(["billing.document_type"]);
    for (const type of ["special", "ordinary"]) expect(failing({ "billing.taxpayer_type": type })).toEqual([]);
    expect(failing({ "billing.taxpayer_type": "formal" })).toEqual(["billing.taxpayer_type"]);
  });
});
