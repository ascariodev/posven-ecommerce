import type { ScheduleEntry } from "../schemas";

const STORE_TIME_ZONE = "America/Caracas";
const DAYS = ["su", "mo", "tu", "we", "th", "fr", "sa"] as const;

export type OpenStatus = { is_open: boolean; closes_at: string | null };

type Range = { opens: string; closes: string };

function localClock(at: Date): { day: number; time: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: STORE_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const part = (type: string): string => parts.find((entry) => entry.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(part("weekday"));
  return { day, time: `${part("hour")}:${part("minute")}` };
}

function rangeOf(schedule: ScheduleEntry[], day: number): Range | null {
  const entry = schedule.find((candidate) => candidate.days.includes(DAYS[day]));
  return entry === undefined ? null : { opens: entry.opens, closes: entry.closes };
}

function within(range: Range, time: string): boolean {
  return range.closes > range.opens ? time >= range.opens && time < range.closes : time >= range.opens;
}

function withinOvernight(range: Range | null, time: string): boolean {
  return range !== null && range.closes <= range.opens && time < range.closes;
}

export function openStatus(schedule: ScheduleEntry[], at: Date): OpenStatus {
  if (schedule.length === 0) return { is_open: true, closes_at: null };

  const { day, time } = localClock(at);
  const today = rangeOf(schedule, day);
  const yesterday = rangeOf(schedule, (day + 6) % 7);

  if (today !== null && within(today, time)) return { is_open: true, closes_at: today.closes };
  if (withinOvernight(yesterday, time) && yesterday !== null) {
    return { is_open: true, closes_at: yesterday.closes };
  }
  if (today !== null && time < today.opens) return { is_open: false, closes_at: today.closes };
  return { is_open: false, closes_at: null };
}
