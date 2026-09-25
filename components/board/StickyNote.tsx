"use client";

import { motion, useMotionValue } from "framer-motion";
import type { RefObject } from "react";
import { paperVar, type Note } from "@/lib/core/types";

export const NOTE_SIZE = 176; // must match w-44 h-44

type Props = {
  note: Note;
  board: RefObject<HTMLDivElement | null>;
  onMove: (id: string, x: number, y: number) => void; // fractions 0..1
  onOpen: (id: string) => void;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function StickyNote({ note, board, onMove, onOpen }: Props) {
  const x = useMotionValue(0); // drag offset only
  const y = useMotionValue(0);
  const paper = paperVar(note.color);

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
    <motion.button
      type="button"
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
      onDragEnd={handleDragEnd}
      onTap={() => onOpen(note.id)}
      initial={{ scale: 0.6, rotate: note.rotation + 12, opacity: 0 }}
      animate={{ scale: 1, rotate: note.rotation, opacity: 1 }}
      whileHover={{ scale: 1.04, rotate: 0, translateY: -4 }}
      whileDrag={{ scale: 1.08, rotate: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className="sticky-note absolute w-44 h-44 p-4 pb-3 flex flex-col text-left text-ink cursor-grab active:cursor-grabbing"
    >
      <span className="relative font-hand text-2xl font-semibold leading-tight line-clamp-3">
        {note.title}
      </span>

      <span className="relative mt-auto flex items-center gap-1.5 pr-8 text-[11px] font-semibold text-ink-soft">
        <span className="px-2 py-0.5 rounded-full bg-black/10 tabular-nums">{note.estMinutes} min</span>
        <span className="px-2 py-0.5 rounded-full bg-black/10 capitalize">{note.energy}</span>
      </span>
    </motion.button>
  );
} 