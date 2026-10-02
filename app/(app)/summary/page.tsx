import { createClient } from "@/lib/supabase/server";
import { rowToNote, type NoteRow } from "@/lib/core/mappers";
import { todayFor } from "@/lib/core/date";
import { firstNameOf, resolveDisplayName } from "@/lib/core/name";
import { SummaryView, type SummaryBlock } from "@/components/summary/SummaryView";
import { parseStoredSummary } from "@/lib/ai/tasks/summarize";
import { ensureTodayDay } from "@/lib/ai/writeDaySummary";

type NoteRowWithTimes = NoteRow & {
  created_at?: string;
  updated_at?: string;
};

export default async function SummaryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone, summary_time")
    .eq("id", userId)
    .maybeSingle();

  const timezone = (profile?.timezone as string | null | undefined) ?? "UTC";
  const summaryTime = String(profile?.summary_time ?? "18:00");
  const today = todayFor(timezone);

  const displayName = resolveDisplayName(
    profile?.display_name as string | null | undefined,
    user?.user_metadata ?? {},
    user?.email,
  );
  const firstName = firstNameOf(displayName);

  const day = await ensureTodayDay(supabase, userId, today);

  const { data: rows } = await supabase
    .from("notes")
    .select("*, carried_from")
    .eq("day_id", day.id)
    .eq("user_id", userId)
    .neq("status", "trashed");

  const noteRows = (rows as NoteRowWithTimes[] | null) ?? [];
  const notes = noteRows.map(rowToNote);
  const summary = parseStoredSummary(day.summary);

  let latestNoteMs = 0;
  for (const r of noteRows) {
    for (const iso of [r.created_at, r.updated_at]) {
      if (!iso) continue;
      const t = new Date(iso).getTime();
      if (Number.isFinite(t) && t > latestNoteMs) latestNoteMs = t;
    }
  }
  const summaryMs = summary?.createdAt ? new Date(summary.createdAt).getTime() : 0;
  const stale = !!summary?.createdAt && latestNoteMs > summaryMs;

  const data: SummaryBlock = {
    date: today,
    dayId: day.id,
    firstName,
    timezone,
    summary,
    doneNotes: notes.filter((n) => n.status === "done"),
    unfinishedNotes: notes.filter((n) => n.status === "board" || n.status === "focus"),
    summaryTime,
    stale,
  };

  return (
    <main className="flex flex-1 flex-col py-2">
      <SummaryView data={data} />
    </main>
  );
}
