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
  /** Phone: grow the board when the clipboard column is tucked away. */
  roomy?: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onOpen: (id: string) => void;
  onDone: (id: string) => void;
  onTrash: (id: string) => void;
  onDragStart: () => void;
  onDragMove: (px: number, py: number, pointer?: [number, number]) => void;
  onDragEnd: (id: string) => boolean;
};

export function Board({
  notes,
  dragging,
  over,
  roomy = false,
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
      className={`relative flex-1 rounded-2xl border-4 border-frame md:border-[6px] bg-board ${
        roomy ? "min-h-[72vh] md:min-h-[520px]" : "min-h-[60vh] md:min-h-[520px]"
      } ${dragging ? "overflow-visible z-20" : "overflow-hidden"}`}
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
      <DockedTargets show={dragging} over={over} board={boardRef} />
    </div>
  );
}
