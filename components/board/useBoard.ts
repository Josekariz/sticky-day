"use client";

import { useState } from "react";
import { MAX_FOCUS, type Note } from "@/lib/core/types";
import { placeNote, randomColor, randomRotation } from "@/lib/core/placement";

/** Fold running time into spentMs and stop the clock. */
function pause(n: Note): Note {
  if (!n.startedAt) return n;
  return { ...n, spentMs: n.spentMs + (Date.now() - n.startedAt), startedAt: null };
}

export function useBoard(initial: Note[]) {
  const [notes, setNotes] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Note>) =>
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));

  const boardNotes = notes.filter((n) => n.status === "board");
  const focusNotes = notes.filter((n) => n.status === "focus"); // newest last
  const doneNotes = notes.filter((n) => n.status === "done");
  const trashedNotes = notes.filter((n) => n.status === "trashed");
  const openNote = notes.find((n) => n.id === openId) ?? null;

  return {
    boardNotes,
    focusNotes,
    doneNotes,
    trashedNotes,
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
      setNotes((ns) => {
        const already = ns.filter((n) => n.status === "focus" && n.id !== id);
        let acc = ns.map((n) => (n.status === "focus" ? pause(n) : n));
        if (already.length >= MAX_FOCUS) {
          const oldest = already[0];
          acc = acc.map((n) => (n.id === oldest.id ? { ...pause(n), status: "board" } : n));
        }
        acc = acc.map((n) => (n.id === id ? { ...n, status: "focus" as const, startedAt: Date.now() } : n));
        const pinned = acc.find((n) => n.id === id);
        if (!pinned) return acc;
        return [...acc.filter((n) => n.id !== id), pinned];
      });
      setOpenId(null);
    },

    resume(id: string) {
      setNotes((ns) =>
        ns.map((n) => {
          if (n.status !== "focus") return n;
          return n.id === id ? { ...n, startedAt: Date.now() } : pause(n);
        }),
      );
    },

    putBack(id: string) {
      setNotes((ns) => ns.map((n) => (n.id === id ? { ...pause(n), status: "board" } : n)));
    },

    done(id: string) {
      setNotes((ns) =>
        ns.map((n) => {
          if (n.id !== id) return n;
          const paused = pause(n);
          const tracked = paused.spentMs > 0;
          const mins = tracked
            ? Math.max(1, Math.round(paused.spentMs / 60000))
            : n.estMinutes;
          return { ...paused, status: "done", actualMinutes: mins };
        }),
      );
      setOpenId(null);
    },

    trash(id: string) {
      setNotes((ns) => ns.map((n) => (n.id === id ? { ...pause(n), status: "trashed" } : n)));
      setOpenId(null);
    },

    restore(id: string) {
      setNotes((ns) => {
        const n = ns.find((k) => k.id === id);
        if (!n) return ns;
        const pos = placeNote(ns.filter((k) => k.status === "board"));
        return ns.map((k) =>
          k.id === id
            ? { ...k, status: "board" as const, startedAt: null, actualMinutes: null, ...pos }
            : k,
        );
      });
    },

    emptyBin() {
      setNotes((ns) => ns.filter((n) => n.status !== "trashed"));
    },

    edit(id: string, patch: Partial<Note>) {
      update(id, patch); // persistence: also save to Supabase
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
              spentMs: 0,
              ...pos,
            },
          ];
        }
        return acc;
      });
    },
  };
}
