import { createHash } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getModelChain, withFallback } from "@/lib/ai/model";
import { QuotaExceededError, spendAiCall } from "@/lib/ai/spendAiCall";
import { splitDay, type SplitNote, type SplitResult } from "@/lib/ai/tasks/split";
import { ensureTodayDay } from "@/lib/ai/writeDaySummary";
import { todayFor } from "@/lib/core/date";
import { noteToRow, rowToNote, type NoteRow } from "@/lib/core/mappers";
import { placeNote, randomColor, randomRotation, shapeForNewNote } from "@/lib/core/placement";
import { parseShape, type Note, type NoteShape } from "@/lib/core/types";

const Body = z.object({
  dump: z.string().min(3).max(4000),
  capacityMinutes: z.number().int().min(30).max(960).default(360),
});

const Claim = z.discriminatedUnion("outcome", [
  z.object({ outcome: z.literal("claimed"), claim_id: z.string() }),
  z.object({ outcome: z.literal("busy") }),
  z.object({ outcome: z.literal("done"), note_ids: z.array(z.string()), warning: z.string().nullable() }),
]);

const SPLIT_TIMEOUT_MS = 8_000;

const EMPTY_RETRY_HINT =
  "This is a real to-do list, possibly with typos. Extract the tasks.";

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Same text after trimming and collapsing whitespace gives the same hash. */
function dumpHash(dump: string): string {
  return createHash("sha256").update(dump.trim().replace(/\s+/g, " ")).digest("hex");
}

function toBoardNotes(split: SplitNote[], board: { x: number; y: number }[], defaultShape: NoteShape | null): Note[] {
  const created: Note[] = [];
  let placed = board;
  for (const s of split) {
    const n: Note = {
      id: crypto.randomUUID(),
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

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });

  const { dump, capacityMinutes } = parsed.data;
  const log = { supabase, task: "split", input: dump };
  const failed = () => Response.json({ error: "Couldn't break that down. Try again." }, { status: 502 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, default_shape")
    .eq("id", user.id)
    .maybeSingle();
  const today = todayFor((profile?.timezone as string | null | undefined) ?? "UTC");
  const defaultShape = parseShape(profile?.default_shape);

  let dayId: string;
  try {
    dayId = (await ensureTodayDay(supabase, user.id, today)).id;
  } catch (e) {
    console.error("split: today's day failed", e);
    return failed();
  }

  const { data: claimData, error: claimError } = await supabase.rpc("claim_split", {
    p_day_id: dayId,
    p_hash: dumpHash(dump),
  });
  const claim = Claim.safeParse(claimData);
  if (claimError || !claim.success) {
    console.error("split claim failed", claimError?.message ?? "unexpected claim shape");
    return failed();
  }

  if (claim.data.outcome === "busy") {
    return Response.json({ error: "Still breaking that one down. Give it a moment." }, { status: 409 });
  }

  if (claim.data.outcome === "done") {
    const ids = claim.data.note_ids;
    let notes: Note[] = [];
    if (ids.length) {
      const { data: rows, error } = await supabase
        .from("notes")
        .select("*")
        .in("id", ids)
        .eq("user_id", user.id);
      if (error) {
        console.error("split replay failed", error.message);
        return failed();
      }
      notes = ((rows ?? []) as NoteRow[])
        .map(rowToNote)
        .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    }
    return Response.json({ notes, warning: claim.data.warning, replayed: true });
  }

  const claimId = claim.data.claim_id;
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

    const { data: boardRows, error: boardError } = await supabase
      .from("notes")
      .select("x, y")
      .eq("day_id", dayId)
      .eq("user_id", user.id)
      .eq("status", "board");
    if (boardError) throw new Error(boardError.message);

    const notes = toBoardNotes(result.notes, boardRows ?? [], defaultShape);
    const { error: finishError } = await supabase.rpc("finish_split", {
      p_claim_id: claimId,
      p_notes: notes.map((n) => noteToRow(n, dayId, user.id)),
      p_warning: result.warning,
    });
    if (finishError) throw new Error(finishError.message);

    return Response.json({ notes, warning: result.warning, replayed: false });
  } catch (e) {
    // finish_split is one transaction, so reaching here means no notes were saved.
    const { error: releaseError } = await supabase
      .from("split_requests")
      .delete()
      .eq("user_id", user.id)
      .eq("claim_id", claimId)
      .eq("status", "pending");
    if (releaseError) console.error("split release failed", releaseError.message);

    if (e instanceof QuotaExceededError) {
      return Response.json({ error: e.message }, { status: 429 });
    }
    console.error("split failed", e);
    return failed();
  }
}
