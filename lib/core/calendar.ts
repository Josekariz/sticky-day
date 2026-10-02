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
