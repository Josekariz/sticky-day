"use client";

import { useRef, useState } from "react";
import type { Note } from "@/lib/core/types";
import { StickyNote } from "./StickyNote";

export function Board({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const boardRef = useRef<HTMLDivElement>(null);

  function moveNote(id: string, x: number, y: number) {
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, x, y } : n)));
    console.log("moved", id, x.toFixed(3), y.toFixed(3));
  }

  function openNote(id: string) {
    console.log("open", id);
  }

  return (
    <div
      ref={boardRef}
      className="relative flex-1 min-h-[520px] rounded-2xl border-[6px] border-frame bg-board overflow-hidden"
    >
      {notes
        .filter((n) => n.status === "board")
        .map((n) => (
          <StickyNote key={n.id} note={n} board={boardRef} onMove={moveNote} onOpen={openNote} />
        ))}
    </div>
  );
}