"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Note } from "@/lib/core/types";

export function Bin({ notes }: { notes: Note[] }) {
  const [open, setOpen] = useState(false);
  const worked = notes.reduce((s, n) => s + (n.actualMinutes ?? 0), 0);

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        aria-label={`Open the bin, ${notes.length} done`}
        whileHover={{ scale: 1.06, rotate: -3 }}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-6 right-6 z-30 h-28 w-24 drop-shadow-[0_12px_14px_rgba(0,0,0,0.35)]"
      >
        <svg viewBox="0 0 96 112" className="h-full w-full" aria-hidden>
          {/* crumpled paper inside, shown once there is something to show */}
          {notes.slice(0, 3).map((n, i) => (
            <circle
              key={n.id}
              cx={[34, 58, 46][i]}
              cy={[30, 26, 22][i]}
              r={[11, 10, 12][i]}
              fill={`var(--paper-${n.color})`}
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="1.5"
            />
          ))}
          {/* body */}
          <path d="M14 30 L82 30 L74 106 Q48 112 22 106 Z" fill="#6E6A62" />
          <path d="M14 30 L82 30 L74 106 Q48 112 22 106 Z" fill="url(#binShade)" />
          {/* ribs */}
          {[26, 36, 46, 56, 66].map((x) => (
            <line key={x} x1={x} y1="34" x2={x - 3} y2="104" stroke="rgba(0,0,0,0.22)" strokeWidth="2" />
          ))}
          {/* rim */}
          <ellipse cx="48" cy="30" rx="36" ry="7" fill="#8A857C" />
          <ellipse cx="48" cy="30" rx="30" ry="4.5" fill="#3E3B35" />
          <defs>
            <linearGradient id="binShade" x1="0" x2="1">
              <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="0.5" stopColor="rgba(255,255,255,0)" />
              <stop offset="1" stopColor="rgba(0,0,0,0.28)" />
            </linearGradient>
          </defs>
        </svg>
        {notes.length > 0 && (
          <span className="absolute -right-1 -top-1 grid h-7 min-w-7 place-items-center rounded-full bg-danger px-2 text-xs font-bold text-white">
            {notes.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col gap-4 bg-surface p-6 shadow-2xl"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <header className="flex items-start justify-between">
                <div>
                  <h2 className="font-hand text-4xl font-bold">Today’s bin</h2>
                  <p className="text-sm text-fg-soft">{notes.length} done · {worked} min worked</p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="h-11 w-11 rounded-full border border-frame">✕</button>
              </header>

              <ul className="flex flex-col gap-2">
                {notes.map((n) => {
                  const diff = (n.actualMinutes ?? 0) - n.estMinutes;
                  return (
                    <li key={n.id} className="flex items-center gap-3 rounded-xl bg-bg p-3">
                      <span className="h-9 w-9 shrink-0 rotate-[-6deg] rounded-sm shadow" style={{ backgroundColor: `var(--paper-${n.color})` }} />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold line-through text-fg-soft">{n.title}</span>
                        <span className="block text-xs text-fg-soft">est. {n.estMinutes} · took {n.actualMinutes}</span>
                      </span>
                      <span className={`text-sm font-bold tabular-nums ${diff > 0 ? "text-danger" : "text-[#2E7D4F]"}`}>
                        {diff > 0 ? `+${diff}` : diff} min
                      </span>
                    </li>
                  );
                })}
                {notes.length === 0 && <li className="py-8 text-center font-hand text-2xl text-fg-soft">Nothing in here yet.</li>}
              </ul>

              <p className="mt-auto text-xs text-fg-soft">The recap and carry-over land here once the AI is wired.</p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}