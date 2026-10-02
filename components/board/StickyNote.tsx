"use client";

import { motion, useMotionValue } from "framer-motion";
import { useRef, type RefObject } from "react";
import { paperVar, type Note } from "@/lib/core/types";
import { weekdayShort } from "@/lib/core/date";
import { centreOf, type DropTarget } from "./useDropTargets";

type Props = {
  note: Note;
  board: RefObject<HTMLDivElement | null>;
  over: DropTarget; // what the dragged note is over
  onMove: (id: string, x: number, y: number) => void; // fractions 0..1
  onOpen: (id: string) => void;
  onDone: (id: string) => void;
  onTrash: (id: string) => void;
  onDragStart: () => void;
  onDragMove: (px: number, py: number) => void;
  onDragEnd: (id: string) => boolean;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function StickyNote({
  note,
  board,
  over,
  onMove,
  onOpen,
  onDone,
  onTrash,
  onDragStart,
  onDragMove,
  onDragEnd,
}: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const paper = paperVar(note.color);
  const overTarget = over === "clipboard" || over === "tray" || over === "bin";
  // A drag ends with pointerup on the note, which the browser turns into a click.
  // Remember that this gesture was a drag so the click doesn't open the note.
  const dragged = useRef(false);
  const self = useRef<HTMLDivElement>(null);
  const carried = !!note.carriedFrom;

  function handleDragEnd() {
    const dx = x.get();
    const dy = y.get();
    x.set(0);
    y.set(0);
    if (onDragEnd(note.id)) return; // it left the board; don't save a position
    const el = board.current;
    const me = self.current;
    if (!el || !me) return;
    onMove(
      note.id,
      clamp01(note.x + dx / (el.clientWidth - me.offsetWidth)),
      clamp01(note.y + dy / (el.clientHeight - me.offsetHeight)),
    );
  }

  return (
    <motion.div
      ref={self}
      drag
      dragMomentum={false}
      style={{
        left: `calc(${note.x} * (100% - var(--note-size)))`,
        top: `calc(${note.y} * (100% - var(--note-size)))`,
        x,
        y,
        rotate: note.rotation,
        backgroundColor: paper,
        ["--paper" as string]: paper,
        filter: carried ? "saturate(0.55)" : undefined,
      }}
      onPointerDown={() => {
        dragged.current = false;
      }}
      onDragStart={() => {
        dragged.current = true;
        onDragStart();
      }}
      onDrag={() => {
        if (self.current) onDragMove(...centreOf(self.current));
      }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.6, rotate: note.rotation + 12, opacity: 0 }}
      animate={{ scale: 1, rotate: note.rotation, opacity: 1 }}
      exit={{ scale: 0.15, rotate: note.rotation + 40, opacity: 0, transition: { duration: 0.35 } }}
      whileHover={{ scale: 1.04, rotate: 0, translateY: -4 }}
      whileDrag={{ scale: overTarget ? 0.5 : 1.05, rotate: overTarget ? -12 : 0, zIndex: 50 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className="sticky-note group absolute size-(--note-size) touch-none select-none text-ink cursor-grab active:cursor-grabbing"
    >
      {/* the note face: tap to open */}
      <button
        type="button"
        onClick={() => {
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          onOpen(note.id);
        }}
        className="relative flex h-full w-full flex-col p-3 text-left md:p-4 md:pb-3"
      >
        {carried && (
          <span
            className="pointer-events-none absolute bottom-9 left-3 text-[9px] font-semibold tracking-wide text-ink-soft/80 md:bottom-10 md:left-4 md:text-[10px]"
            aria-hidden
          >
            from {weekdayShort(note.carriedFrom!)}
          </span>
        )}
        <span className="font-hand text-(length:--note-font) font-semibold leading-tight line-clamp-3 md:px-7">{note.title}</span>
        <span className="mt-auto flex items-center gap-1 pr-5 text-[10px] font-semibold text-ink-soft md:gap-1.5 md:pr-8 md:text-[11px]">
          <span className="px-1.5 py-0.5 rounded-full bg-black/10 tabular-nums md:px-2">{note.estMinutes} min</span>
          <span className="px-1.5 py-0.5 rounded-full bg-black/10 capitalize md:px-2">{note.energy}</span>
        </span>
      </button>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onTrash(note.id); }}
        aria-label={`Trash "${note.title}"`}
        className="absolute left-2 top-2 hidden h-8 w-8 md:grid place-items-center rounded-full bg-black/15 opacity-0 transition-opacity hover:bg-black/30 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" />
        </svg>
      </button>

      {/* done: appears on hover / focus */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDone(note.id);
        }}
        aria-label={`Mark "${note.title}" done`}
        className="absolute right-2 top-2 hidden h-8 w-8 md:grid place-items-center rounded-full bg-black/15 opacity-0 transition-opacity hover:bg-black/30 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </button>
    </motion.div>
  );
}
