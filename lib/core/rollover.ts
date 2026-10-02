import type { Note } from "./types";

/** Notes that carry to a new day: anything not done or trashed, reset to the board. */
export function rollover(previous: Note[], newId: () => string, fromDate: string): Note[] {
  return previous
    .filter((n) => n.status === "board" || n.status === "focus")
    .map((n) => ({
      ...n,
      id: newId(),
      status: "board" as const,
      startedAt: null,
      spentMs: 0,
      actualMinutes: null,
      // Keep the original write day across further rollovers.
      carriedFrom: n.carriedFrom ?? fromDate,
    }));
}
