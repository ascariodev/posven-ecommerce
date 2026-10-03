import { beforeEach, describe, expect, it } from "vitest";
import { MarketplaceAccountError } from "@/lib/marketplace/errors";
import type { AccountContext } from "@/lib/marketplace/params";
import type { AddressInput, Billing } from "@/lib/marketplace/schemas";
import {
  addFavorite,
  createAddress,
  getMe,
  listAddresses,
  listFavorites,
  loginCustomer,
  registerCustomer,
  requestPasswordReset,
  resetMockAccounts,
  resetPassword,
  updateAddress,
  updateMe,
  verifyEmail,
} from "@/lib/marketplace/mock/accounts";
import {
  MOCK_EXPIRED_TOKEN,
  MOCK_RATE_LIMITED_EMAIL,
  MOCK_RESET_TOKEN,
  MOCK_VERIFY_TOKEN,
} from "@/lib/marketplace/mock/fixtures";

const anonymous: AccountContext = { session: null, clientIp: null };
const seeded = { email: "comprador@posven.test", password: "clave-segura-1" };

const newCustomer = {
  name: "Nueva compradora",
  email: "nueva@posven.test",
  phone: "04121112233",
  password: "otra-clave-1",
  billing: {
    document_type: "V" as const,
    document: "12345678",
    address: "Av. Principal, Valencia",
    taxpayer_type: "ordinary" as const,
  },
};

const office: AddressInput = {
  label: "Oficina",
  recipient_name: "Comprador de prueba",
  phone: "+584141234567",
  city_slug: "valencia",
  line: "Av. Cedeño, torre Norte, piso 8",
  reference: null,
  lat: 10.17,
  lng: -68.0,
};

async function captureAccountError(promise: Promise<unknown>): Promise<MarketplaceAccountError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof MarketplaceAccountError) return error;
    throw error;
  }
  throw new Error("se esperaba un MarketplaceAccountError");
}

async function sessionOf(credentials: { email: string; password: string }): Promise<AccountContext> {
  const { token } = await loginCustomer(anonymous, credentials);
  return { session: token, clientIp: null };
}

beforeEach(() => {
  resetMockAccounts();
});

describe("simulado de cuentas: acceso", () => {
  it("un correo ya registrado da validation_failed en email", async () => {
    const error = await captureAccountError(
      registerCustomer(anonymous, { ...newCustomer, email: " Comprador@Posven.test " }),
    );

    expect(error.status).toBe(422);
    expect(error.code).toBe("validation_failed");
    expect(error.fields?.email).toBe("El correo ya está registrado.");
  });

  it("un login errado da invalid_credentials", async () => {
    const error = await captureAccountError(
      loginCustomer(anonymous, { ...seeded, password: "otra-cosa-1" }),
    );

    expect(error.status).toBe(422);
    expect(error.code).toBe("invalid_credentials");
  });

  it("MOCK_VERIFY_TOKEN verifica al recién registrado", async () => {
    const { token } = await registerCustomer(anonymous, newCustomer);
    const ctx = { session: token, clientIp: null };
    expect((await getMe(ctx)).email_verified).toBe(false);

    await verifyEmail(anonymous, MOCK_VERIFY_TOKEN);

    expect((await getMe(ctx)).email_verified).toBe(true);
  });

  it("MOCK_EXPIRED_TOKEN da token_expired", async () => {
    await registerCustomer(anonymous, newCustomer);

    const error = await captureAccountError(verifyEmail(anonymous, MOCK_EXPIRED_TOKEN));

    expect(error.code).toBe("token_expired");
  });

  it("otro token da token_invalid", async () => {
    await registerCustomer(anonymous, newCustomer);

    const error = await captureAccountError(verifyEmail(anonymous, "cualquier-otro"));

    expect(error.code).toBe("token_invalid");
  });

  it("restablecer la contraseña revoca la sesión anterior", async () => {
    const ctx = await sessionOf(seeded);
    await requestPasswordReset(anonymous, seeded.email);

    await resetPassword(anonymous, { token: MOCK_RESET_TOKEN, password: "clave-nueva-1" });

    const error = await captureAccountError(getMe(ctx));
    expect(error.status).toBe(401);
    expect(error.code).toBe("unauthenticated");
    await expect(sessionOf({ ...seeded, password: "clave-nueva-1" })).resolves.toBeDefined();
  });

  it("MOCK_RATE_LIMITED_EMAIL da 429 con retryAfter 42", async () => {
    const error = await captureAccountError(
      loginCustomer(anonymous, { email: MOCK_RATE_LIMITED_EMAIL, password: "lo-que-sea-1" }),
    );

    expect(error.status).toBe(429);
    expect(error.code).toBe("too_many_attempts");
    expect(error.retryAfter).toBe(42);
    expect(error.message).toBe("Demasiados intentos. Prueba de nuevo en 42 segundos.");
  });

  it("una sesión desconocida da 401", async () => {
    const error = await captureAccountError(getMe({ session: "1|desconocida", clientIp: null }));

    expect(error.status).toBe(401);
    expect(error.code).toBe("unauthenticated");
  });
});

describe("simulado de cuentas: perfil", () => {
  it("cambiar el correo sin current_password pide la contraseña y no guarda nada (RN-MKT-19)", async () => {
    const ctx = await sessionOf(seeded);

    const error = await captureAccountError(
      updateMe(ctx, { name: "Otro nombre", email: "nuevo@posven.test" }),
    );

    expect(error.code).toBe("validation_failed");
    expect(error.fields).toEqual({
      current_password: "Ingresa tu contraseña actual para cambiar el correo.",
    });
    const customer = await getMe(ctx);
    expect(customer.name).toBe("Comprador de prueba");
    expect(customer.pending_email).toBeNull();
  });
});

describe("simulado de cuentas: direcciones", () => {
  it("la primera dirección queda predeterminada y marcar otra desmarca la anterior", async () => {
    const { token } = await registerCustomer(anonymous, newCustomer);
    const ctx = { session: token, clientIp: null };

    const first = await createAddress(ctx, office);
    const second = await createAddress(ctx, { ...office, label: "Casa", is_default: true });

    expect(first.is_default).toBe(true);
    expect(second.is_default).toBe(true);
    const listed = await listAddresses(ctx);
    expect(listed.map((address) => [address.id, address.is_default])).toEqual([
      [second.id, true],
      [first.id, false],
    ]);
  });

  it("is_default false sobre la predeterminada la deja predeterminada", async () => {
    const ctx = await sessionOf(seeded);

    const updated = await updateAddress(ctx, 1, { label: "Casa de mamá", is_default: false });

    expect(updated.label).toBe("Casa de mamá");
    expect(updated.is_default).toBe(true);
  });

  it("listAddresses da la predeterminada primero y luego por id", async () => {
    const ctx = await sessionOf(seeded);
    const second = await createAddress(ctx, office);
    const third = await createAddress(ctx, { ...office, label: "Depósito", is_default: true });

    const listed = await listAddresses(ctx);

    expect(listed.map((address) => address.id)).toEqual([third.id, 1, second.id]);
  });
});

describe("simulado de cuentas: favoritos", () => {
  it("listFavorites da primero el último marcado", async () => {
    const ctx = await sessionOf(seeded);
    await addFavorite(ctx, { kind: "product", slug: "acetaminofen-500-mg-20-tabletas" });
    await addFavorite(ctx, { kind: "product", slug: "malta-355-ml" });
    await addFavorite(ctx, { kind: "product", slug: "acetaminofen-500-mg-20-tabletas" });

    const response = await listFavorites(ctx);

    expect(response.products.map((product) => product.slug)).toEqual([
      "malta-355-ml",
      "acetaminofen-500-mg-20-tabletas",
    ]);
  });

  it("un slug desconocido da 404", async () => {
    const ctx = await sessionOf(seeded);

    const error = await captureAccountError(addFavorite(ctx, { kind: "store", slug: "no-existe" }));

    expect(error.status).toBe(404);
    expect(error.code).toBe("not_found");
  });
});

describe("simulado de cuentas: registro con facturación", () => {
  it("guarda billing con el nombre y el teléfono de la cuenta", async () => {
    const { token, customer } = await registerCustomer(anonymous, newCustomer);

    expect(customer.billing).toEqual({
      ...newCustomer.billing,
      name: newCustomer.name,
      phone: newCustomer.phone,
    });
    expect((await getMe({ session: token, clientIp: null })).billing).toEqual(customer.billing);
  });

  it("billing inválido da validation_failed: documento y dirección como billing.<campo>, nombre y teléfono como name y phone", async () => {
    const error = await captureAccountError(
      registerCustomer(anonymous, {
        ...newCustomer,
        name: "x".repeat(101),
        phone: "+584121112233",
        billing: { ...newCustomer.billing, document: "12", address: "corta" },
      }),
    );

    expect(error.status).toBe(422);
    expect(error.code).toBe("validation_failed");
    expect(Object.keys(error.fields ?? {}).sort()).toEqual(["billing.address", "billing.document", "name", "phone"]);
  });

  it("acepta un teléfono de la regla del TPV y rechaza uno fuera de ella", async () => {
    const accepted = await registerCustomer(anonymous, { ...newCustomer, phone: "02121234567" });
    expect(accepted.customer.phone).toBe("02121234567");

    const error = await captureAccountError(
      registerCustomer(anonymous, { ...newCustomer, email: "otra@posven.test", phone: "04111234567" }),
    );
    expect(Object.keys(error.fields ?? {})).toEqual(["phone"]);
  });
});

describe("simulado de cuentas: datos de facturación", () => {
  const billing: Billing = {
    document_type: "J",
    document: "123456789",
    name: "Farmacia Sol, C.A.",
    phone: "04141234567",
    address: "Av. Bolívar Norte, edificio Sol, Valencia",
    taxpayer_type: "special",
  };

  it("guarda un billing válido y getMe lo devuelve", async () => {
    const ctx = await sessionOf(seeded);

    const customer = await updateMe(ctx, { billing });

    expect(customer.billing).toEqual(billing);
    expect((await getMe(ctx)).billing).toEqual(billing);
  });

  it("un billing inválido da validation_failed con claves billing.<campo> y no guarda nada", async () => {
    const ctx = await sessionOf(seeded);

    const error = await captureAccountError(
      updateMe(ctx, { billing: { ...billing, document: "12", phone: "0511234567", address: "corta" } }),
    );

    expect(error.status).toBe(422);
    expect(error.code).toBe("validation_failed");
    expect(Object.keys(error.fields ?? {}).sort()).toEqual(["billing.address", "billing.document", "billing.phone"]);
    expect((await getMe(ctx)).billing).toBeNull();
  });

  it("billing null borra los datos", async () => {
    const ctx = await sessionOf(seeded);
    await updateMe(ctx, { billing });

    const customer = await updateMe(ctx, { billing: null });

    expect(customer.billing).toBeNull();
  });
});
