"use client";

import { useMemo, useState } from "react";
import { MAX_FOCUS, type Note } from "@/lib/core/types";
import { placeNote, randomColor, randomRotation } from "@/lib/core/placement";
import { createClient } from "@/lib/supabase/client";
import { noteToRow, patchToRow } from "@/lib/core/mappers";
import { trackSave } from "@/components/board/pendingSaves";
import { SplitResultSchema } from "@/lib/ai/tasks/split";

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

export function useBoard(initial: Note[], dayId: string, userId: string, capacityMinutes: number) {
  const [notes, setNotes] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // Optimistic UI; track in-flight writes so nav can flush briefly.
  const save = (id: string, patch: Partial<Note>) =>
    trackSave(
      Promise.resolve(
        supabase.from("notes").update(patchToRow(patch)).eq("id", id).eq("user_id", userId),
      ).then(({ error }) => {
        if (error) console.error("save failed", id, error.message);
      }),
    );

  const insert = (ns: Note[]) =>
    trackSave(
      Promise.resolve(
        supabase.from("notes").insert(ns.map((n) => noteToRow(n, dayId, userId))),
      ).then(({ error }) => {
        if (error) console.error("insert failed", error.message);
      }),
    );

  const remove = (ids: string[]) =>
    trackSave(
      Promise.resolve(
        supabase.from("notes").delete().in("id", ids).eq("user_id", userId),
      ).then(({ error }) => {
        if (error) console.error("delete failed", error.message);
      }),
    );
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

    /** AI split via /api/ai/split. Returns a capacity/ambiguity warning, or null. Throws on failure. */
    async addFromDump(text: string): Promise<string | null> {
      const res = await fetch("/api/ai/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dump: text, capacityMinutes }),
      });
      if (!res.ok) {
        const err = ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong";
        throw new Error(err);
      }

      const parsed = SplitResultSchema.safeParse(await res.json());
      if (!parsed.success) throw new Error("Something went wrong");
      const { notes: split, warning } = parsed.data;
      if (split.length === 0) {
        return warning ?? "Couldn't find a task in that.";
      }

      const total = split.reduce((s, n) => s + n.estMinutes, 0);
      const overbooked =
        total > capacityMinutes
          ? `That's about ${fmtHours(total)}h of work for a ${fmtHours(capacityMinutes)}h day.`
          : null;

      const created: Note[] = [];
      let board = notes.filter((n) => n.status === "board");
      for (const s of split) {
        const n: Note = {
          id: crypto.randomUUID(),
          ...s,
          actualMinutes: null,
          spentMs: 0,
          status: "board",
          color: randomColor(),
          rotation: randomRotation(),
          startedAt: null,
          carriedFrom: null,
          ...placeNote(board),
        };
        created.push(n);
        board = [...board, n];
      }
      setNotes((ns) => [...ns, ...created]);
      insert(created);
      return [warning, overbooked].filter(Boolean).join(" ") || null;
    },
  };
}
