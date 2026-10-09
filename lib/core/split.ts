import { z } from "zod";
import { placeNote, randomColor, randomRotation, shapeForNewNote } from "./placement";
import type { Note, NoteShape } from "./types";

export const SplitNoteSchema = z.object({
  title: z.string().min(1).max(60).describe("Short, imperative, the way you'd write it on a sticky. No trailing period."),
  detail: z.string().max(240).describe("One or two sentences of context, or empty if the title says it all."),
  estMinutes: z.number().int().min(5).max(240).describe("Honest estimate. Round to 5. If unsure, lean high."),
  priority: z.enum(["low", "medium", "high"]).describe("high = must happen today; low = fine to slip to tomorrow."),
});

export const SplitResultSchema = z.object({
  notes: z.array(SplitNoteSchema).min(0).max(12),
  warning: z.string().nullable().describe("If something was ambiguous, one sentence. Else null."),
});

export type SplitNote = z.infer<typeof SplitNoteSchema>;
export type SplitResult = z.infer<typeof SplitResultSchema>;

/** Turns split results into new board notes, each placed clear of the ones before it. */
export function toBoardNotes(
  split: SplitNote[],
  board: { x: number; y: number }[],
  defaultShape: NoteShape | null,
  newId: () => string,
): Note[] {
  const created: Note[] = [];
  let placed = board;
  for (const s of split) {
    const n: Note = {
      id: newId(),
      ...s,
      actualMinutes: null,
      spentMs: 0,
      status: "board",
      color: randomColor(),
      shape: shapeForNewNote(defaultShape),
      rotation: randomRotation(),
      startedAt: null,
      carriedFrom: null,
      ...placeNote(placed),
    };
    created.push(n);
    placed = [...placed, n];
  }
  return created;
}
