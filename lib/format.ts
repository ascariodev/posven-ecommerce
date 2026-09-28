import type { Money, Rate } from "@/lib/marketplace/schemas";

const DECIMAL = /^(\d+)\.(\d+)$/;
const MONEY = /^(\d+)\.(\d{2})$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDecimal(value: string, pattern: RegExp): string | null {
  const match = pattern.exec(value);
  if (!match) return null;
  return `${groupThousands(match[1])},${match[2]}`;
}

export function formatUsd(amount: Money): string {
  const formatted = formatDecimal(amount, MONEY);
  return formatted === null ? amount : `$ ${formatted}`;
}

export function formatVes(amount: Money): string {
  const formatted = formatDecimal(amount, MONEY);
  return formatted === null ? amount : `Bs ${formatted}`;
}

export function formatRate(rate: Rate): string {
  const date = ISO_DATE.exec(rate.valid_on);
  const validOn = date ? `${date[3]}/${date[2]}/${date[1]}` : rate.valid_on;
  const usdVes = formatDecimal(rate.usd_ves, DECIMAL) ?? rate.usd_ves;
  return `Tasa BCV del ${validOn}: Bs ${usdVes}`;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.max(50, Math.round(km * 20) * 50);
    if (meters < 1000) return `a ${meters} m`;
  }
  const tenths = Math.round(km * 10);
  if (tenths < 100) return `a ${Math.floor(tenths / 10)},${tenths % 10} km`;
  return `a ${groupThousands(String(Math.round(km)))} km`;
}
