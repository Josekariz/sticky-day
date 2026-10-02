"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { NoteStatus } from "@/lib/core/types";

export type CalendarDay = {
  date: string;
  done: number;
  total: number;
  summary: string | null;
};

type DayNote = {
  title: string;
  est_minutes: number;
  actual_minutes: number | null;
  status: NoteStatus;
};

const C = 2 * Math.PI * 9;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CalendarView({
  userId,
  year,
  month,
  daysInMonth,
  firstWeekday,
  days,
  today,
  prevHref,
  nextHref,
}: {
  userId: string;
  year: number;
  month: number;
  daysInMonth: number;
  firstWeekday: number;
  days: CalendarDay[];
  today: string;
  prevHref: string;
  nextHref: string;
}) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const monthPrefix = dayKey(year, month, 1).slice(0, 7);
  const todayInMonth = today.startsWith(monthPrefix);
  const [selected, setSelected] = useState<string | null>(todayInMonth ? today : null);
  const [fetched, setFetched] = useState<{ date: string; notes: DayNote[] } | null>(null);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const date = selected;

    void (async () => {
      const supabase = createClient();
      const { data: day } = await supabase
        .from("days")
        .select("id")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

      if (cancelled) return;
      if (!day) {
        setFetched({ date, notes: [] });
        return;
      }

      const { data: rows } = await supabase
        .from("notes")
        .select("title, est_minutes, actual_minutes, status")
        .eq("day_id", day.id)
        .eq("user_id", userId)
        .order("created_at");

      if (cancelled) return;
      setFetched({ date, notes: (rows as DayNote[] | null) ?? [] });
    })();

    return () => {
      cancelled = true;
    };
  }, [selected, userId]);

  const notes = selected && fetched?.date === selected ? fetched.notes : null;
  const loading = selected !== null && fetched?.date !== selected;

  const cells = [
    ...Array(firstWeekday).fill(null) as (number | null)[],
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const info = selected ? byDate.get(selected) : undefined;
  const isToday = selected === today;
  const isPast = selected !== null && selected < today;

  const done = info?.done ?? 0;
  const total = info?.total ?? 0;
  const summary = info?.summary ?? null;

  const doneNotes = notes?.filter((n) => n.status === "done") ?? [];
  const unfinishedNotes = notes?.filter((n) => n.status === "board" || n.status === "focus") ?? [];
  const trashedNotes = notes?.filter((n) => n.status === "trashed") ?? [];

  const selectedDay = selected ? Number(selected.slice(8, 10)) : null;

  return (
    <div className="flex flex-1 flex-col gap-6 lg:flex-row">
      <section className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-frame bg-surface p-5">
        <div className="flex items-center justify-between">
          <Link
            href={prevHref}
            aria-label="Previous month"
            className="grid h-9 w-9 place-items-center rounded-full border border-frame"
          >
            ‹
          </Link>
          <h2 className="font-hand text-3xl font-bold">
            {MONTHS[month - 1]} {year}
          </h2>
          <Link
            href={nextHref}
            aria-label="Next month"
            className="grid h-9 w-9 place-items-center rounded-full border border-frame"
          >
            ›
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-fg-soft">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />;
            const date = dayKey(year, month, d);
            const pair = byDate.get(date);
            const frac = pair && pair.total > 0 ? pair.done / pair.total : 0;
            const isSel = date === selected;
            const isTodayCell = date === today;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelected(date)}
                className={`flex h-16 flex-col items-center justify-between rounded-lg border p-1.5 text-sm font-semibold ${
                  isSel
                    ? "border-fg bg-fg text-bg"
                    : isTodayCell
                      ? "border-fg bg-surface"
                      : "border-frame bg-bg"
                } ${date > today ? "opacity-40" : ""}`}
              >
                <span>{d}</span>
                {pair && pair.total > 0 ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                    <circle
                      cx="12" cy="12" r="9" fill="none"
                      stroke="currentColor" strokeOpacity="0.15" strokeWidth="4"
                    />
                    <circle
                      cx="12" cy="12" r="9" fill="none" strokeWidth="4" strokeLinecap="round"
                      stroke={frac >= 1 ? "var(--done)" : "currentColor"}
                      strokeDasharray={`${frac * C} ${C}`}
                      transform="rotate(-90 12 12)"
                    />
                  </svg>
                ) : (
                  <span className="h-6 w-6" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-1 flex-col gap-4 rounded-2xl border border-frame bg-surface p-6">
        {selected && selectedDay !== null ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-hand text-4xl font-bold">
                  {selectedDay} {MONTHS[month - 1]}
                </h2>
                <p className="text-sm text-fg-soft">
                  {total > 0 ? `${done} of ${total} done` : "No notes"}
                </p>
              </div>
              {isToday ? (
                <Link
                  href="/board"
                  className="rounded-lg bg-bg px-2.5 py-1 text-xs font-semibold text-fg underline-offset-2 hover:underline"
                >
                  Go to board
                </Link>
              ) : isPast ? (
                <span className="rounded-lg bg-bg px-2.5 py-1 text-xs font-semibold text-fg-soft">
                  Read only
                </span>
              ) : null}
            </div>

            {total > 0 && (
              <div className="h-3 overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full bg-done"
                  style={{ width: `${(done / total) * 100}%` }}
                />
              </div>
            )}

            {summary && (
              <p className="rounded-xl bg-bg p-4 text-sm leading-relaxed text-fg-soft">
                {summary}
              </p>
            )}

            {loading ? (
              <p className="text-sm text-fg-soft">Loading notes…</p>
            ) : notes && notes.length > 0 ? (
              <div className="flex flex-col gap-5">
                <NoteGroup label="Done" items={doneNotes} />
                <NoteGroup label="Unfinished" items={unfinishedNotes} />
                <NoteGroup label="Trashed" items={trashedNotes} />
              </div>
            ) : notes && !summary ? (
              <p className="m-auto font-hand text-2xl text-fg-soft">Nothing logged.</p>
            ) : null}
          </>
        ) : (
          <p className="m-auto font-hand text-2xl text-fg-soft">Pick a day.</p>
        )}
      </section>
    </div>
  );
}

function NoteGroup({ label, items }: { label: string; items: DayNote[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-fg-soft">{label}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((n, i) => (
          <li
            key={`${n.title}-${i}`}
            className="flex items-baseline justify-between gap-3 rounded-lg bg-bg px-3 py-2 text-sm"
          >
            <span className="font-semibold">{n.title}</span>
            <span className="shrink-0 tabular-nums text-fg-soft">
              est. {n.est_minutes}
              {n.actual_minutes != null ? ` · took ${n.actual_minutes}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
