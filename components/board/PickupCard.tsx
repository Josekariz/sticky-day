"use client";

import { AnimatePresence, motion } from "framer-motion";
import { paperVar, type Note } from "@/lib/core/types";

type Props = {
  note: Note | null;
  onClose: () => void;
  onWorkOn: (id: string) => void;
  onDone: (id: string) => void;
  onTearUp: (id: string) => void;
};

export function PickupCard({ note, onClose, onWorkOn, onDone, onTearUp }: Props) {
  return (
    <AnimatePresence>
      {note && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          tabIndex={-1}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
        >
          <motion.div
            role="dialog"
            aria-labelledby="pickup-title"
            onClick={(e) => e.stopPropagation()}
            className="sticky-note relative flex w-full max-w-md flex-col gap-4 p-8 text-ink"
            style={{
              backgroundColor: paperVar(note.color),
              ["--paper" as string]: paperVar(note.color),
            }}
            initial={{ scale: 0.5, rotate: note.rotation, opacity: 0 }}
            animate={{ scale: 1, rotate: 1, opacity: 1 }}
            exit={{ scale: 0.5, rotate: note.rotation, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">
                Picked up
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => onTearUp(note.id)}
                  aria-label="Tear up this note"
                  title="Tear up (delete)"
                  className="grid h-11 w-11 place-items-center rounded-full text-[#B23A22] opacity-50 hover:opacity-100 hover:bg-black/10"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M6 6l1 14h10l1-14" />
                  </svg>
                </button>
                <button
                  autoFocus
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-11 w-11 place-items-center rounded-full"
                >
                  ✕
                </button>
              </div>
            </div>

            <h2
              id="pickup-title"
              className="relative font-hand text-5xl font-bold leading-none"
            >
              {note.title}
            </h2>
            {note.detail && (
              <p className="relative text-base leading-relaxed">{note.detail}</p>
            )}

            <div className="relative flex flex-wrap gap-2 text-sm font-semibold">
              <span className="rounded-xl bg-black/10 px-3 py-1.5">
                {note.estMinutes} min
              </span>
              <span className="rounded-xl bg-black/10 px-3 py-1.5 capitalize">
                {note.energy} energy
              </span>
            </div>

            <div className="relative mt-4 flex gap-2">
              <button onClick={onClose} className="h-12 rounded-xl border border-black/30 px-4 text-sm font-semibold">Stick back</button>
              <button onClick={() => onWorkOn(note.id)} className="h-12 flex-1 rounded-xl border-2 border-[#1F1D1A] text-sm font-semibold">Work on it</button>
              <button onClick={() => onDone(note.id)} className="h-12 flex-1 rounded-xl bg-[#1F1D1A] text-sm font-semibold text-[#FBFAF6]">Done ✓</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
