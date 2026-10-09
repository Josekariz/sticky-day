import { createClient } from "@/lib/supabase/server";
import { rowToNote, type NoteRow } from "@/lib/core/mappers";
import { todayFor } from "@/lib/core/date";
import { parseShape } from "@/lib/core/types";
import { DayView } from "@/components/board/DayView";
import { parseStoredSummary } from "@/lib/ai/tasks/summarize";
import { ensureTodayDay } from "@/lib/ai/writeDaySummary";

export default async function BoardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id; // layout already redirected if null

  const { data: profile } = await supabase
    .from("profiles")
    .select("capacity_minutes, timezone, default_shape, onboarded_at")
    .eq("id", userId)
    .maybeSingle();
  const capacityMinutes: number = (profile?.capacity_minutes as number | null | undefined) ?? 360;
  const timezone = (profile?.timezone as string | null | undefined) ?? "UTC";
  const defaultShape = parseShape(profile?.default_shape);
  const onboarded = profile?.onboarded_at != null;
  const today = todayFor(timezone);

  const day = await ensureTodayDay(supabase, userId, today);

  const { data: rows } = await supabase
    .from("notes")
    .select("*, carried_from")
    .eq("day_id", day.id)
    .eq("user_id", userId)
    .order("created_at");

  // Only asked before the first-visit card is answered: has this account ever had a note?
  let isNewAccount = false;
  if (!onboarded) {
    const { count } = await supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    isNewAccount = (count ?? 0) === 0;
  }

  return (
    <main className="flex flex-1 flex-col">
      <DayView
        dayId={day.id}
        userId={userId}
        initialNotes={(rows as NoteRow[] ?? []).map(rowToNote)}
        capacityMinutes={capacityMinutes}
        initialSummary={parseStoredSummary(day.summary)}
        defaultShape={defaultShape}
        onboarded={onboarded}
        isNewAccount={isNewAccount}
      />
    </main>
  );
}
