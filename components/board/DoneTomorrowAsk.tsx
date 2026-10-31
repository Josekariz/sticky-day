"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { paperVar, type Note } from "@/lib/core/types";

type Props = {
  note: Note | null;
  onKeep: () => void;
  onClear: () => void;
  onLeave: () => void;
};

/** Done was clicked on a note already queued for tomorrow. */
export function DoneTomorrowAsk({ note, onKeep, onClear, onLeave }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const leave = useRef(onLeave);
  leave.current = onLeave;

  useEffect(() => {
    if (!note) return;
    panel.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") leave.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [note]);

  return (
    <AnimatePresence>
      {note && (
        <motion.div
          key={note.id}
          className="fixed inset-0 z-[60] grid place-items-center bg-black/35 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: "none" }}
          onClick={onLeave}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-labelledby="done-tomorrow-title"
            aria-describedby="done-tomorrow-body"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="sticky-note relative flex w-full max-w-sm flex-col gap-4 p-7 text-ink outline-none"
            style={{ backgroundColor: paperVar(note.color), ["--paper" as string]: paperVar(note.color) }}
            initial={{ scale: 0.5, rotate: note.rotation, opacity: 0 }}
            animate={{ scale: 1, rotate: 0.6, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <h2 id="done-tomorrow-title" className="relative font-hand text-4xl font-bold leading-none">
              Still tomorrow?
            </h2>
            <p id="done-tomorrow-body" className="relative leading-snug">
              <span className="font-semibold">{note.title}</span> is on for tomorrow. Mark it done and keep that, or mark it done and take tomorrow off.
            </p>
            <div className="relative flex flex-col gap-2">
              <button type="button" onClick={onKeep} className="h-12 rounded-xl bg-ink text-sm font-bold text-on-ink">
                Done, and tomorrow
              </button>
              <button type="button" onClick={onClear} className="h-12 rounded-xl border-2 border-ink text-sm font-bold">
                Done, not tomorrow
              </button>
            </div>
            <button
              type="button"
              onClick={onLeave}
              className="relative self-start text-xs font-semibold text-ink-soft underline underline-offset-2"
            >
              Leave it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
