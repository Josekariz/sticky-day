import { z } from "zod";
import type { LanguageModel } from "ai";
import { createClient } from "@/lib/supabase/server";
import { withFallback } from "@/lib/ai/model";
import { logAiCall } from "@/lib/ai/logAiCall";
import { QuotaExceededError, spendAiCall } from "@/lib/ai/spendAiCall";
import { splitDay, type SplitResult } from "@/lib/ai/tasks/split";

const Body = z.object({
  dump: z.string().min(3).max(4000),
  capacityMinutes: z.number().int().min(30).max(960).default(360),
});

const EMPTY_RETRY_HINT =
  "This is a real to-do list, possibly with typos. Extract the tasks.";

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });

  const { dump, capacityMinutes } = parsed.data;
  const log = { supabase, task: "split", input: dump };

  try {
    await spendAiCall(supabase);

    let usedModel: LanguageModel | null = null;
    let usedModelId = "";
    let result: SplitResult = await withFallback(async (model, modelId) => {
      usedModel = model;
      usedModelId = modelId;
      return splitDay(model, dump, capacityMinutes);
    }, log);

    if (result.notes.length === 0 && wordCount(dump) >= 3 && usedModel) {
      await spendAiCall(supabase);
      const started = Date.now();
      try {
        result = await splitDay(usedModel, dump, capacityMinutes, { hint: EMPTY_RETRY_HINT });
        void logAiCall(supabase, {
          task: "split-retry",
          model: usedModelId,
          ok: true,
          durationMs: Date.now() - started,
          input: dump,
        });
      } catch (e) {
        void logAiCall(supabase, {
          task: "split-retry",
          model: usedModelId,
          ok: false,
          error: e instanceof Error ? e.message : String(e),
          durationMs: Date.now() - started,
          input: dump,
        });
        throw e;
      }
    }

    return Response.json(result);
  } catch (e) {
    if (e instanceof QuotaExceededError) {
      return Response.json({ error: e.message }, { status: 429 });
    }
    console.error("split failed", e);
    return Response.json({ error: "Couldn't break that down. Try again." }, { status: 502 });
  }
}
