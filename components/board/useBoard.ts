"use client";

import { useEffect, useState } from "react";
import { MAX_FOCUS, type Note, type NoteShape } from "@/lib/core/types";
import { placeNote } from "@/lib/core/placement";
import type { BoardStore } from "@/components/board/store";

function fmtHours(minutes: number) {
  const h = minutes / 60;
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
}

/** Fold running time into spentMs and stop the clock. */
function pause(n: Note): Note {
  if (!n.startedAt) return n;
  return { ...n, spentMs: n.spentMs + (Date.now() - n.startedAt), startedAt: null };
}

function changedTimerFields(prev: Note, next: Note): Partial<Note> | null {
  const patch: Partial<Note> = {};
  if (prev.status !== next.status) patch.status = next.status;
  if (prev.startedAt !== next.startedAt) patch.startedAt = next.startedAt;
  if (prev.spentMs !== next.spentMs) patch.spentMs = next.spentMs;
  if (prev.actualMinutes !== next.actualMinutes) patch.actualMinutes = next.actualMinutes;
  if (prev.x !== next.x) patch.x = next.x;
  if (prev.y !== next.y) patch.y = next.y;
  return Object.keys(patch).length ? patch : null;
}

/** Adds notes the board doesn't show yet; a repeat split or import may return ones it does. */
function mergeNew(ns: Note[], created: Note[]): Note[] {
  const shown = new Set(ns.map((n) => n.id));
  return [...ns, ...created.filter((n) => !shown.has(n.id))];
}

/** capacityMinutes is null when estimates are guesses (the guest board), so no overbooking line. */
export function useBoard(
  initial: Note[],
  store: BoardStore,
  capacityMinutes: number | null,
  initialOnboarded: boolean,
) {
  const [notes, setNotes] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(initialOnboarded);
  const { save, remove, saveOnboarding } = store;

  useEffect(() => {
    store.persist?.(notes);
  }, [store, notes]);

  useEffect(() => {
    store.importGuest?.().then((imported) => {
      if (imported.length) setNotes((ns) => mergeNew(ns, imported));
    });
  }, [store]);

  const update = (id: string, patch: Partial<Note>) => {
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    save(id, patch);
  };

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
    onboarded,

    /** First-visit answer: the shape for new notes, and never show the card again. */
    async finishOnboarding(shape: NoteShape | null) {
      await saveOnboarding({ default_shape: shape });
      setOnboarded(true);
    },

    /** Dismiss the first-visit card without touching the shape already chosen. */
    async skipOnboarding() {
      await saveOnboarding({});
      setOnboarded(true);
    },

    move(id: string, x: number, y: number) {
      setNotes((ns) => {
        const n = ns.find((k) => k.id === id);
        if (!n) return ns;
        return [...ns.filter((k) => k.id !== id), { ...n, x, y }]; // last = on top
      });
      save(id, { x, y });
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
        const result = [...acc.filter((n) => n.id !== id), pinned];

        for (const n of result) {
          const p = ns.find((k) => k.id === n.id);
          if (!p) continue;
          const patch = changedTimerFields(p, n);
          if (patch) save(n.id, patch);
        }
        return result;
      });
      setOpenId(null);
    },

    resume(id: string) {
      setNotes((ns) => {
        const result = ns.map((n) => {
          if (n.status !== "focus") return n;
          return n.id === id ? { ...n, startedAt: Date.now() } : pause(n);
        });
        for (const n of result) {
          const p = ns.find((k) => k.id === n.id)!;
          const patch = changedTimerFields(p, n);
          if (patch) save(n.id, patch);
        }
        return result;
      });
    },

    putBack(id: string) {
      const n = notes.find((k) => k.id === id);
      if (!n) return;
      const paused = pause(n);
      update(id, { status: "board", startedAt: paused.startedAt, spentMs: paused.spentMs });
    },

    done(id: string) {
      const n = notes.find((k) => k.id === id);
      if (!n) return;
      const paused = pause(n);
      const tracked = paused.spentMs > 0;
      const mins = tracked
        ? Math.max(1, Math.round(paused.spentMs / 60000))
        : n.estMinutes;
      update(id, {
        status: "done",
        startedAt: paused.startedAt,
        spentMs: paused.spentMs,
        actualMinutes: mins,
      });
      setOpenId(null);
    },

    trash(id: string) {
      const n = notes.find((k) => k.id === id);
      if (!n) return;
      const paused = pause(n);
      update(id, { status: "trashed", startedAt: paused.startedAt, spentMs: paused.spentMs });
      setOpenId(null);
    },

    restore(id: string) {
      setNotes((ns) => {
        const n = ns.find((k) => k.id === id);
        if (!n) return ns;
        const pos = placeNote(ns.filter((k) => k.status === "board"));
        const patch = { status: "board" as const, startedAt: null, actualMinutes: null, ...pos };
        save(id, patch);
        return ns.map((k) => (k.id === id ? { ...k, ...patch } : k));
      });
    },

    emptyBin() {
      const ids = notes.filter((n) => n.status === "trashed").map((n) => n.id);
      setNotes((ns) => ns.filter((n) => n.status !== "trashed"));
      if (ids.length) remove(ids);
    },

    edit(id: string, patch: Partial<Note>) {
      update(id, patch);
    },

    /** Splits a brain dump into notes. Returns a capacity/ambiguity warning, or null. Throws on failure. */
    async addFromDump(text: string): Promise<string | null> {
      const { notes: created, warning, replayed } = await store.split(text, notes);
      if (created.length === 0) {
        return warning ?? "Couldn't find a task in that.";
      }
      if (replayed && created.every((c) => notes.some((n) => n.id === c.id))) {
        return "Those are already on your board (check the bin).";
      }

      const total = created.reduce((s, n) => s + n.estMinutes, 0);
      const overbooked =
        capacityMinutes !== null && total > capacityMinutes
          ? `That's about ${fmtHours(total)}h of work for a ${fmtHours(capacityMinutes)}h day.`
          : null;

      setNotes((ns) => mergeNew(ns, created));
      return [warning, overbooked].filter(Boolean).join(" ") || null;
    },

    /** Puts ready-made notes on the board, e.g. an example day on the guest board. */
    addNotes(created: Note[]) {
      setNotes((ns) => mergeNew(ns, created));
    },

    /** Takes every note off the board for good. */
    clear() {
      const ids = notes.map((n) => n.id);
      setNotes([]);
      setOpenId(null);
      if (ids.length) remove(ids);
    },
  };
}
