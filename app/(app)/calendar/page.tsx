import { createClient } from "@/lib/supabase/server";
import { monthGrid } from "@/lib/core/calendar";
import { todayFor } from "@/lib/core/date";
import { CalendarView, type CalendarDay } from "@/components/calendar/CalendarView";
import { parseStoredSummary, summaryStory } from "@/lib/ai/tasks/summarize";

function parseMonth(raw: string | undefined, today: string): { year: number; month: number } {
  const [ty, tm] = today.split("-").map(Number);
  const fallback = { year: ty, month: tm };
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) return fallback;
  const [y, m] = raw.split("-").map(Number);
  if (m < 1 || m > 12) return fallback;
  return { year: y, month: m };
}

function monthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shiftMonth(year: number, month: number, delta: number): string {
  const d = new Date(year, month - 1 + delta, 1);
  return monthParam(d.getFullYear(), d.getMonth() + 1);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.m) ? sp.m[0] : sp.m;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id; // layout already redirected if null

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  const timezone = (profile?.timezone as string | null | undefined) ?? "UTC";
  const today = todayFor(timezone);

  const { year, month } = parseMonth(raw, today);
  const { daysInMonth, firstWeekday } = monthGrid(year, month);

  const start = `${monthParam(year, month)}-01`;
  const end = `${monthParam(year, month)}-${String(daysInMonth).padStart(2, "0")}`;

  const { data: rows } = await supabase
    .from("days")
    .select("date, summary, notes(status)")
    .eq("user_id", userId)
    .eq("notes.user_id", userId)
    .gte("date", start)
    .lte("date", end);

  const days: CalendarDay[] = (rows ?? []).map((row) => {
    const notes = (row.notes ?? []) as { status: string }[];
    const active = notes.filter((n) => n.status !== "trashed");
    const stored = parseStoredSummary(row.summary);
    return {
      date: row.date as string,
      done: active.filter((n) => n.status === "done").length,
      total: active.length,
      summary: stored ? summaryStory(stored) || null : null,
      summaryCreatedAt: stored?.createdAt ?? null,
    };
  });

  return (
    <main className="flex flex-1 flex-col gap-6">
      <h1 className="font-hand text-5xl font-bold">Calendar</h1>
      <CalendarView
        key={monthParam(year, month)}
        userId={userId}
        year={year}
        month={month}
        daysInMonth={daysInMonth}
        firstWeekday={firstWeekday}
        days={days}
        today={today}
        prevHref={`/calendar?m=${shiftMonth(year, month, -1)}`}
        nextHref={`/calendar?m=${shiftMonth(year, month, 1)}`}
      />
    </main>
  );
}
