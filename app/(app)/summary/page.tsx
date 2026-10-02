import { createClient } from "@/lib/supabase/server";
import { rowToNote, type NoteRow } from "@/lib/core/mappers";
import { weekdayLong } from "@/lib/core/date";
import { SummaryView, type SummaryData } from "@/components/summary/SummaryView";

const today = () => new Date().toISOString().slice(0, 10);

function yesterdayIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default async function SummaryPage() {
  const supabase = await createClient();
  const todayDate = today();
  const yDate = yesterdayIso(todayDate);

  const { data: yesterday } = await supabase
    .from("days")
    .select("id, date, summary")
    .eq("date", yDate)
    .maybeSingle();

  const { data: todayDay } = await supabase
    .from("days")
    .select("id")
    .eq("date", todayDate)
    .maybeSingle();

  let yesterdayDone: string[] = [];
  let yesterdayCarried: string[] = [];
  if (yesterday) {
    const { data: rows } = await supabase
      .from("notes")
      .select("*, carried_from")
      .eq("day_id", yesterday.id);
    const notes = ((rows as NoteRow[] | null) ?? []).map(rowToNote);
    yesterdayDone = notes.filter((n) => n.status === "done").map((n) => n.title);
    yesterdayCarried = notes
      .filter((n) => n.status === "board" || n.status === "focus")
      .map((n) => n.title);
  }

  let todayTitles: string[] = [];
  if (todayDay) {
    const { data: rows } = await supabase
      .from("notes")
      .select("*, carried_from")
      .eq("day_id", todayDay.id)
      .eq("status", "board");
    todayTitles = ((rows as NoteRow[] | null) ?? []).map(rowToNote).map((n) => n.title);
  }

  const data: SummaryData = {
    yesterdayDone,
    yesterdayCarried,
    yesterdaySummary: (yesterday?.summary as string | null | undefined) ?? null,
    today: todayTitles,
    blockers: [],
  };

  const headingDate = yesterday?.date as string | undefined ?? yDate;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-hand text-5xl font-bold">{weekdayLong(headingDate)} summary</h1>
        <p className="text-sm text-fg-soft">Written from yesterday’s board and today’s notes. Nothing to type.</p>
      </div>
      <SummaryView data={data} />
    </main>
  );
}
