"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DayDrawer, type DayDrawerNote } from "./DayDrawer";

export type CalendarDay = {
  date: string;
  done: number;
  total: number;
  summary: string | null;
  summaryCreatedAt: string | null;
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
  const [selected, setSelected] = useState<string | null>(null);
  const [fetched, setFetched] = useState<{ date: string; notes: DayDrawerNote[] } | null>(null);

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
      setFetched({ date, notes: (rows as DayDrawerNote[] | null) ?? [] });
    })();

    return () => {
      cancelled = true;
    };
  }, [selected, userId]);

  const close = useCallback(() => setSelected(null), []);
  const drawerRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (drawerRef.current?.contains(target) || gridRef.current?.contains(target)) return;
      setSelected(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [selected]);

  const notes = selected && fetched?.date === selected ? fetched.notes : null;
  const loading = selected !== null && fetched?.date !== selected;
  const info = selected ? byDate.get(selected) : undefined;

  const cells = [
    ...Array(firstWeekday).fill(null) as (number | null)[],
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={`flex flex-col items-center gap-3 ${selected ? "md:pr-[28rem]" : ""}`}>
      <section className="flex w-full max-w-[35rem] flex-col gap-4 rounded-2xl border border-frame bg-surface p-5">
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

        <div ref={gridRef} className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />;
            const date = dayKey(year, month, d);
            const pair = byDate.get(date);
            const hasNotes = !!pair && pair.total > 0;
            const frac = hasNotes ? pair.done / pair.total : 0;
            const isSel = date === selected;
            const isTodayCell = date === today;
            const isFuture = date > today;
            return (
              <button
                key={d}
                type="button"
                disabled={isFuture}
                aria-disabled={isFuture}
                onClick={() => {
                  if (isFuture) return;
                  setSelected(date);
                }}
                className={`flex h-16 flex-col items-center justify-between rounded-lg border p-1.5 text-sm font-semibold ${
                  isFuture
                    ? "cursor-default border-frame bg-bg opacity-40"
                    : isSel
                      ? "border-fg bg-fg text-bg"
                      : isTodayCell
                        ? "border-fg bg-surface"
                        : "border-frame bg-bg"
                }`}
              >
                <span>{d}</span>
                {hasNotes ? (
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

      {!selected && (
        <p className="text-center text-sm text-fg-soft">Pick a day to see how it went.</p>
      )}

      <DayDrawer
        date={selected}
        today={today}
        summary={info?.summary ?? null}
        summaryCreatedAt={info?.summaryCreatedAt ?? null}
        notes={notes}
        loading={loading}
        onClose={close}
        panelRef={drawerRef}
      />
    </div>
  );
}
