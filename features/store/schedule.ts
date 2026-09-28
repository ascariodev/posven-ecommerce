import type { ScheduleEntry } from "@/lib/marketplace/schemas";

type Day = ScheduleEntry["days"][number];

const WEEK: readonly Day[] = ["mo", "tu", "we", "th", "fr", "sa", "su"];

const DAY_LABELS: Record<Day, string> = {
  mo: "Lun",
  tu: "Mar",
  we: "Mié",
  th: "Jue",
  fr: "Vie",
  sa: "Sáb",
  su: "Dom",
};

const DAY_NAMES: Record<Day, string> = {
  mo: "Monday",
  tu: "Tuesday",
  we: "Wednesday",
  th: "Thursday",
  fr: "Friday",
  sa: "Saturday",
  su: "Sunday",
};

const MIN_RANGE_LENGTH = 3;

function formatDays(days: Day[]): string {
  const indexes = [...new Set(days.map((day) => WEEK.indexOf(day)))].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = 0;
  while (start < indexes.length) {
    let end = start;
    while (end + 1 < indexes.length && indexes[end + 1] === indexes[end] + 1) end += 1;
    const run = indexes.slice(start, end + 1).map((index) => DAY_LABELS[WEEK[index]]);
    if (run.length >= MIN_RANGE_LENGTH) parts.push(`${run[0]} a ${run[run.length - 1]}`);
    else parts.push(...run);
    start = end + 1;
  }
  return parts.join(", ");
}

export function formatSchedule(entries: ScheduleEntry[]): string[] {
  if (entries.length === 0) return ["Horario no informado"];
  return entries.map((entry) => `${formatDays(entry.days)}: ${entry.opens} a ${entry.closes}`);
}

export function openingHoursJsonLd(entries: ScheduleEntry[]): object[] {
  return entries.map((entry) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: entry.days.map((day) => DAY_NAMES[day]),
    opens: entry.opens,
    closes: entry.closes,
  }));
}
