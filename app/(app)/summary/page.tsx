import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rowToNote, type NoteRow } from "@/lib/core/mappers";
import { todayFor, yesterdayFor } from "@/lib/core/date";
import { firstNameOf, resolveDisplayName } from "@/lib/core/name";
import { SummaryView, type SummaryBlock } from "@/components/summary/SummaryView";
import { parseStoredSummary } from "@/lib/ai/tasks/summarize";
import { ensureTodayDay } from "@/lib/ai/writeDaySummary";
import { markSummaryRead } from "@/lib/summary/markRead";
import { resolveSummaryDate } from "@/lib/summary/unread";
import { RefreshAfterRead } from "@/components/summary/RefreshAfterRead";

type NoteRowWithTimes = NoteRow & {
  created_at?: string;
  updated_at?: string;
};

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string | string[] }>;
}) {
  const sp = await searchParams;
  const dayRaw = Array.isArray(sp.day) ? sp.day[0] : sp.day;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const userId = user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone, summary_time")
    .eq("id", userId)
    .maybeSingle();

  const timezone = (profile?.timezone as string | null | undefined) ?? "UTC";
  const summaryTime = String(profile?.summary_time ?? "18:00");
  const today = todayFor(timezone);
  const yesterday = yesterdayFor(timezone);
  const date = resolveSummaryDate(dayRaw, today, yesterday);

  const displayName = resolveDisplayName(
    profile?.display_name as string | null | undefined,
    user?.user_metadata ?? {},
    user?.email,
  );
  const firstName = firstNameOf(displayName);

  let dayId: string;
  let summaryRaw: unknown;

  if (date === today) {
    const day = await ensureTodayDay(supabase, userId, today);
    dayId = day.id;
    summaryRaw = day.summary;
  } else {
    const { data: day } = await supabase
      .from("days")
      .select("id, summary")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();
    // No row for that past day — fall back to today's letter page.
    if (!day) redirect("/summary");
    dayId = day.id as string;
    summaryRaw = day.summary;
  }

  const { data: dayRow } = await supabase
    .from("days")
    .select("summary, summary_read_at")
    .eq("id", dayId)
    .eq("user_id", userId)
    .maybeSingle();

  const summary = parseStoredSummary(dayRow?.summary ?? summaryRaw);
  let didMark = false;
  if (summary && dayRow?.summary_read_at == null) {
    didMark = await markSummaryRead(supabase, dayId);
  }

  const { data: rows } = await supabase
    .from("notes")
    .select("*, carried_from")
    .eq("day_id", dayId)
    .eq("user_id", userId)
    .neq("status", "trashed");

  const noteRows = (rows as NoteRowWithTimes[] | null) ?? [];
  const notes = noteRows.map(rowToNote);

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
    date,
    dayId,
    firstName,
    timezone,
    summary,
    doneNotes: notes.filter((n) => n.status === "done"),
    focusNotes: notes.filter((n) => n.status === "focus"),
    unfinishedNotes: notes.filter((n) => n.status === "board"),
    summaryTime,
    stale,
  };

  return (
    <main className="flex flex-1 flex-col py-2">
      <RefreshAfterRead didMark={didMark} />
      <SummaryView data={data} />
    </main>
  );
}
