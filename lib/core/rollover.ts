import type { Note } from "./types";

/** Notes that carry to a new day: anything not done or trashed, reset to the board. */
export function rollover(previous: Note[]): Note[] {
  return previous
    .filter((n) => n.status === "board" || n.status === "focus")
    .map((n) => ({
      ...n,
      id: crypto.randomUUID(),
      status: "board",
      startedAt: null,
      spentMs: 0,
      actualMinutes: null,
    }));
}
