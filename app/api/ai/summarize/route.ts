import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { withFallback } from "@/lib/ai/model";
import { summarizeDay, type SummarizeInput, type SummarizeResult } from "@/lib/ai/tasks/summarize";
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
    .maybeSingle();

  if (dayErr || !day) return Response.json({ error: "Day not found" }, { status: 404 });

  if (day.summary && !force) {
    const cached: SummarizeResult = {
      recap: day.summary as string,
      carryOver: [],
      dropSuggestions: [],
    };
    return Response.json(cached);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("capacity_minutes")
    .eq("id", user.id)
    .maybeSingle();

  const { data: noteRows } = await supabase
    .from("notes")
    .select("*, carried_from")
    .eq("day_id", dayId);

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
    const result = await withFallback((model) => summarizeDay(model, input));
    const { error: saveErr } = await supabase
      .from("days")
      .update({ summary: result.recap })
      .eq("id", dayId);
    if (saveErr) console.error("summary save failed", saveErr.message);
    return Response.json(result);
  } catch (e) {
    console.error("summarize failed", e);
    return Response.json({ error: "Couldn't write the summary. Try again." }, { status: 502 });
  }
}
