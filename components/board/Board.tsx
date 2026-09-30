"use client";

import { useRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { Note } from "@/lib/core/types";
import type { DropTarget } from "./useDropTargets";
import { StickyNote } from "./StickyNote";
import { DockedTargets } from "./DockedTargets";

type Props = {
  notes: Note[];
  dragging: boolean;
  over: DropTarget; // what the dragged note is over
  onMove: (id: string, x: number, y: number) => void;
  onOpen: (id: string) => void;
  onDone: (id: string) => void;
  onTrash: (id: string) => void;
  onDragStart: () => void;
  onDragMove: (px: number, py: number) => void;
  onDragEnd: (id: string) => boolean;
};

export function Board({
  notes,
  dragging,
  over,
  onMove,
  onOpen,
  onDone,
  onTrash,
  onDragStart,
  onDragMove,
  onDragEnd,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={boardRef}
      data-drop="board"
      className={`relative flex-1 min-h-[60vh] rounded-2xl border-4 border-frame md:min-h-[520px] md:border-[6px] bg-board ${dragging ? "overflow-visible z-20" : "overflow-hidden"}`}
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
            over={over}
            onMove={onMove}
            onOpen={onOpen}
            onDone={onDone}
            onTrash={onTrash}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
        ))}
      </AnimatePresence>
      <DockedTargets show={dragging} over={over} />
    </div>
  );
}
