"use client";

import { useRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { Note } from "@/lib/core/types";
import { StickyNote } from "./StickyNote";

type Props = {
  notes: Note[];
  dragging: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onOpen: (id: string) => void;
  onDone: (id: string) => void;
  onDragStart: () => void;
  onDragMove: (px: number, py: number) => void;
  onDragEnd: (id: string) => boolean;
};

export function Board({
  notes,
  dragging,
  onMove,
  onOpen,
  onDone,
  onDragStart,
  onDragMove,
  onDragEnd,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={boardRef}
      data-drop="board"
      className={`relative flex-1 min-h-[520px] rounded-2xl border-[6px] border-frame bg-board ${dragging ? "overflow-visible z-20" : "overflow-hidden"}`}
    >
      {notes.length === 0 && (
        <p className="absolute inset-0 grid place-items-center font-hand text-3xl text-fg-soft">
          Empty board. Type your day above.
        </p>
      )}
      <AnimatePresence>
        {notes.map((n) => (
          <StickyNote
            key={n.id}
            note={n}
            board={boardRef}
            onMove={onMove}
            onOpen={onOpen}
            onDone={onDone}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
