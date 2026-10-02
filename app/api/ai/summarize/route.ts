import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { withFallback } from "@/lib/ai/model";
import {
  parseStoredSummary,
  summarizeDay,
  type StoredSummary,
  type SummarizeInput,
} from "@/lib/ai/tasks/summarize";
import { rowToNote, type NoteRow } from "@/lib/core/mappers";

const Body = z.object({
  dayId: z.string().uuid(),
  force: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });

  const { dayId, force } = parsed.data;

  const { data: day, error: dayErr } = await supabase
    .from("days")
    .select("id, date, summary, capacity_minutes")
    .eq("id", dayId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (dayErr || !day) return Response.json({ error: "Day not found" }, { status: 404 });

  const cached = parseStoredSummary(day.summary);
  if (cached && !force) return Response.json(cached);

  const { data: profile } = await supabase
    .from("profiles")
    .select("capacity_minutes")
    .eq("id", user.id)
    .maybeSingle();

  const { data: noteRows } = await supabase
    .from("notes")
    .select("*, carried_from")
    .eq("day_id", dayId)
    .eq("user_id", user.id);

  const notes = ((noteRows as NoteRow[] | null) ?? []).map(rowToNote);

  const capacityMinutes =
    (profile?.capacity_minutes as number | null | undefined) ??
    (day.capacity_minutes as number | null | undefined) ??
    360;

  const input: SummarizeInput = {
    date: day.date as string,
    capacityMinutes,
    done: notes
      .filter((n) => n.status === "done")
      .map((n) => ({
        title: n.title,
        estMinutes: n.estMinutes,
        actualMinutes: n.actualMinutes ?? n.estMinutes,
        carriedFrom: n.carriedFrom,
      })),
    unfinished: notes
      .filter((n) => n.status === "board" || n.status === "focus")
      .map((n) => ({
        title: n.title,
        estMinutes: n.estMinutes,
        spentMs: n.spentMs,
        carriedFrom: n.carriedFrom,
      })),
    trashed: notes.filter((n) => n.status === "trashed").map((n) => ({ title: n.title })),
  };

  try {
    const result: StoredSummary = await withFallback(async (model, modelId) => ({
      ...(await summarizeDay(model, input)),
      model: modelId,
      createdAt: new Date().toISOString(),
    }));
    const { error: saveErr } = await supabase
      .from("days")
      .update({ summary: result })
      .eq("id", dayId)
      .eq("user_id", user.id);
    if (saveErr) console.error("summary save failed", saveErr.message);
    return Response.json(result);
  } catch (e) {
    console.error("summarize failed", e);
    return Response.json({ error: "Couldn't write the summary. Try again." }, { status: 502 });
  }
}
