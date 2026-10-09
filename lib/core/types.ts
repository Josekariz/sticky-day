import { z } from "zod";

export type NoteStatus = "board" | "focus" | "done" | "trashed";
export type Energy = "low" | "medium" | "high";

export const PAPER_COLORS = [
  "yellow", "lime", "mint", "teal", "sky", "lavender",
  "lilac", "pink", "coral", "peach", "sand", "grey",
] as const;
export type PaperColor = (typeof PAPER_COLORS)[number];

export function paperVar(color: PaperColor) {
  return `var(--paper-${color})`;
}

export const NOTE_SHAPES = ["square", "rounded", "circle", "heart", "pill"] as const;
export const NoteShapeSchema = z.enum(NOTE_SHAPES);
export type NoteShape = z.infer<typeof NoteShapeSchema>;

/** A stored shape, or null when it is missing or not one of the five. */
export function parseShape(value: unknown): NoteShape | null {
  const parsed = NoteShapeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export type Note = {
  id: string;
  title: string;
  detail: string;
  estMinutes: number;
  actualMinutes: number | null;
  energy: Energy;
  status: NoteStatus;
  color: PaperColor;
  shape: NoteShape;
  x: number; // 0..1, fraction of the board's usable width
  y: number; // 0..1, fraction of the board's usable height
  rotation: number;
  startedAt: number | null; // epoch ms while this focus note's timer is running
  spentMs: number; // accumulated focus time across pauses
  carriedFrom: string | null; // YYYY-MM-DD of the day first written; set on rollover
};

export const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  estMinutes: z.number(),
  actualMinutes: z.number().nullable(),
  energy: z.enum(["low", "medium", "high"]),
  status: z.enum(["board", "focus", "done", "trashed"]),
  color: z.enum(PAPER_COLORS),
  shape: NoteShapeSchema,
  x: z.number(),
  y: z.number(),
  rotation: z.number(),
  startedAt: z.number().nullable(),
  spentMs: z.number(),
  carriedFrom: z.string().nullable(),
}) satisfies z.ZodType<Note>;

/** What /api/ai/split returns: the notes it saved to today's board. */
export const SplitResponseSchema = z.object({
  notes: z.array(NoteSchema),
  warning: z.string().nullable(),
  replayed: z.boolean(), // true when this dump was already split in the last few minutes
});
export type SplitResponse = z.infer<typeof SplitResponseSchema>;

export const MAX_FOCUS = 3;
 