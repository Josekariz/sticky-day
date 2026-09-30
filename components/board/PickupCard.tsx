"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { paperVar, type Energy, type Note } from "@/lib/core/types";

type Props = {
  note: Note | null;
  onClose: () => void;
  onWorkOn: (id: string) => void;
  onDone: (id: string) => void;
  onTearUp: (id: string) => void;
  onEdit: (id: string, patch: Partial<Pick<Note, "title" | "detail" | "estMinutes" | "energy">>) => void;
};

const ENERGY: Energy[] = ["low", "medium", "high"];

export function PickupCard({ note, onClose, onWorkOn, onDone, onTearUp, onEdit }: Props) {
  const [confirmTear, setConfirmTear] = useState(false);

  function close() {
    setConfirmTear(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {note && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          tabIndex={-1}
          onKeyDown={(e) => e.key === "Escape" && close()}
        >
          <motion.div
            role="dialog"
            aria-labelledby="pickup-title"
            onClick={(e) => e.stopPropagation()}
            className="sticky-note relative flex w-full max-w-md flex-col gap-5 p-7 pb-6 text-ink"
            style={{ backgroundColor: paperVar(note.color), ["--paper" as string]: paperVar(note.color) }}
            initial={{ scale: 0.5, rotate: note.rotation, opacity: 0 }}
            animate={{ scale: 1, rotate: 0.6, opacity: 1 }}
            exit={{ scale: 0.5, rotate: note.rotation, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-black/10 hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>

            <label className="relative flex flex-col gap-1 pr-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">Task</span>
              <input
                id="pickup-title"
                defaultValue={note.title}
                onBlur={(e) => e.target.value.trim() && e.target.value !== note.title && onEdit(note.id, { title: e.target.value.trim() })}
                className="w-full bg-transparent font-hand text-4xl font-bold leading-none outline-none border-b-2 border-transparent focus:border-black/30"
              />
            </label>

            <label className="relative flex flex-col gap-1">
              <span className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-ink-soft">
                Notes
                <button
                  type="button"
                  disabled
                  title="Dictation coming soon"
                  aria-label="Dictate notes (coming soon)"
                  className="grid h-8 w-8 place-items-center rounded-full opacity-40"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M12 17v4" /></svg>
                </button>
              </span>
              <textarea
                defaultValue={note.detail}
                rows={3}
                placeholder="Anything worth remembering about this one…"
                onBlur={(e) => e.target.value !== note.detail && onEdit(note.id, { detail: e.target.value })}
                className="w-full resize-none rounded-lg bg-black/5 px-3 py-2 text-[15px] leading-relaxed outline-none placeholder:text-ink-soft focus:bg-black/10"
              />
            </label>

            <div className="relative flex items-end gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">Estimate</span>
                <div className="flex items-center rounded-lg bg-black/5">
                  <button aria-label="Less time" onClick={() => onEdit(note.id, { estMinutes: Math.max(5, note.estMinutes - 5) })} className="h-10 w-10 text-lg font-bold">−</button>
                  <span className="w-16 text-center text-sm font-bold tabular-nums">{note.estMinutes} min</span>
                  <button aria-label="More time" onClick={() => onEdit(note.id, { estMinutes: note.estMinutes + 5 })} className="h-10 w-10 text-lg font-bold">+</button>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">Energy</span>
                <div className="flex rounded-lg bg-black/5 p-0.5">
                  {ENERGY.map((e) => (
                    <button
                      key={e}
                      onClick={() => onEdit(note.id, { energy: e })}
                      aria-pressed={note.energy === e}
                      className={`h-9 flex-1 rounded-md text-xs font-bold capitalize ${note.energy === e ? "bg-ink text-on-ink" : "text-ink-soft"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative mt-1 flex gap-2">
              <button onClick={() => onWorkOn(note.id)} className="h-12 flex-1 rounded-xl border-2 border-ink text-sm font-bold">
                Work on it
              </button>
              <button onClick={() => onDone(note.id)} className="h-12 flex-1 rounded-xl bg-ink text-sm font-bold text-on-ink">
                Done ✓
              </button>
            </div>

            <div className="relative flex h-6 items-center text-xs font-semibold text-ink-soft">
              {confirmTear ? (
                <span className="flex items-center gap-3">
                  Tear it up?
                  <button onClick={() => onTearUp(note.id)} className="underline underline-offset-2 text-ink">Yes, it's gone</button>
                  <button onClick={() => setConfirmTear(false)} className="underline underline-offset-2">Keep it</button>
                </span>
              ) : (
                <button onClick={() => setConfirmTear(true)} className="underline underline-offset-2 hover:text-ink">
                  Tear up this note
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}