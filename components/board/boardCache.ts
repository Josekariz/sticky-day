import { NoteSchema, type Note } from "@/lib/core/types";
import { z } from "zod";

const KEY = "sticky-day:board-cache";
const MAX_AGE_MS = 36 * 60 * 60 * 1000; // a day + buffer across midnight

const SnapSchema = z.object({
  v: z.literal(1),
  userId: z.string(),
  dayId: z.string(),
  /** Profile-timezone YYYY-MM-DD — loading UI refuses a different calendar day. */
  date: z.string(),
  notes: z.array(NoteSchema).max(200),
  savedAt: z.number(),
});

export type BoardSnap = z.infer<typeof SnapSchema>;

// Stable snapshots for useSyncExternalStore (fresh objects → infinite re-render).
let cachedRaw: string | null | undefined;
let cachedSnap: BoardSnap | null = null;

function parse(raw: string | null): BoardSnap | null {
  if (!raw) return null;
  try {
    const parsed = SnapSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    if (Date.now() - parsed.data.savedAt > MAX_AGE_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

/** Last signed-in board snapshot, if still fresh. Referentially stable when unchanged. */
export function readBoardSnap(): BoardSnap | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cachedRaw) return cachedSnap;
    cachedRaw = raw;
    cachedSnap = parse(raw);
    return cachedSnap;
  } catch {
    return null;
  }
}

/** Notes for this user/day from the last visit, or null. */
export function readBoardCache(userId: string, dayId: string): Note[] | null {
  const snap = readBoardSnap();
  if (!snap || snap.userId !== userId || snap.dayId !== dayId) return null;
  return snap.notes;
}

let writesEnabled = true;

/** Stop writes during sign-out so a late notes update can't recreate the snapshot. */
export function pauseBoardCacheWrites(): void {
  writesEnabled = false;
}

export function resumeBoardCacheWrites(): void {
  writesEnabled = true;
}

/** Keep a copy so the next cold start can paint before Supabase answers. */
export function writeBoardCache(
  userId: string,
  dayId: string,
  date: string,
  notes: Note[],
): void {
  if (!writesEnabled) return;
  try {
    const snap: BoardSnap = {
      v: 1,
      userId,
      dayId,
      date,
      notes,
      savedAt: Date.now(),
    };
    const raw = JSON.stringify(snap);
    localStorage.setItem(KEY, raw);
    cachedRaw = raw;
    cachedSnap = snap;
  } catch {
    // Storage blocked or full — live board still works.
  }
}

/** Drop the snapshot on sign-out so the next account never sees it. */
export function clearBoardCache(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  cachedRaw = null;
  cachedSnap = null;
}
