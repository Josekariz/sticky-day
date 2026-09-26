"use client";

import { motion, useMotionValue } from "framer-motion";
import { useRef, type RefObject } from "react";
import { paperVar, type Note } from "@/lib/core/types";

export const NOTE_SIZE = 176; // must match w-44 h-44

type Props = {
  note: Note;
  board: RefObject<HTMLDivElement | null>;
  onMove: (id: string, x: number, y: number) => void; // fractions 0..1
  onOpen: (id: string) => void;
  onDone: (id: string) => void;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function StickyNote({ note, board, onMove, onOpen, onDone }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const paper = paperVar(note.color);
  // A drag ends with pointerup on the note, which the browser turns into a click.
  // Remember that this gesture was a drag so the click doesn't open the note.
  const dragged = useRef(false);

  function handleDragEnd() {
    const el = board.current;
    if (!el) return;
    const usableW = el.clientWidth - NOTE_SIZE;
    const usableH = el.clientHeight - NOTE_SIZE;
    const nx = clamp01(note.x + x.get() / usableW);
    const ny = clamp01(note.y + y.get() / usableH);
    x.set(0);
    y.set(0);
    onMove(note.id, nx, ny);
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{
        left: `calc(${note.x} * (100% - ${NOTE_SIZE}px))`,
        top: `calc(${note.y} * (100% - ${NOTE_SIZE}px))`,
        x,
        y,
        rotate: note.rotation,
        backgroundColor: paper,
        ["--paper" as string]: paper,
      }}
      onPointerDown={() => { dragged.current = false; }}
      onDragStart={() => { dragged.current = true; }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.6, rotate: note.rotation + 12, opacity: 0 }}
      animate={{ scale: 1, rotate: note.rotation, opacity: 1 }}
      exit={{ scale: 0.15, rotate: note.rotation + 40, opacity: 0, transition: { duration: 0.35 } }}
      whileHover={{ scale: 1.04, rotate: 0, translateY: -4 }}
      whileDrag={{ scale: 1.08, rotate: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className="sticky-note group absolute w-44 h-44 text-ink cursor-grab active:cursor-grabbing"
    >
      {/* the note face: tap to open */}
      <button
        type="button"
        onClick={() => {
          if (dragged.current) { dragged.current = false; return; }
          onOpen(note.id);
        }}
        className="relative flex h-full w-full flex-col p-4 pb-3 text-left"
      >
        <span className="pr-7 font-hand text-2xl font-semibold leading-tight line-clamp-3">{note.title}</span>
        <span className="mt-auto flex items-center gap-1.5 pr-8 text-[11px] font-semibold text-ink-soft">
          <span className="px-2 py-0.5 rounded-full bg-black/10 tabular-nums">{note.estMinutes} min</span>
          <span className="px-2 py-0.5 rounded-full bg-black/10 capitalize">{note.energy}</span>
        </span>
      </button>

      {/* done: appears on hover / focus */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDone(note.id); }}
        aria-label={`Mark "${note.title}" done`}
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/15 opacity-0 transition-opacity hover:bg-black/30 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </button>
    </motion.div>
  );
}
