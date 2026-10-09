"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NOTE_SHAPES, paperVar, type Priority, type Note } from "@/lib/core/types";
import { SHAPE_LABELS, ShapeSwatch } from "./ShapeSwatch";

type Props = {
  note: Note | null;
  onClose: () => void;
  onWorkOn: (id: string) => void;
  onDone: (id: string) => void;
  onTrash: (id: string) => void;
  onEdit: (id: string, patch: Partial<Pick<Note, "title" | "detail" | "estMinutes" | "priority" | "shape">>) => void;
};

const PRIORITY: Priority[] = ["low", "medium", "high"];

export function PickupCard({ note, onClose, onWorkOn, onDone, onTrash, onEdit }: Props) {
  const [confirmTrash, setConfirmTrash] = useState(false);

  function close() {
    setConfirmTrash(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {note && (
        <motion.div
          key={note.id}
          className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: "none" }}
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
              <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">Notes</span>
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
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">Priority</span>
                <div className="flex rounded-lg bg-black/5 p-0.5">
                  {PRIORITY.map((p) => (
                    <button
                      key={p}
                      onClick={() => onEdit(note.id, { priority: p })}
                      aria-pressed={note.priority === p}
                      className={`h-9 flex-1 rounded-md text-xs font-bold capitalize ${note.priority === p ? "bg-ink text-on-ink" : "text-ink-soft"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">Shape</span>
              <div role="radiogroup" aria-label="Note shape" className="flex items-center gap-1">
                {NOTE_SHAPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={note.shape === s}
                    aria-label={SHAPE_LABELS[s]}
                    title={SHAPE_LABELS[s]}
                    onClick={() => note.shape !== s && onEdit(note.id, { shape: s })}
                    className={`grid h-10 min-w-10 place-items-center rounded-lg px-1.5 ${note.shape === s ? "bg-black/10" : "hover:bg-black/5"}`}
                  >
                    <ShapeSwatch shape={s} color={note.color} size={24} outline strong={note.shape === s} />
                  </button>
                ))}
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
              {confirmTrash ? (
                <span className="flex items-center gap-3">
                  Trash it?
                  <button onClick={() => onTrash(note.id)} className="underline underline-offset-2 text-ink">Yes, trash it</button>
                  <button onClick={() => setConfirmTrash(false)} className="underline underline-offset-2">Keep it</button>
                </span>
              ) : (
                <button onClick={() => setConfirmTrash(true)} className="underline underline-offset-2 hover:text-ink">
                  Trash it
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
