import { createClient } from "@/lib/supabase/server";
import { rowToNote, type NoteRow } from "@/lib/core/mappers";
import { todayFor } from "@/lib/core/date";
import { SummaryView, type SummaryBlock } from "@/components/summary/SummaryView";
import { parseStoredSummary } from "@/lib/ai/tasks/summarize";
import { ensureTodayDay } from "@/lib/ai/writeDaySummary";

export default async function SummaryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, summary_time")
    .eq("id", userId)
    .maybeSingle();

  const timezone = (profile?.timezone as string | null | undefined) ?? "UTC";
  const summaryTime = String(profile?.summary_time ?? "18:00");
  const today = todayFor(timezone);

  const day = await ensureTodayDay(supabase, userId, today);

  const { data: rows } = await supabase
    .from("notes")
    .select("*, carried_from")
    .eq("day_id", day.id)
    .eq("user_id", userId)
    .neq("status", "trashed");

  const notes = ((rows as NoteRow[] | null) ?? []).map(rowToNote);
  const data: SummaryBlock = {
    date: today,
    dayId: day.id,
    summary: parseStoredSummary(day.summary),
    done: notes
      .filter((n) => n.status === "done")
      .map((n) => ({
        title: n.title,
        estMinutes: n.estMinutes,
        actualMinutes: n.actualMinutes ?? n.estMinutes,
      })),
    carried: notes.filter((n) => n.status === "board" || n.status === "focus").map((n) => n.title),
    summaryTime,
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-hand text-5xl font-bold">Summary</h1>
        <p className="text-sm text-fg-soft">One block for Slack. Writes itself when your day ends.</p>
      </div>
      <SummaryView data={data} />
    </main>
  );
}
