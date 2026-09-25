"use client";

import { useEffect, useState } from "react";
import { paperVar, type Note } from "@/lib/core/types";

type Props = {
  note: Note | null;
  onDone: (id: string) => void;
  onPutBack: (id: string) => void;
};

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function Clipboard({ note, onDone, onPutBack }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!note) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [note?.id]);

  const elapsed = note?.startedAt ? now - note.startedAt : 0;
  const left = note ? note.estMinutes * 60_000 - elapsed : 0;

  return (
    <section className="relative rounded-xl bg-[#B98F63] p-4 pt-8 shadow-lg">
      <span
        className="absolute left-1/2 top-[-12px] h-7 w-28 -translate-x-1/2 rounded-lg bg-[#4A4A4A] shadow-[inset_0_2px_0_rgba(255,255,255,0.25),0_3px_4px_rgba(0,0,0,0.3)]"
        aria-hidden
      />
      <div className="flex flex-col gap-3 rounded bg-[#FFFDF8] p-4 text-[#1F1D1A]">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#5A554B]">Working on</h2>

        {note ? (
          <>
            <div
              className="sticky-note relative rotate-[-1.5deg] p-3 text-ink"
              style={{ backgroundColor: paperVar(note.color), ["--paper" as string]: paperVar(note.color) }}
            >
              <div className="relative font-hand text-2xl font-semibold leading-tight">{note.title}</div>
              <div className="relative mt-1 text-xs font-semibold text-ink-soft">est. {note.estMinutes} min</div>
            </div>

            <div className="py-1 text-center">
              <div className="text-4xl font-bold tabular-nums leading-none">{fmt(elapsed)}</div>
              <div className={`mt-1 text-xs ${left < 0 ? "text-[#B23A22]" : "text-[#5A554B]"}`}>
                {left >= 0 ? `${fmt(left)} left on your estimate` : `${fmt(-left)} over`}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => onDone(note.id)} className="h-11 flex-1 rounded-xl bg-[#1F1D1A] text-sm font-semibold text-[#FBFAF6]">
                Done
              </button>
              <button onClick={() => onPutBack(note.id)} className="h-11 rounded-xl border border-[#D9D6CE] px-4 text-sm font-semibold">
                Put back
              </button>
            </div>
          </>
        ) : (
          <p className="py-6 text-center font-hand text-xl text-[#5A554B]">Nothing pinned. Open a note and hit “Work on it”.</p>
        )}
      </div>
    </section>
  );
}