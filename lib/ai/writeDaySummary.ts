import type { SupabaseClient } from "@supabase/supabase-js";
import { withFallback } from "@/lib/ai/model";
import {
  parseStoredSummary,
  summarizeDay,
  type StoredSummary,
  type SummarizeInput,
} from "@/lib/ai/tasks/summarize";
import { noteToRow, rowToNote, type NoteRow } from "@/lib/core/mappers";
import { rollover } from "@/lib/core/rollover";

/** Today's day row: create + rollover if missing. */
export async function ensureTodayDay(
  supabase: SupabaseClient,
  userId: string,
  todayDate: string,
): Promise<{ id: string; summary: unknown }> {
  let { data: day } = await supabase
    .from("days")
    .select("id, summary")
    .eq("user_id", userId)
    .eq("date", todayDate)
    .maybeSingle();

  if (day) return day as { id: string; summary: unknown };

  const { data: created, error } = await supabase
    .from("days")
    .insert({ user_id: userId, date: todayDate })
    .select("id, summary")
    .single();
  if (error || !created) throw error ?? new Error("Could not create today");
  day = created;

  const { data: prev } = await supabase
    .from("days")
    .select("id, date")
    .eq("user_id", userId)
    .lt("date", todayDate)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (prev) {
    const { data: prevNotes } = await supabase
      .from("notes")
      .select("*, carried_from")
      .eq("day_id", prev.id)
      .eq("user_id", userId);
    const carried = rollover(
      ((prevNotes as NoteRow[] | null) ?? []).map(rowToNote),
      () => crypto.randomUUID(),
      prev.date as string,
    );
    if (carried.length) {
      await supabase.from("notes").insert(carried.map((n) => noteToRow(n, day!.id, userId)));
    }
  }

  return day as { id: string; summary: unknown };
}

/** Write (or return cached) end-of-day summary for a day. */
export async function writeDaySummary(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
  opts: { force?: boolean } = {},
): Promise<StoredSummary> {
  const force = opts.force ?? false;

  const { data: day, error: dayErr } = await supabase
    .from("days")
    .select("id, date, summary, capacity_minutes")
    .eq("id", dayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (dayErr || !day) throw new Error("Day not found");

  const cached = parseStoredSummary(day.summary);
  if (cached && !force) return cached;

  const { data: profile } = await supabase
    .from("profiles")
    .select("capacity_minutes")
    .eq("id", userId)
    .maybeSingle();

  const { data: noteRows } = await supabase
    .from("notes")
    .select("*, carried_from")
    .eq("day_id", dayId)
    .eq("user_id", userId)
    .neq("status", "trashed");

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
  };

  const result: StoredSummary = await withFallback(async (model, modelId) => ({
    ...(await summarizeDay(model, input)),
    model: modelId,
    createdAt: new Date().toISOString(),
  }));

  let q = supabase
    .from("days")
    .update({ summary: result })
    .eq("id", dayId)
    .eq("user_id", userId);
  if (!force) q = q.is("summary", null);

  const { error: saveErr } = await q;
  if (saveErr) console.error("summary save failed", saveErr.message);

  // Another request may have won the race; prefer whatever is stored now.
  if (!force) {
    const { data: again } = await supabase
      .from("days")
      .select("summary")
      .eq("id", dayId)
      .eq("user_id", userId)
      .maybeSingle();
    const stored = parseStoredSummary(again?.summary);
    if (stored) return stored;
  }

  return result;
}
