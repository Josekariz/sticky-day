import { createClient } from "@/lib/supabase/server";
import { rowToNote, type NoteRow } from "@/lib/core/mappers";
import { todayFor } from "@/lib/core/date";
import { SummaryView, type SummaryBlock } from "@/components/summary/SummaryView";
import { parseStoredSummary } from "@/lib/ai/tasks/summarize";
import { ensureTodayDay } from "@/lib/ai/writeDaySummary";

type NoteRowWithTimes = NoteRow & {
  created_at?: string;
  completed_at?: string | null;
  started_at?: string | null;
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

  const googleName: string = user?.user_metadata.full_name ?? user?.email?.split("@")[0] ?? "";
  const displayName: string = (profile?.display_name as string | null | undefined)?.trim() || googleName;
  const firstName = displayName.split(/\s+/)[0] || null;

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
    for (const iso of [r.created_at, r.completed_at, r.started_at]) {
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
