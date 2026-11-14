"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_FOCUS, type Note, type NoteShape } from "@/lib/core/types";
import { placeNote } from "@/lib/core/placement";
import { asOneNote, toBoardNotes } from "@/lib/core/split";
import type { BoardStore } from "@/components/board/store";
import { writeBoardCache } from "@/components/board/boardCache";

export type BoardAccount = { userId: string; dayId: string; date: string };

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

/** Only undo fields that still match what this failed save tried to write. */
function revertPatch(current: Note, before: Note, patch: Partial<Note>): Note {
  const next = { ...current };
  for (const key of Object.keys(patch) as (keyof Note)[]) {
    const attempted = patch[key];
    if (Object.is(current[key], attempted)) {
      (next as Note)[key] = before[key] as never;
    }
  }
  return next;
}

export function useBoard(
  initial: Note[],
  store: BoardStore,
  initialOnboarded: boolean,
  account: BoardAccount | null = null,
) {
  // Always seed from the server — localStorage belongs in loading.tsx, not hydration.
  const [notes, setNotes] = useState(initial);
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const [openId, setOpenId] = useState<string | null>(null);
  const [doneAskId, setDoneAskId] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(initialOnboarded);
  const { save, remove, saveOnboarding, insert } = store;

  // Signed-in only: adopt notes after router.refresh(). Guest boards own localStorage
  // and re-pass a new initial array on every parent render — don't clobber them.
  useEffect(() => {
    if (store.persist) return;
    setNotes(initial);
    setOnboarded(initialOnboarded);
    setOpenId(null);
    setDoneAskId(null);
  }, [initial, initialOnboarded, store]);

  useEffect(() => {
    store.persist?.(notes);
  }, [store, notes]);

  // Signed-in cold-start cache — same shape as guest persist, keyed by day.
  useEffect(() => {
    if (!account || store.persist) return;
    writeBoardCache(account.userId, account.dayId, account.date, notes);
  }, [account, store.persist, notes]);

  useEffect(() => {
    store.importGuest?.().then((imported) => {
      if (imported.length) setNotes((ns) => mergeNew(ns, imported));
    });
  }, [store]);

  const update = (id: string, patch: Partial<Note>) => {
    const prev = notesRef.current.find((n) => n.id === id);
    if (!prev) return;
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    void save(id, patch).then((ok) => {
      if (ok) return;
      setNotes((cur) =>
        cur.map((n) => (n.id === id ? revertPatch(n, prev, patch) : n)),
      );
    });
  };

  const boardNotes = notes.filter((n) => n.status === "board");
  const focusNotes = notes.filter((n) => n.status === "focus"); // newest last
  const doneNotes = notes.filter((n) => n.status === "done");
  const trashedNotes = notes.filter((n) => n.status === "trashed");
  const openNote = notes.find((n) => n.id === openId) ?? null;
  const doneAsk = notes.find((n) => n.id === doneAskId && n.againTomorrow) ?? null;

  /** `keepTomorrow` leaves the queue on. False clears it in the same save as Done. */
  function finishDone(n: Note, keepTomorrow: boolean) {
    const paused = pause(n);
    const tracked = paused.spentMs > 0;
    const patch: Partial<Note> = {
      status: "done",
      startedAt: paused.startedAt,
      spentMs: paused.spentMs,
      // Only store time spent when the focus timer actually ran.
      actualMinutes: tracked ? Math.max(1, Math.round(paused.spentMs / 60000)) : null,
    };
    if (!keepTomorrow) patch.againTomorrow = false;
    update(n.id, patch);
    setOpenId(null);
    setDoneAskId(null);
  }

  return {
    boardNotes,
    focusNotes,
    doneNotes,
    trashedNotes,
    openNote,
    doneAsk,
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
      const prev = notesRef.current.find((k) => k.id === id);
      if (!prev) return;
      const patch = { x, y };
      setNotes((ns) => {
        const n = ns.find((k) => k.id === id);
        if (!n) return ns;
        return [...ns.filter((k) => k.id !== id), { ...n, x, y }]; // last = on top
      });
      void save(id, patch).then((ok) => {
        if (ok) return;
        setNotes((cur) =>
          cur.map((n) => (n.id === id ? revertPatch(n, prev, patch) : n)),
        );
      });
    },
    open: (id: string) => setOpenId(id),
    close: () => setOpenId(null),

    workOn(id: string) {
      const before = notesRef.current;
      const already = before.filter((n) => n.status === "focus" && n.id !== id);
      const demoted = already.length >= MAX_FOCUS ? already[0] : null;
      let acc = before;
      if (demoted) {
        acc = acc.map((n) => (n.id === demoted.id ? { ...pause(n), status: "board" as const } : n));
      }
      acc = acc.map((n) => {
        if (n.id !== id) return n;
        if (n.status === "focus" && n.startedAt) return n;
        return { ...n, status: "focus" as const, startedAt: Date.now() };
      });
      const pinned = acc.find((n) => n.id === id);
      if (!pinned) return;
      const result = [...acc.filter((n) => n.id !== id), pinned];
      setNotes(result);
      setOpenId(null);

      void (async () => {
        const touched = new Set<string>();
        const restoreUi = () => {
          setNotes((cur) =>
            cur.map((n) => (touched.has(n.id) ? before.find((b) => b.id === n.id) ?? n : n)),
          );
        };

        // Demote first so enforce_focus_cap doesn't reject the promote.
        if (demoted) {
          const after = result.find((n) => n.id === demoted.id)!;
          const patch = changedTimerFields(demoted, after);
          if (patch) {
            touched.add(demoted.id);
            if (!(await save(demoted.id, patch))) {
              restoreUi();
              return;
            }
          }
        }

        for (const n of result) {
          if (demoted && n.id === demoted.id) continue;
          const p = before.find((k) => k.id === n.id);
          if (!p) continue;
          const patch = changedTimerFields(p, n);
          if (!patch) continue;
          touched.add(n.id);
          if (await save(n.id, patch)) continue;
          // Promote failed after a successful demote — put the kicked note back on the server.
          if (demoted && touched.has(demoted.id)) {
            const after = result.find((k) => k.id === demoted.id)!;
            const undo = changedTimerFields(after, demoted);
            if (undo) await save(demoted.id, undo);
          }
          restoreUi();
          return;
        }
      })();
    },

    resume(id: string) {
      const before = notesRef.current;
      const result = before.map((n) =>
        n.id === id && n.status === "focus" ? { ...n, startedAt: Date.now() } : n,
      );
      setNotes(result);
      for (const n of result) {
        const p = before.find((k) => k.id === n.id);
        if (!p) continue;
        const patch = changedTimerFields(p, n);
        if (!patch) continue;
        void save(n.id, patch).then((ok) => {
          if (ok) return;
          setNotes((cur) =>
            cur.map((k) => (k.id === n.id ? revertPatch(k, p, patch) : k)),
          );
        });
      }
    },

    putBack(id: string) {
      const n = notesRef.current.find((k) => k.id === id);
      if (!n) return;
      const paused = pause(n);
      update(id, { status: "board", startedAt: paused.startedAt, spentMs: paused.spentMs });
    },

    done(id: string) {
      const n = notesRef.current.find((k) => k.id === id);
      if (!n) return;
      // A note queued for tomorrow should not silently come back after Done.
      if (n.againTomorrow) {
        setDoneAskId(id);
        return;
      }
      finishDone(n, true);
    },

    confirmDone(keepTomorrow: boolean) {
      const n = notesRef.current.find((k) => k.id === doneAskId);
      if (!n) {
        setDoneAskId(null);
        return;
      }
      finishDone(n, keepTomorrow);
    },

    cancelDone() {
      setDoneAskId(null);
    },

    trash(id: string) {
      const n = notesRef.current.find((k) => k.id === id);
      if (!n) return;
      const paused = pause(n);
      update(id, { status: "trashed", startedAt: paused.startedAt, spentMs: paused.spentMs });
      setOpenId(null);
    },

    restore(id: string) {
      const before = notesRef.current.find((k) => k.id === id);
      if (!before) return;
      const pos = placeNote(notesRef.current.filter((k) => k.status === "board"));
      const patch = { status: "board" as const, startedAt: null, actualMinutes: null, ...pos };
      setNotes((ns) => ns.map((k) => (k.id === id ? { ...k, ...patch } : k)));
      void save(id, patch).then((ok) => {
        if (ok) return;
        setNotes((cur) =>
          cur.map((k) => (k.id === id ? revertPatch(k, before, patch) : k)),
        );
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

    /** One sticky from the dump text, as typed. Throws on failure. */
    async addOne(text: string, defaultShape: NoteShape | null): Promise<string | null> {
      const one = asOneNote(text);
      if (!one) return "Type a task first.";
      const created = toBoardNotes(
        [one],
        notes.filter((n) => n.status === "board"),
        defaultShape,
        () => crypto.randomUUID(),
      );
      await insert(created);
      setNotes((ns) => mergeNew(ns, created));
      return null;
    },

    /** Splits a brain dump into notes. Returns an ambiguity warning, or null. Throws on failure. */
    async addFromDump(text: string): Promise<string | null> {
      const { notes: created, warning, replayed } = await store.split(text, notes);
      if (created.length === 0) {
        return warning ?? "Couldn't find a task in that.";
      }
      if (replayed && created.every((c) => notes.some((n) => n.id === c.id))) {
        return "Those are already on your board (check the bin).";
      }

      setNotes((ns) => mergeNew(ns, created));
      return warning;
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
