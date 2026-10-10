import { z } from "zod";
import { NoteSchema, type Note } from "./types";

export const GUEST_BOARD_KEY = "sticky-day:guest-board";
export const GUEST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const GuestStateSchema = z.object({
  v: z.literal(1),
  savedAt: z.number(),
  notes: z.array(NoteSchema).max(200),
});

/** Stored guest notes, or none when the blob is missing, broken or older than 7 days. */
export function parseGuestBoard(raw: string | null, now: number): Note[] {
  if (!raw) return [];
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return [];
  }
  const parsed = GuestStateSchema.safeParse(json);
  if (!parsed.success || now - parsed.data.savedAt > GUEST_MAX_AGE_MS) return [];
  return parsed.data.notes;
}

export function serializeGuestBoard(notes: Note[], now: number): string {
  return JSON.stringify({ v: 1, savedAt: now, notes });
}

/**
 * What a guest board brings into an account: binned notes stay behind, and notes
 * on the clipboard go back to the board with their timers paused, so the import
 * can't trip the focus cap on a day that already has notes in focus.
 */
export function notesToImport(notes: Note[], now: number): Note[] {
  return notes
    .filter((n) => n.status !== "trashed")
    .map((n) =>
      n.status === "focus"
        ? {
            ...n,
            status: "board" as const,
            spentMs: n.spentMs + (n.startedAt ? now - n.startedAt : 0),
            startedAt: null,
          }
        : n,
    );
}
