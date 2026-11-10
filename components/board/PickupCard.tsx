"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  NOTE_SHAPES,
  PAPER_COLORS,
  paperVar,
  type Note,
  type NoteShape,
  type PaperColor,
  type Priority,
} from "@/lib/core/types";
import { SHAPE_LABELS, ShapeSwatch } from "./ShapeSwatch";
import { TomorrowActionIcon } from "./TomorrowMark";

type LookOpen = "shape" | "color" | null;

type Props = {
  note: Note | null;
  /** Signed-in today: the note can be queued for a fresh copy tomorrow. */
  canQueue: boolean;
  onClose: () => void;
  onWorkOn: (id: string) => void;
  onDone: (id: string) => void;
  onTrash: (id: string) => void;
  onEdit: (id: string, patch: Partial<Pick<Note, "title" | "detail" | "estMinutes" | "priority" | "shape" | "color" | "againTomorrow">>) => void;
};

const PRIORITY: Priority[] = ["low", "medium", "high"];

function colorLabel(color: PaperColor) {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={`shrink-0 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function LookTrigger({
  open,
  label,
  controls,
  onClick,
  preview,
  value,
}: {
  open: boolean;
  label: string;
  controls: string;
  onClick: () => void;
  preview: ReactNode;
  value: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={onClick}
      className={`flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 text-left md:h-10 ${
        open ? "bg-black/10" : "bg-black/5 hover:bg-black/10"
      }`}
    >
      <span className="grid shrink-0 place-items-center">{preview}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-ink-soft">{label}</span>
        <span className="block truncate text-xs font-bold leading-tight">{value}</span>
      </span>
      <Chevron open={open} />
    </button>
  );
}

export function PickupCard({ note, canQueue, onClose, onWorkOn, onDone, onTrash, onEdit }: Props) {
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [lookOpen, setLookOpen] = useState<LookOpen>(null);
  const shapePanelId = useId();
  const colorPanelId = useId();

  useEffect(() => {
    setLookOpen(null);
    setConfirmTrash(false);
  }, [note?.id]);

  function close() {
    setConfirmTrash(false);
    setLookOpen(null);
    onClose();
  }

  function toggleLook(which: Exclude<LookOpen, null>) {
    setLookOpen((cur) => (cur === which ? null : which));
  }

  function pickShape(shape: NoteShape) {
    if (!note || note.shape === shape) {
      setLookOpen(null);
      return;
    }
    onEdit(note.id, { shape });
    setLookOpen(null);
  }

  function pickColor(color: PaperColor) {
    if (!note || note.color === color) {
      setLookOpen(null);
      return;
    }
    onEdit(note.id, { color });
    setLookOpen(null);
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
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            if (lookOpen) {
              e.stopPropagation();
              setLookOpen(null);
              return;
            }
            close();
          }}
        >
          <motion.div
            role="dialog"
            aria-labelledby="pickup-title"
            onClick={(e) => e.stopPropagation()}
            className="sticky-note relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-5 overflow-y-auto p-7 pb-6 text-ink"
            style={{ backgroundColor: paperVar(note.color), ["--paper" as string]: paperVar(note.color) }}
            initial={{ scale: 0.5, rotate: note.rotation, opacity: 0 }}
            animate={{ scale: 1, rotate: 0.6, opacity: 1 }}
            exit={{ scale: 0.5, rotate: note.rotation, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-black/10 hover:text-ink md:h-10 md:w-10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>

            <label className="relative flex flex-col gap-1 pr-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">Task</span>
              <textarea
                id="pickup-title"
                defaultValue={note.title}
                rows={2}
                onBlur={(e) => e.target.value.trim() && e.target.value !== note.title && onEdit(note.id, { title: e.target.value.trim() })}
                className="w-full resize-none bg-transparent font-hand text-3xl font-bold leading-tight outline-none border-b-2 border-transparent focus:border-black/30 md:text-4xl"
              />
            </label>

            <label className="relative flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">Notes</span>
              <textarea
                defaultValue={note.detail}
                rows={3}
                autoFocus={note.status === "focus"}
                placeholder="Anything worth remembering about this one…"
                onBlur={(e) => e.target.value !== note.detail && onEdit(note.id, { detail: e.target.value })}
                className="w-full resize-none rounded-lg bg-black/5 px-3 py-2 text-[15px] leading-relaxed outline-none placeholder:text-ink-soft focus:bg-black/10"
              />
            </label>

            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">Estimate</span>
                <div className="flex items-center rounded-lg bg-black/5">
                  <button aria-label="Less time" onClick={() => onEdit(note.id, { estMinutes: Math.max(5, note.estMinutes - 5) })} className="h-11 w-11 text-lg font-bold md:h-10 md:w-10">−</button>
                  <span className="w-16 text-center text-sm font-bold tabular-nums">{note.estMinutes} min</span>
                  <button aria-label="More time" onClick={() => onEdit(note.id, { estMinutes: note.estMinutes + 5 })} className="h-11 w-11 text-lg font-bold md:h-10 md:w-10">+</button>
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
                      className={`h-11 min-w-11 flex-1 rounded-md text-xs font-bold capitalize md:h-9 md:min-w-0 ${note.priority === p ? "bg-ink text-on-ink" : "text-ink-soft"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative flex flex-col gap-2">
              <div className="flex gap-2">
                <LookTrigger
                  open={lookOpen === "shape"}
                  label="Shape"
                  controls={shapePanelId}
                  onClick={() => toggleLook("shape")}
                  preview={<ShapeSwatch shape={note.shape} color={note.color} size={22} />}
                  value={SHAPE_LABELS[note.shape]}
                />
                <LookTrigger
                  open={lookOpen === "color"}
                  label="Color"
                  controls={colorPanelId}
                  onClick={() => toggleLook("color")}
                  preview={
                    <span
                      aria-hidden
                      className="block h-[22px] w-[22px] rounded-full ring-1 ring-black/15"
                      style={{ backgroundColor: paperVar(note.color) }}
                    />
                  }
                  value={colorLabel(note.color)}
                />
              </div>

              <AnimatePresence initial={false}>
                {lookOpen === "shape" && (
                  <motion.div
                    key="shape"
                    id={shapePanelId}
                    role="radiogroup"
                    aria-label="Note shape"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center gap-1 rounded-lg bg-black/5 p-1.5">
                      {NOTE_SHAPES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          role="radio"
                          aria-checked={note.shape === s}
                          aria-label={SHAPE_LABELS[s]}
                          title={SHAPE_LABELS[s]}
                          onClick={() => pickShape(s)}
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg md:h-10 md:w-10 ${
                            note.shape === s ? "bg-black/10" : "hover:bg-black/5"
                          }`}
                        >
                          <ShapeSwatch shape={s} color={note.color} size={24} outline strong={note.shape === s} />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {lookOpen === "color" && (
                  <motion.div
                    key="color"
                    id={colorPanelId}
                    role="radiogroup"
                    aria-label="Note color"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-6 gap-1 rounded-lg bg-black/5 p-1.5">
                      {PAPER_COLORS.map((c) => {
                        const selected = note.color === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={colorLabel(c)}
                            title={colorLabel(c)}
                            onClick={() => pickColor(c)}
                            className={`grid h-11 place-items-center rounded-lg md:h-10 ${
                              selected ? "bg-black/10 ring-2 ring-ink" : "hover:bg-black/5"
                            }`}
                          >
                            <span
                              aria-hidden
                              className="block h-6 w-6 rounded-full ring-1 ring-black/15"
                              style={{ backgroundColor: paperVar(c) }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative mt-1 flex gap-2">
              {note.status !== "focus" && (
                <button onClick={() => onWorkOn(note.id)} className="h-12 flex-1 rounded-xl border-2 border-ink text-sm font-bold">
                  Work on it
                </button>
              )}
              <button onClick={() => onDone(note.id)} className="h-12 flex-1 rounded-xl bg-ink text-sm font-bold text-on-ink">
                Task complete
              </button>
            </div>

            <div className="relative flex min-h-6 items-center justify-between gap-3 text-xs font-semibold text-ink-soft">
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
              {canQueue && (
                <button
                  type="button"
                  aria-pressed={note.againTomorrow}
                  onClick={() => onEdit(note.id, { againTomorrow: !note.againTomorrow })}
                  className={`inline-flex items-center gap-1 underline underline-offset-2 ${note.againTomorrow ? "text-ink" : "hover:text-ink"}`}
                >
                  <TomorrowActionIcon on={note.againTomorrow} />
                  {note.againTomorrow ? "On for tomorrow" : "Do this tomorrow"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
