import { MarketplaceAccountError } from "../errors";
import type { AccountContext, FavoriteTarget } from "../params";
import type {
  AccountErrorCode,
  Address,
  AddressInput,
  AddressPatch,
  AuthResponse,
  Billing,
  CityRef,
  Customer,
  FavoritesResponse,
  Product,
  ProfilePatch,
  Quote,
  RegisterInput,
  StoreSummary,
} from "../schemas";
import {
  MOCK_ACCOUNT_SEED,
  MOCK_EXPIRED_TOKEN,
  MOCK_LOCATIONS,
  MOCK_PRODUCTS,
  MOCK_RATE_LIMITED_EMAIL,
  MOCK_RESET_TOKEN,
  MOCK_STORES,
  MOCK_UNAVAILABLE_PRODUCTS,
  MOCK_VERIFY_TOKEN,
  type MockAccount,
} from "./fixtures";

const RATE_LIMIT_RETRY_AFTER_S = 42;
const MIN_PASSWORD_LENGTH = 8;
const RESERVED_EMAIL_DOMAIN = "@anonimo.invalid";

type MockAccountsState = {
  accounts: Map<number, MockAccount>;
  tokens: Map<string, number>;
  nextCustomerId: number;
  nextAddressId: number;
  pendingVerification: { customerId: number; email: string } | null;
  pendingReset: number | null;
};

// En globalThis y no en el módulo: el servidor de desarrollo puede evaluar este archivo más de una vez.
const STATE_KEY = Symbol.for("posven.mockAccounts");
const stateHolder = globalThis as unknown as Record<symbol, MockAccountsState | undefined>;

function createState(): MockAccountsState {
  const seed = structuredClone(MOCK_ACCOUNT_SEED);
  const addressIds = seed.flatMap((account) => account.addresses.map((address) => address.id));
  return {
    accounts: new Map(seed.map((account) => [account.id, account])),
    tokens: new Map(),
    nextCustomerId: Math.max(0, ...seed.map((account) => account.id)) + 1,
    nextAddressId: Math.max(0, ...addressIds) + 1,
    pendingVerification: null,
    pendingReset: null,
  };
}

function state(): MockAccountsState {
  return (stateHolder[STATE_KEY] ??= createState());
}

export function resetMockAccounts(): void {
  delete stateHolder[STATE_KEY];
}

type SimpleErrorCode = Exclude<AccountErrorCode, "too_many_attempts">;

const ERROR_MESSAGES: Record<SimpleErrorCode, string> = {
  unauthenticated: "Inicia sesión para continuar.",
  not_found: "No encontrado.",
  validation_failed: "Revisa los datos del formulario.",
  invalid_credentials: "Correo o contraseña incorrectos.",
  token_invalid: "El enlace no es válido.",
  token_expired: "El enlace venció. Pide uno nuevo.",
  not_orderable: "Esta tienda no vende este producto en línea.",
  product_restricted: "Este producto no se vende en línea: consúltalo en la tienda.",
  cart_full: "Tu carrito admite hasta 20 productos.",
  email_unverified: "Verifica tu correo para comprar.",
  quote_changed: "Tu compra cambió. Revisa los precios y la entrega.",
  cart_empty: "Tu carrito no tiene productos disponibles.",
  open_orders: "Tienes pedidos en curso. Podrás eliminar tu cuenta cuando se entreguen.",
  billing_incomplete: "Completa tus datos de facturación en tu perfil para facturar a tu nombre.",
};

const ERROR_STATUSES: Partial<Record<SimpleErrorCode, number>> = {
  unauthenticated: 401,
  email_unverified: 403,
  not_found: 404,
  quote_changed: 409,
  open_orders: 409,
};

export function accountError(
  code: SimpleErrorCode,
  fields: Record<string, string> | null = null,
  quote: Quote | null = null,
): MarketplaceAccountError {
  const status = ERROR_STATUSES[code] ?? 422;
  return new MarketplaceAccountError({ status, code, message: ERROR_MESSAGES[code], fields, quote });
}

function tooManyAttempts(): MarketplaceAccountError {
  return new MarketplaceAccountError({
    status: 429,
    code: "too_many_attempts",
    message: `Demasiados intentos. Prueba de nuevo en ${RATE_LIMIT_RETRY_AFTER_S} segundos.`,
    retryAfter: RATE_LIMIT_RETRY_AFTER_S,
  });
}

type FieldErrors = Record<string, string>;

function flag(errors: FieldErrors, field: string, message: string): void {
  if (!Object.hasOwn(errors, field)) errors[field] = message;
}

function throwIfInvalid(errors: FieldErrors): void {
  if (Object.keys(errors).length > 0) throw accountError("validation_failed", errors);
}

function isBlank(value: string | null | undefined): boolean {
  return value === undefined || value === null || value.trim() === "";
}

function requiredMessage(field: string): string {
  return `El campo ${field} es obligatorio.`;
}

function requireText(errors: FieldErrors, field: string, value: string | undefined): void {
  if (isBlank(value)) flag(errors, field, requiredMessage(field));
}

const BILLING_PHONE_PATTERN = /^(0212|0412|0422|0414|0424|0416|0426)\d{7}$/;

function checkBilling(errors: FieldErrors, billing: Billing): void {
  const name = billing.name.trim();
  const address = billing.address.trim();
  if (!/^\d{5,9}$/.test(billing.document.trim())) flag(errors, "billing.document", "El documento debe tener de 5 a 9 dígitos.");
  if (name === "" || name.length > 100) flag(errors, "billing.name", "El nombre o razón social admite hasta 100 caracteres.");
  if (!BILLING_PHONE_PATTERN.test(billing.phone.trim())) flag(errors, "billing.phone", "El teléfono no es válido.");
  if (address.length < 8 || address.length > 250) flag(errors, "billing.address", "La dirección fiscal debe tener de 8 a 250 caracteres.");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function checkEmail(errors: FieldErrors, value: string | undefined): string | null {
  if (value === undefined || isBlank(value)) {
    flag(errors, "email", requiredMessage("email"));
    return null;
  }
  const email = normalizeEmail(value);
  if (!email.includes("@")) {
    flag(errors, "email", "El campo email debe ser una dirección de correo válida.");
    return null;
  }
  return email;
}

function checkRegistrableEmail(errors: FieldErrors, email: string, ownerId: number | null): void {
  if (email.endsWith(RESERVED_EMAIL_DOMAIN)) {
    flag(errors, "email", "El correo no es válido.");
  } else if (findAccountByEmail(email, ownerId) !== undefined) {
    flag(errors, "email", "El correo ya está registrado.");
  }
}

function checkNewPassword(errors: FieldErrors, field: string, value: string | undefined): void {
  if (value === undefined || isBlank(value)) {
    flag(errors, field, requiredMessage(field));
  } else if (value.length < MIN_PASSWORD_LENGTH) {
    flag(errors, field, `El campo ${field} debe contener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
}

function findAccountByEmail(email: string, exceptId: number | null): MockAccount | undefined {
  for (const account of state().accounts.values()) {
    if (account.id !== exceptId && account.customer.email === email) return account;
  }
  return undefined;
}

function authenticate(ctx: AccountContext): { account: MockAccount; token: string } {
  const token = ctx.session;
  const id = token === null ? undefined : state().tokens.get(token);
  const account = id === undefined ? undefined : state().accounts.get(id);
  if (token === null || account === undefined) throw accountError("unauthenticated");
  return { account, token };
}

export function customerIdFor(ctx: AccountContext): number {
  return authenticate(ctx).account.id;
}

// Copia del comprador de la sesión, para el checkout simulado (correo, verificación y direcciones).
export function mockAccountFor(ctx: AccountContext): MockAccount {
  return structuredClone(authenticate(ctx).account);
}

function issueToken(customerId: number): string {
  const token = `${customerId}|simulado-${crypto.randomUUID()}`;
  state().tokens.set(token, customerId);
  return token;
}

function revokeTokens(customerId: number, keep: string | null): void {
  const tokens = state().tokens;
  for (const [token, owner] of tokens) {
    if (owner === customerId && token !== keep) tokens.delete(token);
  }
}

function toCustomer(account: MockAccount): Customer {
  return structuredClone(account.customer);
}

export async function registerCustomer(_ctx: AccountContext, input: RegisterInput): Promise<AuthResponse> {
  const errors: FieldErrors = {};
  requireText(errors, "name", input.name);
  const checked = checkEmail(errors, input.email);
  if (checked !== null) checkRegistrableEmail(errors, checked, null);
  requireText(errors, "phone", input.phone);
  checkNewPassword(errors, "password", input.password);
  throwIfInvalid(errors);

  const current = state();
  const id = current.nextCustomerId++;
  const email = normalizeEmail(input.email);
  const account: MockAccount = {
    id,
    customer: {
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      email_verified: false,
      pending_email: null,
      settings: { order_status_emails: true },
      billing: null,
    },
    password: input.password,
    addresses: [],
    favorites: [],
  };
  current.accounts.set(id, account);
  current.pendingVerification = { customerId: id, email };
  return { token: issueToken(id), customer: toCustomer(account) };
}

export async function loginCustomer(
  _ctx: AccountContext,
  input: { email: string; password: string },
): Promise<AuthResponse> {
  if (normalizeEmail(input.email) === MOCK_RATE_LIMITED_EMAIL) throw tooManyAttempts();

  const errors: FieldErrors = {};
  checkEmail(errors, input.email);
  requireText(errors, "password", input.password);
  throwIfInvalid(errors);

  const account = findAccountByEmail(normalizeEmail(input.email), null);
  if (account === undefined || account.password !== input.password) {
    throw accountError("invalid_credentials");
  }
  return { token: issueToken(account.id), customer: toCustomer(account) };
}

export async function logoutCustomer(ctx: AccountContext): Promise<void> {
  const { token } = authenticate(ctx);
  state().tokens.delete(token);
}

export async function requestPasswordReset(_ctx: AccountContext, email: string): Promise<void> {
  if (normalizeEmail(email) === MOCK_RATE_LIMITED_EMAIL) throw tooManyAttempts();

  const errors: FieldErrors = {};
  checkEmail(errors, email);
  throwIfInvalid(errors);

  const account = findAccountByEmail(normalizeEmail(email), null);
  if (account !== undefined) state().pendingReset = account.id;
}

export async function resetPassword(
  _ctx: AccountContext,
  input: { token: string; password: string },
): Promise<void> {
  const errors: FieldErrors = {};
  requireText(errors, "token", input.token);
  checkNewPassword(errors, "password", input.password);
  throwIfInvalid(errors);

  if (input.token === MOCK_EXPIRED_TOKEN) throw accountError("token_expired");
  const current = state();
  const account =
    input.token === MOCK_RESET_TOKEN && current.pendingReset !== null
      ? current.accounts.get(current.pendingReset)
      : undefined;
  if (account === undefined) throw accountError("token_invalid");

  account.password = input.password;
  revokeTokens(account.id, null);
  current.pendingReset = null;
}

export async function verifyEmail(_ctx: AccountContext, token: string): Promise<void> {
  const errors: FieldErrors = {};
  requireText(errors, "token", token);
  throwIfInvalid(errors);

  if (token === MOCK_EXPIRED_TOKEN) throw accountError("token_expired");
  const current = state();
  const pending = token === MOCK_VERIFY_TOKEN ? current.pendingVerification : null;
  const account = pending === null ? undefined : current.accounts.get(pending.customerId);
  if (pending === null || account === undefined) throw accountError("token_invalid");

  if (pending.email === account.customer.pending_email) {
    account.customer.email = pending.email;
    account.customer.pending_email = null;
  }
  account.customer.email_verified = true;
  current.pendingVerification = null;
}

export async function resendVerification(ctx: AccountContext): Promise<void> {
  const { account } = authenticate(ctx);
  state().pendingVerification = {
    customerId: account.id,
    email: account.customer.pending_email ?? account.customer.email,
  };
}

export async function getMe(ctx: AccountContext): Promise<Customer> {
  return toCustomer(authenticate(ctx).account);
}

export async function updateMe(ctx: AccountContext, patch: ProfilePatch): Promise<Customer> {
  const { account } = authenticate(ctx);

  const errors: FieldErrors = {};
  if (patch.name !== undefined) requireText(errors, "name", patch.name);
  if (patch.phone !== undefined) requireText(errors, "phone", patch.phone);
  if (patch.billing) checkBilling(errors, patch.billing);
  if (patch.email !== undefined) {
    const checked = checkEmail(errors, patch.email);
    if (checked !== null) checkRegistrableEmail(errors, checked, account.id);
  }
  throwIfInvalid(errors);

  const email = patch.email === undefined ? null : normalizeEmail(patch.email);
  const changesEmail = email !== null && email !== account.customer.email;
  if (changesEmail) {
    if (isBlank(patch.current_password)) {
      throw accountError("validation_failed", {
        current_password: "Ingresa tu contraseña actual para cambiar el correo.",
      });
    }
    if (patch.current_password !== account.password) {
      throw accountError("validation_failed", {
        current_password: "La contraseña actual no es correcta.",
      });
    }
  }

  if (patch.name !== undefined) account.customer.name = patch.name.trim();
  if (patch.phone !== undefined) account.customer.phone = patch.phone.trim();
  if (patch.billing !== undefined) {
    account.customer.billing =
      patch.billing === null
        ? null
        : {
            ...patch.billing,
            document: patch.billing.document.trim(),
            name: patch.billing.name.trim(),
            phone: patch.billing.phone.trim(),
            address: patch.billing.address.trim(),
          };
  }
  if (email !== null) account.customer.pending_email = changesEmail ? email : null;
  if (changesEmail) state().pendingVerification = { customerId: account.id, email };
  return toCustomer(account);
}

export async function changePassword(
  ctx: AccountContext,
  input: { current_password: string; password: string },
): Promise<void> {
  const { account, token } = authenticate(ctx);

  const errors: FieldErrors = {};
  requireText(errors, "current_password", input.current_password);
  checkNewPassword(errors, "password", input.password);
  throwIfInvalid(errors);

  if (input.current_password !== account.password) {
    throw accountError("validation_failed", {
      current_password: "La contraseña actual no es correcta.",
    });
  }
  account.password = input.password;
  revokeTokens(account.id, token);
}

export async function updateSettings(
  ctx: AccountContext,
  input: { order_status_emails: boolean },
): Promise<Customer> {
  const { account } = authenticate(ctx);
  account.customer.settings.order_status_emails = input.order_status_emails;
  return toCustomer(account);
}

// `beforeDelete` corre tras validar la contraseña y antes de borrar: el adaptador bloquea ahí con
// pedidos abiertos (spec §5.8) sin que este archivo importe el checkout.
export async function deleteAccount(
  ctx: AccountContext,
  input: { password: string },
  beforeDelete: (customerId: number) => void = () => {},
): Promise<void> {
  const { account } = authenticate(ctx);

  const errors: FieldErrors = {};
  requireText(errors, "password", input.password);
  throwIfInvalid(errors);

  if (input.password !== account.password) {
    throw accountError("validation_failed", { password: "La contraseña no es correcta." });
  }
  beforeDelete(account.id);
  revokeTokens(account.id, null);
  state().accounts.delete(account.id);
}

const ADDRESS_TEXT_FIELDS = ["label", "recipient_name", "phone", "line"] as const;

function findCity(slug: string): CityRef | undefined {
  return MOCK_LOCATIONS.flatMap((location) => location.municipalities)
    .flatMap((municipality) => municipality.cities)
    .find((city) => city.slug === slug);
}

function checkCoordinate(
  errors: FieldErrors,
  field: "lat" | "lng",
  value: number | undefined,
  limit: number,
  partial: boolean,
): void {
  if (value === undefined) {
    if (!partial) flag(errors, field, requiredMessage(field));
    return;
  }
  if (!Number.isFinite(value) || value < -limit || value > limit) {
    flag(errors, field, `El campo ${field} debe ser un valor entre -${limit} y ${limit}.`);
  }
}

// Devuelve la ciudad de city_slug, o null si el parche no la trae.
function checkAddress(input: AddressPatch, partial: boolean): CityRef | null {
  const errors: FieldErrors = {};
  for (const field of ["label", "recipient_name", "phone", "city_slug", "line"] as const) {
    const value = input[field];
    if (!partial || value !== undefined) requireText(errors, field, value);
  }
  const city =
    input.city_slug === undefined || isBlank(input.city_slug) ? undefined : findCity(input.city_slug);
  if (input.city_slug !== undefined && !isBlank(input.city_slug) && city === undefined) {
    flag(errors, "city_slug", "La ciudad no es válida.");
  }
  checkCoordinate(errors, "lat", input.lat, 90, partial);
  checkCoordinate(errors, "lng", input.lng, 180, partial);
  throwIfInvalid(errors);
  return city ?? null;
}

function normalizeReference(reference: string | null): string | null {
  return reference === null || isBlank(reference) ? null : reference.trim();
}

function compareAddresses(a: Address, b: Address): number {
  if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
  return a.id - b.id;
}

function findAddress(account: MockAccount, id: number): Address {
  const address = account.addresses.find((candidate) => candidate.id === id);
  if (address === undefined) throw accountError("not_found");
  return address;
}

export async function listAddresses(ctx: AccountContext): Promise<Address[]> {
  const { account } = authenticate(ctx);
  return structuredClone([...account.addresses].sort(compareAddresses));
}

export async function createAddress(ctx: AccountContext, input: AddressInput): Promise<Address> {
  const { account } = authenticate(ctx);
  const city = checkAddress(input, false);
  if (city === null) throw accountError("validation_failed", { city_slug: requiredMessage("city_slug") });

  const makeDefault = account.addresses.length === 0 || input.is_default === true;
  if (makeDefault) {
    for (const other of account.addresses) other.is_default = false;
  }
  const address: Address = {
    id: state().nextAddressId++,
    label: input.label.trim(),
    recipient_name: input.recipient_name.trim(),
    phone: input.phone.trim(),
    city,
    line: input.line.trim(),
    reference: normalizeReference(input.reference),
    lat: input.lat,
    lng: input.lng,
    is_default: makeDefault,
  };
  account.addresses.push(address);
  return structuredClone(address);
}

export async function updateAddress(
  ctx: AccountContext,
  id: number,
  patch: AddressPatch,
): Promise<Address> {
  const { account } = authenticate(ctx);
  const city = checkAddress(patch, true);
  const address = findAddress(account, id);

  for (const field of ADDRESS_TEXT_FIELDS) {
    const value = patch[field];
    if (value !== undefined) address[field] = value.trim();
  }
  if (city !== null) address.city = city;
  if (patch.reference !== undefined) address.reference = normalizeReference(patch.reference);
  if (patch.lat !== undefined) address.lat = patch.lat;
  if (patch.lng !== undefined) address.lng = patch.lng;
  if (patch.is_default === true) {
    for (const other of account.addresses) other.is_default = other.id === id;
  }
  return structuredClone(address);
}

export async function deleteAddress(ctx: AccountContext, id: number): Promise<void> {
  const { account } = authenticate(ctx);
  const address = findAddress(account, id);

  account.addresses = account.addresses.filter((candidate) => candidate.id !== id);
  if (!address.is_default) return;
  let newest: Address | null = null;
  for (const candidate of account.addresses) {
    if (newest === null || candidate.id > newest.id) newest = candidate;
  }
  if (newest !== null) newest.is_default = true;
}

function findFavoriteProduct(slug: string): Product | undefined {
  return (
    MOCK_PRODUCTS.find((item) => item.product.slug === slug)?.product ??
    MOCK_UNAVAILABLE_PRODUCTS.find((product) => product.slug === slug)
  );
}

function findFavoriteStore(slug: string): StoreSummary | undefined {
  return MOCK_STORES.find((store) => store.summary.slug === slug)?.summary;
}

function sameTarget(a: FavoriteTarget, b: FavoriteTarget): boolean {
  return a.kind === b.kind && a.slug === b.slug;
}

export async function listFavorites(ctx: AccountContext): Promise<FavoritesResponse> {
  const { account } = authenticate(ctx);
  const newestFirst = [...account.favorites].reverse();
  const products = newestFirst.flatMap((favorite) => {
    const product = favorite.kind === "product" ? findFavoriteProduct(favorite.slug) : undefined;
    return product === undefined ? [] : [product];
  });
  const stores = newestFirst.flatMap((favorite) => {
    const store = favorite.kind === "store" ? findFavoriteStore(favorite.slug) : undefined;
    return store === undefined ? [] : [store];
  });
  return structuredClone({ products, stores });
}

export async function addFavorite(ctx: AccountContext, target: FavoriteTarget): Promise<void> {
  const { account } = authenticate(ctx);
  const exists =
    target.kind === "product"
      ? findFavoriteProduct(target.slug) !== undefined
      : findFavoriteStore(target.slug) !== undefined;
  if (!exists) throw accountError("not_found");
  if (account.favorites.some((favorite) => sameTarget(favorite, target))) return;
  account.favorites.push({ kind: target.kind, slug: target.slug });
}

export async function removeFavorite(ctx: AccountContext, target: FavoriteTarget): Promise<void> {
  const { account } = authenticate(ctx);
  account.favorites = account.favorites.filter((favorite) => !sameTarget(favorite, target));
}
