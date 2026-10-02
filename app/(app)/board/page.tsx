import { createClient } from "@/lib/supabase/server";
import { rowToNote, noteToRow, type NoteRow } from "@/lib/core/mappers";
import { rollover } from "@/lib/core/rollover";
import { DayView } from "@/components/board/DayView";

const today = () => new Date().toISOString().slice(0, 10);

export default async function BoardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id; // layout already redirected if null

  const { data: profile } = await supabase
    .from("profiles")
    .select("capacity_minutes")
    .eq("id", userId)
    .maybeSingle();
  const capacityMinutes: number = (profile?.capacity_minutes as number | null | undefined) ?? 360;

  // today's row, or create it and roll over the most recent day
  let { data: day } = await supabase.from("days").select("id").eq("date", today()).maybeSingle();

  if (!day) {
    const { data: created } = await supabase
      .from("days").insert({ user_id: userId, date: today() }).select("id").single();
    day = created!;

    const { data: prev } = await supabase
      .from("days").select("id, date").lt("date", today()).order("date", { ascending: false }).limit(1).maybeSingle();

    if (prev) {
      const { data: prevNotes } = await supabase
        .from("notes")
        .select("*, carried_from")
        .eq("day_id", prev.id);
      const carried = rollover(
        (prevNotes as NoteRow[] ?? []).map(rowToNote),
        () => crypto.randomUUID(),
        prev.date as string,
      );
      if (carried.length) {
        await supabase.from("notes").insert(carried.map((n) => noteToRow(n, day!.id, userId)));
      }
    }
  }

  const { data: rows } = await supabase
    .from("notes")
    .select("*, carried_from")
    .eq("day_id", day.id)
    .order("created_at");

  return (
    <main className="flex flex-1 flex-col">
      <DayView
        dayId={day.id}
        userId={userId}
        initialNotes={(rows as NoteRow[] ?? []).map(rowToNote)}
        capacityMinutes={capacityMinutes}
      />
    </main>
  );
}
