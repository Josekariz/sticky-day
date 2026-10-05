import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getModelChain, withFallback } from "@/lib/ai/model";
import { QuotaExceededError, spendAiCall } from "@/lib/ai/spendAiCall";
import { splitDay, type SplitResult } from "@/lib/ai/tasks/split";

const Body = z.object({
  dump: z.string().min(3).max(4000),
  capacityMinutes: z.number().int().min(30).max(960).default(360),
});

const SPLIT_TIMEOUT_MS = 8_000;

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

    let usedModelId = "";
    let result: SplitResult = await withFallback(async (model, modelId, abortSignal) => {
      usedModelId = modelId;
      return splitDay(model, dump, capacityMinutes, { abortSignal });
    }, log, { timeoutMs: SPLIT_TIMEOUT_MS });

    if (result.notes.length === 0 && wordCount(dump) >= 3 && getModelChain().length > 1) {
      await spendAiCall(supabase);
      result = await withFallback(
        (model, _modelId, abortSignal) =>
          splitDay(model, dump, capacityMinutes, { hint: EMPTY_RETRY_HINT, abortSignal }),
        { ...log, task: "split-retry" },
        { skipModelId: usedModelId, timeoutMs: SPLIT_TIMEOUT_MS },
      );
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
