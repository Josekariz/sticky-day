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

/** Shift a YYYY-MM-DD calendar date by whole days (no timezone). */
export function shiftDate(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

/** Yesterday's calendar date YYYY-MM-DD in timezone `tz`. */
export function yesterdayFor(tz: string, now = new Date()): string {
  return shiftDate(todayFor(tz, now), -1);
}

/**
 * True when local time in `tz` is at or past `summaryTime` (HH:MM or HH:MM:SS).
 * Pure: pass `now` explicitly in tests.
 */
export function isSummaryDue(now: Date, tz: string, summaryTime: string): boolean {
  const { h, min } = zonedParts(now, tz);
  const [sh, sm] = summaryTime.slice(0, 5).split(":").map(Number);
  const dueH = Number.isFinite(sh) ? sh : 18;
  const dueM = Number.isFinite(sm) ? sm : 0;
  return h * 60 + min >= dueH * 60 + dueM;
}

type GreetingPeriod = "morning" | "afternoon" | "evening" | "late";

const GREETINGS: Record<GreetingPeriod, readonly string[]> = {
  morning: [
    "Hey there",
    "Rise and shine",
    "Fresh day, fresh stickies",
    "Morning — coffee, then the board",
    "A new day, same whiteboard",
    "Look who's early",
    "Top of the morning",
    "Good morning, sunshine",
    "Ready to pin a few?",
    "Let's make today count",
  ],
  afternoon: [
    "Hey there",
    "Good afternoon",
    "Halfway there — keep going",
    "Hope the day's treating you okay",
    "Afternoon — still room on the board",
    "Back at it?",
    "Let's clear a few more",
    "What's left on the pile?",
    "Glad you're here",
    "Keep the momentum",
  ],
  evening: [
    "Hey there",
    "Good evening",
    "Evening — time to wind the day down",
    "Hope today treated you well",
    "Welcome back",
    "Soft landing for the day",
    "Let's see how it went",
    "Cozy hour, honest notes",
    "You made it to evening",
    "Glad you stopped by",
  ],
  late: [
    "Night owl detected",
    "Still up? Respect",
    "Quiet hours, honest list",
    "Burning a little midnight oil",
    "Late shift on the board",
    "Hey, legend",
    "The notes will wait — or won't",
    "Late night, clear head",
    "You and the stickies",
    "Soft hello from the late side",
  ],
};

function greetingPeriod(now: Date, tz: string): GreetingPeriod {
  const { h } = zonedParts(now, tz);
  if (h >= 5 && h <= 11) return "morning";
  if (h >= 12 && h <= 16) return "afternoon";
  if (h >= 17 && h <= 21) return "evening";
  return "late";
}

function stableIndex(key: string, len: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % len;
}

/**
 * Time-of-day greeting in `tz` from curated pools.
 * Stable for a given local calendar day + period (no AI).
 */
export function greetingFor(now: Date, tz: string): string {
  const period = greetingPeriod(now, tz);
  const pool = GREETINGS[period];
  const day = todayFor(tz, now);
  return pool[stableIndex(`${day}:${period}`, pool.length)]!;
}

/** Greeting with optional first name, e.g. "Hey there, Qariz". */
export function greetingWithName(now: Date, tz: string, firstName: string | null): string {
  const g = greetingFor(now, tz);
  return firstName ? `${g}, ${firstName}` : g;
}

/**
 * Letter section title for the day being shown.
 * "Yesterday" only when the letter date is calendar yesterday.
 */
export function storyYouHeading(letterDate: string, today: string): string {
  if (letterDate === today) return "Today you…";
  if (letterDate === shiftDate(today, -1)) return "Yesterday you…";
  return `On ${weekdayLong(letterDate)} you…`;
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

/** Time-only caption, e.g. "Written 18:05", in `tz` (or local if omitted). */
export function writtenTime(iso: string, tz?: string): string {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  };
  if (tz) opts.timeZone = tz;
  try {
    const parts = new Intl.DateTimeFormat("en-US", opts).formatToParts(d);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "00";
    return `Written ${get("hour")}:${get("minute")}`;
  } catch {
    return writtenTime(iso);
  }
}

/** HH:MM display for a Postgres `time` / input value. */
export function formatSummaryTime(summaryTime: string): string {
  return summaryTime.slice(0, 5);
}
