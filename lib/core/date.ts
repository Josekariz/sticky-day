/** Short weekday for a YYYY-MM-DD date, e.g. "Thu". Local calendar day, not UTC. */
export function weekdayShort(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}

/** Full weekday for a YYYY-MM-DD date, e.g. "Thursday". Local calendar day, not UTC. */
export function weekdayLong(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
}

/** Heading for a day, e.g. "Thursday 2 Oct". */
export function dayHeading(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parts of `now` in an IANA timezone. Falls back to UTC on bad tz. */
function zonedParts(now: Date, tz: string): { y: number; m: number; d: number; h: number; min: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value);
    return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), min: get("minute") };
  } catch {
    return zonedParts(now, "UTC");
  }
}

/** Calendar date YYYY-MM-DD for `now` in timezone `tz`. */
export function todayFor(tz: string, now = new Date()): string {
  const { y, m, d } = zonedParts(now, tz);
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/**
 * True when local time in `tz` is at or past `summaryTime` (HH:MM or HH:MM:SS).
 * Pure: pass `now` explicitly in tests.
 */
export function isSummaryDue(now: Date, tz: string, summaryTime: string): boolean {
  const { h, min } = zonedParts(now, tz);
  const [sh, sm] = summaryTime.slice(0, 5).split(":").map(Number);
  return h * 60 + min >= sh * 60 + sm;
}

/** Quiet caption for when a summary was written, in local time (or `tz` if given). */
export function writtenCaption(iso: string, tz?: string): string {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  };
  if (tz) opts.timeZone = tz;
  try {
    const parts = new Intl.DateTimeFormat("en-US", opts).formatToParts(d);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "";
    return `Written ${get("weekday")} ${get("hour")}:${get("minute")}`;
  } catch {
    return writtenCaption(iso);
  }
}

/** HH:MM display for a Postgres `time` / input value. */
export function formatSummaryTime(summaryTime: string): string {
  return summaryTime.slice(0, 5);
}
