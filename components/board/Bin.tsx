"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Note } from "@/lib/core/types";

type Props = {
  notes: Note[]; // status === "trashed"
  armed: boolean;
  onRestore: (id: string) => void;
  onEmpty: () => void;
};

export function Bin({ notes, armed, onRestore, onEmpty }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        data-drop="bin"
        onClick={() => setOpen(true)}
        aria-label={`Open the bin, ${notes.length} trashed`}
        animate={
          armed
            ? { rotate: [-8, 8, -8], scale: 1.12 }
            : { rotate: 0, scale: 1 }
        }
        transition={
          armed
            ? { rotate: { repeat: Infinity, duration: 0.35, ease: "easeInOut" }, scale: { duration: 0.15 } }
            : { type: "spring", stiffness: 300, damping: 20 }
        }
        whileHover={armed ? undefined : { scale: 1.06, rotate: -3 }}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-4 right-4 z-30 h-16 w-14 md:bottom-6 md:right-6 md:h-28 md:w-24 drop-shadow-[0_12px_14px_rgba(0,0,0,0.35)]"
      >
        <svg viewBox="0 0 96 112" className="h-full w-full" aria-hidden>
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
          <path d="M14 30 L82 30 L74 106 Q48 112 22 106 Z" fill="var(--bin-body)" />
          <path d="M14 30 L82 30 L74 106 Q48 112 22 106 Z" fill="url(#binShade)" />
          {[26, 36, 46, 56, 66].map((x) => (
            <line key={x} x1={x} y1="34" x2={x - 3} y2="104" stroke="rgba(0,0,0,0.22)" strokeWidth="2" />
          ))}
          <ellipse cx="48" cy="30" rx="36" ry="7" fill="var(--bin-rim)" />
          <ellipse cx="48" cy="30" rx="30" ry="4.5" fill="var(--bin-inside)" />
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col gap-4 bg-surface p-6 shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <header className="flex items-start justify-between">
                <div>
                  <h2 className="font-hand text-4xl font-bold">Trash</h2>
                  <p className="text-sm text-fg-soft">{notes.length} trashed</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="h-11 w-11 rounded-full border border-frame"
                >
                  ✕
                </button>
              </header>

              <ul className="flex flex-col gap-2">
                {notes.map((n) => (
                  <li key={n.id} className="flex items-center gap-3 rounded-xl bg-bg p-3">
                    <span
                      className="h-9 w-9 shrink-0 rotate-[-6deg] rounded-sm shadow"
                      style={{ backgroundColor: `var(--paper-${n.color})` }}
                    />
                    <span className="flex-1 text-sm font-semibold line-through text-fg-soft">{n.title}</span>
                    <button
                      onClick={() => onRestore(n.id)}
                      className="h-9 shrink-0 rounded-lg border border-frame px-3 text-xs font-bold"
                    >
                      Restore
                    </button>
                  </li>
                ))}
                {notes.length === 0 && (
                  <li className="py-8 text-center font-hand text-2xl text-fg-soft">Nothing in here yet.</li>
                )}
              </ul>

              {notes.length > 0 && (
                <button
                  onClick={() => {
                    onEmpty();
                    setOpen(false);
                  }}
                  className="mt-auto h-11 self-start rounded-xl border border-danger px-5 text-sm font-semibold text-danger"
                >
                  Empty bin
                </button>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
