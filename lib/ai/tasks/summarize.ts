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
  capacityMinutes: z.number().int(),
  done: z.array(DoneNoteSchema),
  unfinished: z.array(UnfinishedNoteSchema),
});

export type SummarizeInput = z.infer<typeof SummarizeInputSchema>;

export const SummarizeResultSchema = z.object({
  recap: z
    .string()
    .describe(
      "Two to four sentences, past tense, plain prose for pasting to a team. Names tasks by title. No bullet points, no emoji, no advice.",
    ),
  carryOver: z
    .array(z.string())
    .describe("Titles from unfinished the person should keep tomorrow."),
  dropSuggestions: z
    .array(z.string())
    .describe(
      "Titles from unfinished that have been carried two or more days and may be worth dropping. Empty if none.",
    ),
});

export type SummarizeResult = z.infer<typeof SummarizeResultSchema>;

export const StoredSummarySchema = SummarizeResultSchema.extend({
  model: z.string(),
  createdAt: z.string().optional(),
});

export type StoredSummary = z.infer<typeof StoredSummarySchema>;

/** `days.summary` as stored, or null if missing or malformed. */
export function parseStoredSummary(raw: unknown): StoredSummary | null {
  const parsed = StoredSummarySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

const SYSTEM = `You write a short end-of-day recap someone can paste to their team.

Rules:
- Past tense. Two to four sentences. Plain prose — no bullet points, no emoji, no praise-padding, no pep talk, no advice.
- Name tasks only by the titles given. Do not invent work.
- Do not do arithmetic. Totals (done count, minutes worked, estimate drift) are computed in code and passed in the prompt — use those numbers as given.
- Mention estimate accuracy when it is off by a lot (the prompt will say so). Otherwise leave it alone.
- carryOver: pick unfinished titles worth keeping tomorrow. Prefer things they started or that still matter.
- dropSuggestions: only titles from unfinished (board/focus) whose carriedFrom date is two or more days before today. Empty array if none qualify. Suggest dropping, do not insist.
- Never mention deleted or trashed notes. The recap is only about work done and work left unfinished — not about throwing notes away.
- Never moralise. No "you should have", no guilt, no productivity lecturing.`;

function driftLabel(done: SummarizeInput["done"]): { minutesWorked: number; drift: number; driftNote: string } {
  const minutesWorked = done.reduce((s, n) => s + n.actualMinutes, 0);
  const drift = done.reduce((s, n) => s + (n.actualMinutes - n.estMinutes), 0);
  const abs = Math.abs(drift);
  const significant = abs >= 30 || (done.length > 0 && abs >= minutesWorked * 0.25 && abs >= 15);
  const driftNote = significant
    ? drift > 0
      ? `Estimate drift: about ${drift} minutes over (estimates were low).`
      : `Estimate drift: about ${abs} minutes under (estimates were high).`
    : "Estimate drift: close enough — no need to call out accuracy.";
  return { minutesWorked, drift, driftNote };
}

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}

export async function summarizeDay(model: LanguageModel, input: SummarizeInput): Promise<SummarizeResult> {
  const { minutesWorked, driftNote } = driftLabel(input.done);
  const longCarries = input.unfinished
    .filter((n) => n.carriedFrom != null && daysBetween(n.carriedFrom, input.date) >= 2)
    .map((n) => n.title);

  const { object } = await generateObject({
    model,
    schema: SummarizeResultSchema,
    system: SYSTEM,
    prompt: `Date: ${input.date}
Capacity: ${input.capacityMinutes} minutes.

Totals (computed — do not recalculate):
- Done: ${input.done.length} notes
- Minutes worked: ${minutesWorked}
- ${driftNote}

Done:
${input.done.length ? input.done.map((n) => `- "${n.title}" (est ${n.estMinutes} min, took ${n.actualMinutes}${n.carriedFrom ? `, carried from ${n.carriedFrom}` : ""})`).join("\n") : "(none)"}

Unfinished:
${input.unfinished.length ? input.unfinished.map((n) => `- "${n.title}" (est ${n.estMinutes} min, spent ${Math.round(n.spentMs / 60000)} min${n.carriedFrom ? `, carried from ${n.carriedFrom}` : ", new today"})`).join("\n") : "(none)"}

Eligible for dropSuggestions (carried ≥ 2 days): ${longCarries.length ? longCarries.map((t) => `"${t}"`).join(", ") : "(none)"}`,
    temperature: 0.4,
  });
  return object;
}
