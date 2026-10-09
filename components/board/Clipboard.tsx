"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { paperVar, MAX_FOCUS, type Note } from "@/lib/core/types";
import { weekdayShort } from "@/lib/core/date";
import { centreOf } from "./useDropTargets";

type Props = {
  notes: Note[]; // status === "focus", newest last
  armed: boolean; // a note is being dragged over me
  onDone: (id: string) => void;
  onPutBack: (id: string) => void;
  onResume: (id: string) => void;
  onDragStart: () => void;
  onDragMove: (px: number, py: number, pointer?: [number, number]) => void;
  onDragEnd: (id: string) => void;
};

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function Clipboard({
  notes,
  armed,
  onDone,
  onPutBack,
  onResume,
  onDragStart,
  onDragMove,
  onDragEnd,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const slips = useRef(new Map<string, HTMLDivElement>());
  const running = notes.some((n) => n.startedAt);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  return (
    <section
      data-drop="clipboard"
      className={`relative overflow-visible rounded-xl bg-clipboard p-4 pt-8 shadow-lg transition-shadow ${armed ? "shadow-[0_0_0_4px_var(--paper-yellow)]" : ""}`}
    >
      <span
        className="absolute left-1/2 top-[-12px] h-7 w-28 -translate-x-1/2 rounded-lg bg-clipboard-clip shadow-[inset_0_2px_0_rgba(255,255,255,0.25),0_3px_4px_rgba(0,0,0,0.3)]"
        aria-hidden
      />
      <div className="flex flex-col gap-3 overflow-visible rounded bg-clipboard-paper p-4 text-ink">
        <h2 className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-ink-soft">
          Working on <span>{notes.length}/{MAX_FOCUS}</span>
        </h2>

        {notes.length === 0 && (
          <p className={`py-6 text-center font-hand text-xl ${armed ? "text-ink" : "text-ink-soft"}`}>
            {armed ? "Drop it here to start" : "Drag a note here to start on it."}
          </p>
        )}

        {[...notes].reverse().map((n) => {
          const live = !!n.startedAt;
          const elapsed = n.spentMs + (live ? now - n.startedAt! : 0);
          const left = n.estMinutes * 60_000 - elapsed;
          const carried = !!n.carriedFrom;
          return (
            <motion.div
              key={n.id}
              ref={(el) => {
                if (!el) return;
                slips.current.set(n.id, el);
                return () => {
                  slips.current.delete(n.id);
                };
              }}
              drag
              dragMomentum={false}
              dragSnapToOrigin
              onDragStart={onDragStart}
              onDrag={(_e, info) => {
                const el = slips.current.get(n.id);
                if (el) onDragMove(...centreOf(el), [info.point.x - window.scrollX, info.point.y - window.scrollY]);
              }}
              onDragEnd={() => onDragEnd(n.id)}
              whileDrag={{ scale: 1.05, zIndex: 50 }}
              className={`sticky-note relative cursor-grab p-3 text-ink active:cursor-grabbing transition-opacity ${live ? "" : "opacity-70"}`}
              style={{
                backgroundColor: paperVar(n.color),
                ["--paper" as string]: paperVar(n.color),
                rotate: live ? "-1.5deg" : "1deg",
                filter: carried ? "saturate(0.55)" : undefined,
              }}
            >
              {carried && (
                <span
                  className="pointer-events-none absolute left-2 top-1.5 text-[9px] font-semibold tracking-wide text-ink-soft/80"
                  aria-hidden
                >
                  from {weekdayShort(n.carriedFrom!)}
                </span>
              )}
              <div className={`relative font-hand text-xl font-semibold leading-tight ${carried ? "mt-3" : ""}`}>{n.title}</div>
              <div className="relative mt-2 flex items-baseline justify-between">
                {/* A running clock reads a second or two later on the client than on the server. */}
                <span className="text-2xl font-bold tabular-nums leading-none" suppressHydrationWarning>{fmt(elapsed)}</span>
                <span className={`text-[11px] ${left < 0 ? "text-danger" : "text-ink-soft"}`} suppressHydrationWarning>
                  {live ? (left >= 0 ? `${fmt(left)} left` : `${fmt(-left)} over`) : "paused"}
                </span>
              </div>
              <div className="relative mt-2 flex gap-1.5">
                {!live && (
                  <button onClick={() => onResume(n.id)} className="h-9 flex-1 rounded-lg border border-ink text-xs font-bold">
                    Resume
                  </button>
                )}
                <button onClick={() => onDone(n.id)} className="h-9 flex-1 rounded-lg bg-ink text-xs font-bold text-on-ink">
                  Done
                </button>
                <button
                  onClick={() => onPutBack(n.id)}
                  aria-label="Put back on the board"
                  className="h-9 w-9 rounded-lg border border-clipboard-line text-xs font-bold"
                >
                  ↩
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
