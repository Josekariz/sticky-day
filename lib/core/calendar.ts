/** Calendar helpers. Pure: no React, no globals beyond Date. */

/** Month is 1–12. firstWeekday: Mon = 0 … Sun = 6. */
export function monthGrid(year: number, month: number): {
  daysInMonth: number;
  firstWeekday: number;
} {
  const daysInMonth = new Date(year, month, 0).getDate();
  const sundayBased = new Date(year, month - 1, 1).getDay(); // Sun = 0
  const firstWeekday = (sundayBased + 6) % 7; // Mon = 0
  return { daysInMonth, firstWeekday };
}

/** Local calendar date as YYYY-MM-DD. */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Progress arc stroke for a calendar day ring.
 * 0–25% neutral, >25–50% blue, >50–75% teal, ≥75–<100% near-green, 100% done.
 */
export function calendarRingStroke(frac: number): string {
  if (frac >= 1) return "var(--done)";
  if (frac >= 0.75) return "var(--cal-ring-high)";
  if (frac > 0.5) return "var(--cal-ring-rise)";
  if (frac > 0.25) return "var(--cal-ring-mid)";
  return "var(--cal-ring-low)";
}
