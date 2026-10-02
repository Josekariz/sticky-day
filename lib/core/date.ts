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

/** Quiet caption for when a summary was written, in local time. */
export function writtenCaption(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `Written ${hh}:${mm}`;
  }
  return `Written ${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })}`;
}
