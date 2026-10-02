import type { SupabaseClient } from "@supabase/supabase-js";
import { withFallback } from "@/lib/ai/model";
import { spendAiCall } from "@/lib/ai/spendAiCall";
import {
  isSummaryBusy,
  parseStoredSummary,
  pendingClaimMarker,
  summarizeDay,
  type StoredSummary,
  type SummarizeInput,
} from "@/lib/ai/tasks/summarize";
import { noteToRow, rowToNote, type NoteRow } from "@/lib/core/mappers";
import { rollover } from "@/lib/core/rollover";
import { themeFor } from "@/lib/core/themes";

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

  if (error) {
    // Concurrent tab won the unique(user_id, date) race — re-select, no rollover.
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .from("days")
        .select("id, summary")
        .eq("user_id", userId)
        .eq("date", todayDate)
        .maybeSingle();
      if (existing) return existing as { id: string; summary: unknown };
    }
    throw error;
  }
  if (!created) throw new Error("Could not create today");
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

async function clearPendingClaim(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
): Promise<void> {
  await supabase
    .from("days")
    .update({ summary: null })
    .eq("id", dayId)
    .eq("user_id", userId)
    .contains("summary", { pending: true });
}

/** Claim the summary slot before calling the model (non-force only). */
async function claimSummarySlot(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
  current: unknown,
): Promise<"claimed" | "done" | "busy"> {
  const cached = parseStoredSummary(current);
  if (cached) return "done";
  if (isSummaryBusy(current)) return "busy";

  const marker = pendingClaimMarker();

  let q = supabase
    .from("days")
    .update({ summary: marker })
    .eq("id", dayId)
    .eq("user_id", userId);

  // Null → first claim. Stale pending → reclaim by matching pending flag.
  if (current == null) {
    q = q.is("summary", null);
  } else {
    q = q.contains("summary", { pending: true });
  }

  const { data: claimed } = await q.select("id").maybeSingle();
  if (claimed) return "claimed";

  const { data: again } = await supabase
    .from("days")
    .select("summary")
    .eq("id", dayId)
    .eq("user_id", userId)
    .maybeSingle();
  if (parseStoredSummary(again?.summary)) return "done";
  return "busy";
}

/** Write (or return cached) end-of-day summary for a day. */
export async function writeDaySummary(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
  opts: { force?: boolean; countTowardQuota?: boolean } = {},
): Promise<StoredSummary> {
  const force = opts.force ?? false;
  const countTowardQuota = opts.countTowardQuota ?? false;

  const { data: day, error: dayErr } = await supabase
    .from("days")
    .select("id, date, summary, capacity_minutes")
    .eq("id", dayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (dayErr || !day) throw new Error("Day not found");

  const cached = parseStoredSummary(day.summary);
  if (cached && !force) return cached;

  if (!force) {
    const claim = await claimSummarySlot(supabase, userId, dayId, day.summary);
    if (claim === "done") {
      const { data: again } = await supabase
        .from("days")
        .select("summary")
        .eq("id", dayId)
        .eq("user_id", userId)
        .maybeSingle();
      const stored = parseStoredSummary(again?.summary);
      if (stored) return stored;
    }
    if (claim === "busy") throw new Error("Summary is already being written");
  }

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
    theme: themeFor(day.date as string),
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

  if (countTowardQuota) await spendAiCall(supabase, userId);

  const theme = input.theme;
  let result: StoredSummary;
  try {
    result = await withFallback(async (model, modelId) => ({
      ...(await summarizeDay(model, input)),
      model: modelId,
      theme,
      createdAt: new Date().toISOString(),
    }));
  } catch (e) {
    if (!force) await clearPendingClaim(supabase, userId, dayId);
    throw e;
  }

  const { error: saveErr } = await supabase
    .from("days")
    .update({ summary: result })
    .eq("id", dayId)
    .eq("user_id", userId);
  if (saveErr) console.error("summary save failed", saveErr.message);

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
