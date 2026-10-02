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
