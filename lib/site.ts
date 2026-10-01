export const SITE_NAME = "posven";
export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
export const SITE_DESCRIPTION =
  "Encuentra productos en tiendas cerca de ti y compara precios en dólares y bolívares.";
export const POS_NAME = "posven";

export function merchantWhatsapp(): string | null {
  const digits = (process.env.MERCHANT_WHATSAPP ?? "").replace(/\D/g, "");
  return digits === "" ? null : digits;
}

export function merchantEmail(): string | null {
  const email = (process.env.MERCHANT_EMAIL ?? "").trim();
  return email === "" ? null : email;
}
