import { generateObject, type LanguageModel } from "ai";
import { z } from "zod";

const DoneNoteSchema = z.object({
  title: z.string(),
  estMinutes: z.number().int(),
  actualMinutes: z.number().int(),
  carriedFrom: z.string().nullable(),
});

const UnfinishedNoteSchema = z.object({
  title: z.string(),
  estMinutes: z.number().int(),
  spentMs: z.number().int(),
  carriedFrom: z.string().nullable(),
});

export const SummarizeInputSchema = z.object({
  date: z.string(),
  theme: z.string(),
  capacityMinutes: z.number().int(),
  done: z.array(DoneNoteSchema),
  unfinished: z.array(UnfinishedNoteSchema),
});

export type SummarizeInput = z.infer<typeof SummarizeInputSchema>;

export const SummarizeResultSchema = z.object({
  story: z
    .string()
    .describe(
      "Two to three short sentences, second person, past tense — like a close friend texting. Names notes by title. What got cleared, what came first, anything that had carried over and finally got done.",
    ),
  read: z
    .string()
    .describe(
      "A short warm read on the day's theme, about THIS day's notes only. End with one short line that makes tomorrow feel worth showing up for. Kind, playful, no 'you should'.",
    ),
  tomorrowNudge: z
    .string()
    .describe(
      "One sentence, specific, drawn from what carried over or a pattern. Empty string if nothing carried over.",
    ),
  carryOver: z
    .array(z.string())
    .describe("Titles of unfinished board/focus notes, exactly as given."),
});

export type SummarizeResult = z.infer<typeof SummarizeResultSchema>;

export const StoredSummarySchema = z.object({
  story: z.string().optional().default(""),
  read: z.string().optional().default(""),
  tomorrowNudge: z.string().optional().default(""),
  carryOver: z.array(z.string()).optional().default([]),
  /** Legacy field from older summaries; mapped into story on parse. */
  recap: z.string().optional(),
  dropSuggestions: z.array(z.string()).optional(),
  model: z.string(),
  createdAt: z.string().optional(),
  theme: z.string().optional().default(""),
});

export type StoredSummary = z.infer<typeof StoredSummarySchema>;

/** `days.summary` as stored, or null if missing or malformed. */
export function parseStoredSummary(raw: unknown): StoredSummary | null {
  const parsed = StoredSummarySchema.safeParse(raw);
  if (!parsed.success) return null;
  const s = parsed.data;
  if (!s.story && s.recap) return { ...s, story: s.recap };
  return s;
}

/** Prefer story; fall back to legacy recap. */
export function summaryStory(s: StoredSummary): string {
  return s.story || s.recap || "";
}

const SYSTEM = `You write a short end-of-day note for one person's sticky-note board.

Tone:
- Write like a close friend texting at the end of the day — warm, relaxed, a bit playful.
- Never corporate, never a coach, never an advice column.
- Use 1–3 sensible emojis across the whole output where they land naturally (🌙 🫶 ☕ 🌱 ✨ 💪 🧹). Never in every sentence.
- Short sentences are fine.

Content:
- story: second person, past tense. Name notes only by the titles given. What got cleared, what came first, anything that had carried over and finally got done. Do not invent notes.
- read: on the theme provided, grounded in THIS day's notes so it could not be reused for another day. End with one short line that makes tomorrow feel worth showing up for. If nothing was done, say so kindly.
- tomorrowNudge: one sentence, specific, from what carried over or a clear pattern. Empty string if nothing carried over.
- carryOver: the titles of unfinished notes, exactly as listed. Empty array if none.

Hard rules:
- Never write minutes, estimates, percentages, or counts.
- No "you should". If the day went badly, say so kindly and make tomorrow sound easy.
- Never mention deleted or trashed notes. They are out of scope.`;

export async function summarizeDay(model: LanguageModel, input: SummarizeInput): Promise<SummarizeResult> {
  const { object } = await generateObject({
    model,
    schema: SummarizeResultSchema,
    system: SYSTEM,
    prompt: `Date: ${input.date}
Theme for the read: ${input.theme}

Done:
${input.done.length ? input.done.map((n) => `- "${n.title}"${n.carriedFrom ? ` (had carried from ${n.carriedFrom})` : ""}`).join("\n") : "(none)"}

Unfinished:
${input.unfinished.length ? input.unfinished.map((n) => `- "${n.title}"${n.carriedFrom ? ` (carried from ${n.carriedFrom})` : " (new today)"}`).join("\n") : "(none)"}`,
    temperature: 0.7,
  });
  return object;
}
