"use client";

import { useState } from "react";
import type { Note } from "@/lib/core/types";
import { placeNote, randomColor, randomRotation } from "@/lib/core/placement";

export function useBoard(initial: Note[]) {
  const [notes, setNotes] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Note>) =>
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));

  const boardNotes = notes.filter((n) => n.status === "board");
  const focusNote = notes.find((n) => n.status === "focus") ?? null;
  const doneNotes = notes.filter((n) => n.status === "done");
  const openNote = notes.find((n) => n.id === openId) ?? null;

  return {
    boardNotes,
    focusNote,
    doneNotes,
    openNote,

    move(id: string, x: number, y: number) {
      // Day 2: also save to Supabase
      setNotes((ns) => {
        const n = ns.find((k) => k.id === id);
        if (!n) return ns;
        return [...ns.filter((k) => k.id !== id), { ...n, x, y }]; // last = on top
      });
    },
    open: (id: string) => setOpenId(id),
    close: () => setOpenId(null),

    workOn(id: string) {
      if (focusNote && focusNote.id !== id) update(focusNote.id, { status: "board", startedAt: null });
      update(id, { status: "focus", startedAt: Date.now() });
      setOpenId(null);
    },
    putBack(id: string) {
      update(id, { status: "board", startedAt: null });
    },
    done(id: string) {
      const n = notes.find((x) => x.id === id);
      const actual = n?.startedAt ? Math.max(1, Math.round((Date.now() - n.startedAt) / 60000)) : n?.estMinutes ?? 0;
      update(id, { status: "done", actualMinutes: actual, startedAt: null });
      setOpenId(null);
    },
    tearUp(id: string) {
      setNotes((ns) => ns.filter((n) => n.id !== id));
      setOpenId(null);
    },

    /** Placeholder for the AI: one note per comma/newline. Day 3 replaces this with /api/ai/split. */
    addFromDump(text: string) {
      const titles = text.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
      setNotes((ns) => {
        let acc = ns;
        for (const title of titles) {
          const pos = placeNote(acc.filter((n) => n.status === "board"));
          acc = [
            ...acc,
            {
              id: crypto.randomUUID(),
              title,
              detail: "",
              estMinutes: 30,
              actualMinutes: null,
              energy: "medium",
              status: "board",
              color: randomColor(),
              rotation: randomRotation(),
              startedAt: null,
              ...pos,
            },
          ];
        }
        return acc;
      });
    },
  };
}