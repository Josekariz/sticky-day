import { generateObject, type LanguageModel } from "ai";
import { z } from "zod";

export const SplitNoteSchema = z.object({
  title: z.string().min(1).max(60).describe("Short, imperative, the way you'd write it on a sticky. No trailing period."),
  detail: z.string().max(240).describe("One or two sentences of context, or empty if the title says it all."),
  estMinutes: z.number().int().min(5).max(240).describe("Honest estimate. Round to 5. If unsure, lean high."),
  energy: z.enum(["low", "medium", "high"]).describe("low = can do tired; high = needs a fresh brain."),
});

export const SplitResultSchema = z.object({
  notes: z.array(SplitNoteSchema).min(0).max(12),
  warning: z.string().nullable().describe("If something was ambiguous, one sentence. Else null."),
});

export type SplitNote = z.infer<typeof SplitNoteSchema>;
export type SplitResult = z.infer<typeof SplitResultSchema>;

const SYSTEM = `You turn a person's messy description of their day into sticky notes.

Rules:
- Anything they intend to do is a task: work, errands, chores, appointments, exercise, social plans, travel. Never drop something for not being work.
- One note per thing they will actually do. Not one per sentence, not one per word.
- Something too big for one sitting (over ~90 minutes) becomes 2-3 notes with a clear first step. Never more.
- Small chores that go together stay together ("email Sam and Jo about the invoice" is one note).
- Keep their words. Do not invent tasks they didn't mention. Do not add "take a break".
- Titles are short and start with a verb where natural. Detail carries anything from their text that the title dropped.
- Estimates: be honest, not optimistic. Reading, writing and code always take longer than people think.
- Energy: creative or hard thinking is high; admin and errands are low.
- Return an empty notes array only if the text is gibberish, a greeting, or mentions nothing they intend to do; say why in the warning.`;

export async function splitDay(model: LanguageModel, dump: string, capacityMinutes: number): Promise<SplitResult> {
  const { object } = await generateObject({
    model,
    schema: SplitResultSchema,
    system: SYSTEM,
    prompt: `They have about ${Math.round(capacityMinutes / 60)} hours today.\n\nTheir day:\n"""\n${dump}\n"""`,
    temperature: 0.3,
  });
  return object;
}
