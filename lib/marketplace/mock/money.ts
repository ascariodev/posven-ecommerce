import type { Money } from "../schemas";

// Único lugar del repo que multiplica y suma montos (contract.md 1): el simulado calcula lo que en
// producción calcula la API. En céntimos enteros, sin coma flotante.

export function toCents(value: Money): number {
  const [units, cents] = value.split(".");
  return Number(units) * 100 + Number(cents);
}

export function fromCents(cents: number): Money {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error(`Monto simulado inválido: ${cents}`);
  const units = Math.floor(cents / 100);
  return `${units}.${String(cents % 100).padStart(2, "0")}`;
}

export function multiply(value: Money, times: number): Money {
  return fromCents(toCents(value) * times);
}

export function sum(values: Money[]): Money {
  return fromCents(values.reduce((total, value) => total + toCents(value), 0));
}
