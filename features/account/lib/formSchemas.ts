import { z } from "zod";

// Espejo de los FormRequests de posveapi (Marketplace/Customer) y nunca más estricto: la API
// recorta los textos salvo las contraseñas (TrimStrings), trata "" como ausente
// (ConvertEmptyStringsToNull) y mide en caracteres (mb_strlen), no en unidades UTF-16.
const REQUIRED = "Completa este campo.";
const INVALID_EMAIL = "Escribe un correo válido.";
const RESERVED_EMAIL = "Usa otro correo.";
const INVALID_PHONE = "Escribe un teléfono de 7 a 20 caracteres: números, espacios, paréntesis, guiones y + al inicio.";
const PASSWORD_TOO_SHORT = "La contraseña debe tener al menos 8 caracteres.";
const CITY_REQUIRED = "Elige una ciudad.";

const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;
// email:rfc acepta más que cualquier regex de correo: sólo se exige texto a ambos lados de una @.
const LOOSE_EMAIL_PATTERN = /^[\s\S]+@[\s\S]+$/;
const RESERVED_EMAIL_PATTERN = /@anonimo\.invalid$/i;

function charCount(value: string): number {
  return Array.from(value).length;
}

function tooLong(max: number): string {
  return `Usa como máximo ${max} caracteres.`;
}

function requiredText(max?: number, required = REQUIRED) {
  const schema = z.string().refine((value) => value.trim() !== "", required);
  return max === undefined ? schema : schema.refine((value) => charCount(value.trim()) <= max, tooLong(max));
}

function optionalText(max: number) {
  return z.string().refine((value) => charCount(value.trim()) <= max, tooLong(max));
}

function email({ allowReserved }: { allowReserved: boolean }) {
  const schema = requiredText(190).refine((value) => LOOSE_EMAIL_PATTERN.test(value.trim()), INVALID_EMAIL);
  return allowReserved ? schema : schema.refine((value) => !RESERVED_EMAIL_PATTERN.test(value.trim()), RESERVED_EMAIL);
}

const phone = requiredText(20).refine((value) => PHONE_PATTERN.test(value.trim()), INVALID_PHONE);

const currentPassword = z
  .string()
  .refine((value) => value !== "", REQUIRED)
  .refine((value) => charCount(value) <= 72, tooLong(72));

const newPassword = currentPassword.refine((value) => charCount(value) >= 8, PASSWORD_TOO_SHORT);

export const loginSchema = z.object({
  email: email({ allowReserved: true }),
  password: currentPassword,
});

export const registerSchema = z.object({
  name: requiredText(120),
  email: email({ allowReserved: false }),
  phone,
  password: newPassword,
});

export const forgotPasswordSchema = z.object({
  email: email({ allowReserved: true }),
});

export const resetPasswordSchema = z.object({
  token: requiredText(128),
  password: newPassword,
});

// email y current_password sólo viajan cuando cambia el correo.
export const profileSchema = z.object({
  name: requiredText(120),
  phone,
  email: email({ allowReserved: false }).optional(),
  current_password: z
    .string()
    .refine((value) => charCount(value) <= 72, tooLong(72))
    .optional(),
});

export const changePasswordSchema = z.object({
  current_password: currentPassword,
  password: newPassword,
});

export const deleteAccountSchema = z.object({
  password: currentPassword,
});

export const addressSchema = z.object({
  label: requiredText(60),
  recipient_name: requiredText(120),
  phone,
  city_slug: requiredText(undefined, CITY_REQUIRED),
  line: requiredText(255),
  reference: optionalText(255),
});

export const addressCoordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
