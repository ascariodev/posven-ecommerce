import { afterEach, describe, expect, it, vi } from "vitest";
import { mockNow, openStatus } from "@/lib/marketplace/mock/schedule";
import type { ScheduleEntry } from "@/lib/marketplace/schemas";

const weekdays: ScheduleEntry[] = [
  { days: ["mo", "tu", "we", "th", "fr"], opens: "08:00", closes: "20:00" },
];
const overnight: ScheduleEntry[] = [{ days: ["fr"], opens: "22:00", closes: "02:00" }];

describe("openStatus del simulado", () => {
  it("sin horario publicado cuenta como abierta y sin hora de cierre", () => {
    expect(openStatus([], new Date("2026-10-05T16:00:00Z"))).toEqual({ is_open: true, closes_at: null });
  });

  it("dentro del tramo da el cierre del tramo", () => {
    expect(openStatus(weekdays, new Date("2026-10-05T16:00:00Z"))).toEqual({ is_open: true, closes_at: "20:00" });
  });

  it("antes de abrir está cerrada y da el cierre de hoy", () => {
    expect(openStatus(weekdays, new Date("2026-10-05T10:00:00Z"))).toEqual({ is_open: false, closes_at: "20:00" });
  });

  it("después de cerrar y en un día sin tramo está cerrada sin cierre", () => {
    expect(openStatus(weekdays, new Date("2026-10-06T01:00:00Z"))).toEqual({ is_open: false, closes_at: null });
    expect(openStatus(weekdays, new Date("2026-10-04T16:00:00Z"))).toEqual({ is_open: false, closes_at: null });
  });

  it("usa la hora de Caracas, no la del servidor", () => {
    expect(openStatus(weekdays, new Date("2026-10-05T12:30:00Z")).is_open).toBe(true);
    expect(openStatus(weekdays, new Date("2026-10-05T11:30:00Z")).is_open).toBe(false);
  });

  it("un tramo que pasa la medianoche sigue abierto de madrugada", () => {
    expect(openStatus(overnight, new Date("2026-10-10T04:00:00Z"))).toEqual({ is_open: true, closes_at: "02:00" });
    expect(openStatus(overnight, new Date("2026-10-10T07:00:00Z"))).toEqual({ is_open: false, closes_at: null });
  });
});

describe("mockNow del simulado", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("con MARKETPLACE_MOCK_NOW válida devuelve esa fecha", () => {
    vi.stubEnv("MARKETPLACE_MOCK_NOW", "2026-10-05T16:00:00Z");
    expect(mockNow().toISOString()).toBe("2026-10-05T16:00:00.000Z");
  });

  it.each(["", "no-es-fecha", "2026-13-45"])("con %j usa el reloj real", (value) => {
    vi.stubEnv("MARKETPLACE_MOCK_NOW", value);
    const before = Date.now();
    const now = mockNow().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });

  it("sin la variable usa el reloj real", () => {
    vi.stubEnv("MARKETPLACE_MOCK_NOW", undefined);
    expect(Math.abs(mockNow().getTime() - Date.now())).toBeLessThan(1000);
  });
});
