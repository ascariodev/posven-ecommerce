import { describe, expect, it } from "vitest";
import {
  addressCoordsSchema,
  addressSchema,
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
