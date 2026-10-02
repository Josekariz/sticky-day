import { createClient } from "@/lib/supabase/server";
import { rowToNote, type NoteRow } from "@/lib/core/mappers";
import { todayFor } from "@/lib/core/date";
import { DayView } from "@/components/board/DayView";
import { parseStoredSummary } from "@/lib/ai/tasks/summarize";
import { ensureTodayDay } from "@/lib/ai/writeDaySummary";

export default async function BoardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id; // layout already redirected if null

  const { data: profile } = await supabase
    .from("profiles")
    .select("capacity_minutes, timezone")
    .eq("id", userId)
    .maybeSingle();
  const capacityMinutes: number = (profile?.capacity_minutes as number | null | undefined) ?? 360;
  const timezone = (profile?.timezone as string | null | undefined) ?? "UTC";
  const today = todayFor(timezone);

  const day = await ensureTodayDay(supabase, userId, today);

  const { data: rows } = await supabase
    .from("notes")
    .select("*, carried_from")
    .eq("day_id", day.id)
    .eq("user_id", userId)
    .order("created_at");

  return (
    <main className="flex flex-1 flex-col">
      <DayView
        dayId={day.id}
        userId={userId}
        initialNotes={(rows as NoteRow[] ?? []).map(rowToNote)}
        capacityMinutes={capacityMinutes}
        initialSummary={parseStoredSummary(day.summary)}
      />
    </main>
  );
}
