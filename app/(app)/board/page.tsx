import { redirect } from "next/navigation";
import { rowToNote, type NoteRow } from "@/lib/core/mappers";
import { todayFor } from "@/lib/core/date";
import { parseShape } from "@/lib/core/types";
import { DayView } from "@/components/board/DayView";
import { parseStoredSummary } from "@/lib/ai/tasks/summarize";
import { ensureTodayDay } from "@/lib/ai/writeDaySummary";
import { getSessionUser } from "@/lib/supabase/session";

export default async function BoardPage() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/");
  const userId = user.id;

  // Auth is shared with the layout via getSessionUser(); profile then day stay serial
  // because ensureTodayDay needs timezone from the profile.
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, default_shape, onboarded_at")
    .eq("id", userId)
    .maybeSingle();
  const timezone = (profile?.timezone as string | null | undefined) ?? "UTC";
  const defaultShape = parseShape(profile?.default_shape);
  const onboarded = profile?.onboarded_at != null;
  const today = todayFor(timezone);

  const day = await ensureTodayDay(supabase, userId, today);

  const notesPromise = supabase
    .from("notes")
    .select("*, carried_from")
    .eq("day_id", day.id)
    .eq("user_id", userId)
    .order("created_at");

  // Only asked before the first-visit card is answered: has this account ever had a note?
  const [{ data: rows }, newAccountResult] = await Promise.all([
    notesPromise,
    !onboarded
      ? supabase
          .from("notes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
      : Promise.resolve({ count: null as number | null }),
  ]);
  const isNewAccount = !onboarded && (newAccountResult.count ?? 0) === 0;

  return (
    <main className="flex flex-1 flex-col">
      <DayView
        account={{ userId, dayId: day.id, date: today }}
        initialNotes={(rows as NoteRow[] ?? []).map(rowToNote)}
        initialSummary={parseStoredSummary(day.summary)}
        defaultShape={defaultShape}
        onboarded={onboarded}
        isNewAccount={isNewAccount}
      />
    </main>
  );
}
