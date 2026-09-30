"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { paperVar, type Note } from "@/lib/core/types";

export const TRAY_MESH = {
  backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.28) 1px, transparent 1.4px)",
  backgroundSize: "5px 5px",
};

type Props = {
  notes: Note[]; // status === "done", oldest first
  armed: boolean; // a note is being dragged over me
  onPutBack: (id: string) => void;
};

export function DoneTray({ notes, armed, onPutBack }: Props) {
  const [open, setOpen] = useState(false);
  const stack = notes.slice(-6); // never draw more than six sheets
  const worked = notes.reduce((s, n) => s + (n.actualMinutes ?? 0), 0);

  return (
    <>
      <motion.button
        type="button"
        data-drop="tray"
        onClick={() => setOpen(true)}
        aria-label={`Done tray, ${notes.length} finished. Open the day's record.`}
        animate={{ scale: armed ? 1.04 : 1, y: armed ? -4 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative h-32 w-full text-left"
      >
        {/* back wall of the tray */}
        <div
          className="absolute inset-x-3 top-4 h-16 rounded-t-lg bg-tray-back"
          style={TRAY_MESH}
        />

        {/* the stacked sheets, oldest at the bottom */}
        <div className="absolute inset-x-5 bottom-11 h-20">
          {stack.map((n, i) => (
            <div
              key={n.id}
              className="absolute inset-x-0 flex h-14 items-start rounded-sm px-2 pt-1 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
              style={{
                backgroundColor: paperVar(n.color),
                bottom: i * 6,
                left: (i % 2 ? 3 : -3),
                right: (i % 2 ? -3 : 3),
                rotate: `${((i % 3) - 1) * 2}deg`,
                zIndex: i,
              }}
            >
              <span className="truncate font-hand text-sm font-semibold leading-none text-ink/80">{n.title}</span>
            </div>
          ))}
        </div>

        {/* front lip, sits over the sheets */}
        <div
          className={`absolute inset-x-2 bottom-4 flex h-12 items-end justify-between rounded-b-lg rounded-t-sm border-t-2 px-3 pb-2 shadow-lg transition-colors ${
            armed ? "border-paper-yellow bg-tray-front-armed" : "border-tray-line bg-tray-front"
          }`}
          style={{ zIndex: 10, ...TRAY_MESH }}
        >
          <span className="text-[11px] font-bold uppercase tracking-widest text-on-tray">
            {armed ? "Drop to finish" : "Done"}
          </span>
          <span className="rounded-full bg-on-tray px-2 py-0.5 text-xs font-bold tabular-nums text-tray-front">
            {notes.length}
          </span>
        </div>

        {/* tray feet */}
        <div className="absolute bottom-2 left-6 h-2 w-4 rounded-b bg-tray-line" />
        <div className="absolute bottom-2 right-6 h-2 w-4 rounded-b bg-tray-line" />
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
                  <h2 className="font-hand text-4xl font-bold">Today’s record</h2>
                  <p className="text-sm text-fg-soft">
                    {notes.length} done · {worked} min worked
                  </p>
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
                {notes.map((n) => {
                  const diff = (n.actualMinutes ?? 0) - n.estMinutes;
                  return (
                    <li key={n.id} className="flex items-center gap-3 rounded-xl bg-bg p-3">
                      <span
                        className="h-9 w-9 shrink-0 rotate-[-6deg] rounded-sm shadow"
                        style={{ backgroundColor: `var(--paper-${n.color})` }}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-sm font-semibold line-through text-fg-soft">{n.title}</span>
                        <span className="block text-xs text-fg-soft">
                          est. {n.estMinutes} · took {n.actualMinutes}
                          {diff !== 0 && (
                            <span className={`ml-1 font-bold tabular-nums ${diff > 0 ? "text-danger" : "text-done"}`}>
                              ({diff > 0 ? `+${diff}` : diff} min)
                            </span>
                          )}
                        </span>
                      </span>
                      <button
                        onClick={() => onPutBack(n.id)}
                        className="h-9 shrink-0 rounded-lg border border-frame px-3 text-xs font-bold"
                      >
                        Put back
                      </button>
                    </li>
                  );
                })}
                {notes.length === 0 && (
                  <li className="py-8 text-center font-hand text-2xl text-fg-soft">Nothing finished yet.</li>
                )}
              </ul>

              <p className="mt-auto text-xs text-fg-soft">The recap and carry-over land here once the AI is wired.</p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
