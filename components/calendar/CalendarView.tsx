"use client";

import { useState } from "react";

// fake: day-of-month -> [done, total]
const FAKE: Record<number, [number, number]> = {
  1: [3, 3], 2: [4, 5], 3: [5, 5], 4: [2, 4], 7: [4, 4], 8: [3, 6], 9: [5, 5],
  10: [4, 4], 11: [3, 5], 14: [6, 6], 15: [2, 5], 16: [4, 4], 17: [5, 6], 18: [4, 6],
  21: [3, 5], 22: [5, 5], 23: [2, 6], 24: [4, 4], 25: [3, 4], 28: [4, 5], 29: [6, 6],
};
const TODAY = 30;
const DAYS_IN_MONTH = 30;
const FIRST_WEEKDAY = 1; // 0 = Mon … 6 = Sun; Sept 2026 starts on a Tuesday
const C = 2 * Math.PI * 9;

export function CalendarView() {
  const [selected, setSelected] = useState<number | null>(29);
  const cells = [...Array(FIRST_WEEKDAY).fill(null), ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1)];

  return (
    <div className="flex flex-1 flex-col gap-6 lg:flex-row">
      <section className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-frame bg-surface p-5">
        <div className="flex items-center justify-between">
          <button aria-label="Previous month" className="h-9 w-9 rounded-full border border-frame">‹</button>
          <h2 className="font-hand text-3xl font-bold">September 2026</h2>
          <button aria-label="Next month" className="h-9 w-9 rounded-full border border-frame">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-fg-soft">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />;
            const pair = FAKE[d];
            const frac = pair ? pair[0] / pair[1] : 0;
            const isSel = d === selected;
            const isToday = d === TODAY;
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                className={`flex h-16 flex-col items-center justify-between rounded-lg border p-1.5 text-sm font-semibold ${
                  isSel ? "border-fg bg-fg text-bg" : isToday ? "border-fg bg-surface" : "border-frame bg-bg"
                } ${d > TODAY ? "opacity-40" : ""}`}
              >
                <span>{d}</span>
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
                  {pair && (
                    <circle
                      cx="12" cy="12" r="9" fill="none" strokeWidth="4" strokeLinecap="round"
                      stroke={frac >= 1 ? "#2E7D4F" : "currentColor"}
                      strokeDasharray={`${frac * C} ${C}`}
                      transform="rotate(-90 12 12)"
                    />
                  )}
                </svg>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-1 flex-col gap-4 rounded-2xl border border-frame bg-surface p-6">
        {selected && FAKE[selected] ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-hand text-4xl font-bold">{selected} September</h2>
                <p className="text-sm text-fg-soft">{FAKE[selected][0]} of {FAKE[selected][1]} done</p>
              </div>
              <span className="rounded-lg bg-bg px-2.5 py-1 text-xs font-semibold text-fg-soft">Read only</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-bg">
              <div className="h-full bg-[#2E7D4F]" style={{ width: `${(FAKE[selected][0] / FAKE[selected][1]) * 100}%` }} />
            </div>
            <p className="rounded-xl bg-bg p-4 text-sm leading-relaxed text-fg-soft">
              The day’s notes and its recap will appear here once the database is wired.
            </p>
          </>
        ) : (
          <p className="m-auto font-hand text-2xl text-fg-soft">Pick a day.</p>
        )}
      </section>
    </div>
  );
}
