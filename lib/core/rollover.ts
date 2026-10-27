import { placeNote } from "./placement";
import type { Note } from "./types";

function asTomorrowNote(n: Note, id: string, carriedFrom: string | null): Note {
  return {
    ...n,
    id,
    status: "board",
    startedAt: null,
    spentMs: 0,
    actualMinutes: null,
    againTomorrow: false,
    carriedFrom,
  };
}

/** Notes that carry to a new day: leftovers, plus done notes marked again. */
export function rollover(previous: Note[], newId: () => string, fromDate: string): Note[] {
  const unfinished = previous
    .filter((n) => n.status === "board" || n.status === "focus")
    .map((n) => asTomorrowNote(n, newId(), n.carriedFrom ?? fromDate));

  const placed: { x: number; y: number }[] = unfinished.map((n) => ({ x: n.x, y: n.y }));
  const again: Note[] = [];
  for (const n of previous) {
    if (!n.againTomorrow || n.status !== "done") continue;
    const copy = { ...asTomorrowNote(n, newId(), null), ...placeNote(placed) };
    again.push(copy);
    placed.push(copy);
  }

  return [...unfinished, ...again];
}
