"use client";

import { useEffect, type Ref } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { dayHeading, writtenCaption } from "@/lib/core/date";
import type { NoteStatus } from "@/lib/core/types";

export type DayDrawerNote = {
  title: string;
  est_minutes: number;
  actual_minutes: number | null;
  status: NoteStatus;
};

type Props = {
  date: string | null;
  today: string;
  summary: string | null;
  summaryCreatedAt: string | null;
  notes: DayDrawerNote[] | null;
  loading: boolean;
  onClose: () => void;
  panelRef: Ref<HTMLElement>;
};

export function DayDrawer({
  date,
  today,
  summary,
  summaryCreatedAt,
  notes,
  loading,
  onClose,
  panelRef,
}: Props) {
  useEffect(() => {
    if (!date) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, onClose]);

  const open = date !== null;
  const isToday = date === today;
  const doneNotes = notes?.filter((n) => n.status === "done") ?? [];
  const unfinishedNotes = notes?.filter((n) => n.status === "board" || n.status === "focus") ?? [];
  const trashedNotes = notes?.filter((n) => n.status === "trashed") ?? [];

  return (
    <AnimatePresence>
      {open && date && (
        <motion.aside
          ref={panelRef}
          className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto bg-surface p-6 shadow-2xl"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <header className="flex items-start justify-between gap-3">
            <h2 className="font-hand text-4xl font-bold">{dayHeading(date)}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="h-11 w-11 shrink-0 rounded-full border border-frame"
            >
              ✕
            </button>
          </header>

          {summary && (
            <div className="flex flex-col gap-2">
              <p className="text-sm leading-relaxed text-fg">{summary}</p>
              {summaryCreatedAt && (
                <p className="text-xs text-fg-soft">{writtenCaption(summaryCreatedAt)}</p>
              )}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-fg-soft">Loading notes…</p>
          ) : (
            <div className="flex flex-col gap-5">
              <NoteGroup label="Done" items={doneNotes} mode="done" />
              <NoteGroup label="Unfinished" items={unfinishedNotes} mode="plain" />
              <NoteGroup label="Trashed" items={trashedNotes} mode="plain" />
              {!summary && notes && notes.length === 0 && (
                <p className="py-8 text-center font-hand text-2xl text-fg-soft">Nothing logged.</p>
              )}
            </div>
          )}

          {isToday && (
            <footer className="mt-auto border-t border-frame pt-4">
              <Link
                href="/board"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-fg px-4 text-sm font-semibold text-bg"
              >
                Go to board
              </Link>
            </footer>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function NoteGroup({
  label,
  items,
  mode,
}: {
  label: string;
  items: DayDrawerNote[];
  mode: "done" | "plain";
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-fg-soft">{label}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((n, i) => (
          <li
            key={`${n.title}-${i}`}
            className="flex items-baseline justify-between gap-3 rounded-lg bg-bg px-3 py-2 text-sm"
          >
            <span className="font-semibold">{n.title}</span>
            {mode === "done" && (
              <span className="shrink-0 tabular-nums text-fg-soft">
                {n.est_minutes} · took {n.actual_minutes ?? n.est_minutes}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
