"use client";

import { useEffect, useState, type Ref } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { dayHeading, writtenTime } from "@/lib/core/date";
import { signOffFor } from "@/lib/core/themes";
import type { NoteStatus } from "@/lib/core/types";
import type { StoredSummary } from "@/lib/ai/tasks/summarize";
import { summaryStory } from "@/lib/ai/tasks/summarize";
import { NavTopProgress, PendingLabel } from "@/components/nav/PendingNav";

export type DayDrawerNote = {
  title: string;
  est_minutes: number;
  actual_minutes: number | null;
  status: NoteStatus;
};

type Face = "glance" | "read";

type Props = {
  date: string | null;
  today: string;
  dayId: string | null;
  summary: StoredSummary | null;
  notes: DayDrawerNote[] | null;
  loading: boolean;
  onClose: () => void;
  panelRef: Ref<HTMLElement>;
  onMarkRead?: (dayId: string) => void;
};

export function DayDrawer({
  date,
  today,
  dayId,
  summary,
  notes,
  loading,
  onClose,
  panelRef,
  onMarkRead,
}: Props) {
  const [face, setFace] = useState<Face>("glance");

  useEffect(() => {
    setFace("glance");
  }, [date]);

  useEffect(() => {
    if (!date) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, onClose]);

  useEffect(() => {
    if (face !== "read" || !dayId || !summary) return;
    onMarkRead?.(dayId);
  }, [face, dayId, summary, onMarkRead]);

  const open = date !== null;
  const isToday = date === today;
  const doneNotes = notes?.filter((n) => n.status === "done") ?? [];
  const unfinishedNotes = notes?.filter((n) => n.status === "board" || n.status === "focus") ?? [];
  const trashedNotes = notes?.filter((n) => n.status === "trashed") ?? [];
  const hasLetter = !!summary && (!!summaryStory(summary) || !!summary.read);

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

          <div
            role="tablist"
            aria-label="Day view"
            className="flex rounded-xl border border-frame p-1"
          >
            <FaceTab
              id="day-face-glance"
              selected={face === "glance"}
              onSelect={() => setFace("glance")}
              label="Glance"
              emoji="👀"
            />
            <FaceTab
              id="day-face-read"
              selected={face === "read"}
              onSelect={() => setFace("read")}
              label="Read"
              emoji="📖"
            />
          </div>

          <AnimatePresence mode="wait">
            {face === "glance" ? (
              <motion.div
                key="glance"
                role="tabpanel"
                aria-labelledby="day-face-glance"
                className="flex flex-1 flex-col gap-5"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
              >
                {loading ? (
                  <p className="text-sm text-fg-soft">Loading notes…</p>
                ) : (
                  <>
                    <NoteGroup label="Done" items={doneNotes} mode="done" />
                    <NoteGroup label="Unfinished" items={unfinishedNotes} mode="plain" />
                    <NoteGroup label="Trashed" items={trashedNotes} mode="plain" />
                    {notes && notes.length === 0 && (
                      <p className="py-8 text-center font-hand text-2xl text-fg-soft">Nothing logged.</p>
                    )}
                    {hasLetter && (
                      <p className="text-sm text-fg-soft">
                        Letter waiting ·{" "}
                        <button
                          type="button"
                          onClick={() => setFace("read")}
                          className="font-semibold underline underline-offset-2"
                        >
                          Read
                        </button>
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="read"
                role="tabpanel"
                aria-labelledby="day-face-read"
                className="flex flex-1 flex-col gap-6"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                {hasLetter && summary ? (
                  <LetterBody
                    date={date}
                    summary={summary}
                    unfinishedTitles={unfinishedNotes.map((n) => n.title)}
                  />
                ) : (
                  <div className="flex flex-col gap-3 py-6">
                    <p className="font-hand text-2xl text-fg-soft">No letter for this day.</p>
                    {isToday && (
                      <Link
                        href="/summary"
                        className="self-start text-sm font-semibold underline underline-offset-2"
                      >
                        Your day
                      </Link>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {isToday && face === "glance" && (
            <footer className="mt-auto border-t border-frame pt-4">
              <Link
                href="/board"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-fg px-4 text-sm font-semibold text-bg"
              >
                <NavTopProgress />
                <PendingLabel>Go to board</PendingLabel>
              </Link>
            </footer>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function FaceTab({
  id,
  selected,
  onSelect,
  label,
  emoji,
}: {
  id: string;
  selected: boolean;
  onSelect: () => void;
  label: string;
  emoji: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors ${
        selected ? "bg-fg text-bg" : "text-fg-soft hover:text-fg"
      }`}
    >
      <span aria-hidden>{emoji}</span>
      {label}
    </button>
  );
}

function LetterBody({
  date,
  summary,
  unfinishedTitles,
}: {
  date: string;
  summary: StoredSummary;
  unfinishedTitles: string[];
}) {
  const story = summaryStory(summary);
  const showTomorrow = unfinishedTitles.length > 0 || !!summary.tomorrowNudge;

  return (
    <>
      {story && (
        <section className="flex flex-col gap-3">
          <h3 className="font-hand text-2xl font-semibold text-fg">Today you…</h3>
          <p className="text-base leading-relaxed text-fg">{story}</p>
        </section>
      )}
      {summary.read && (
        <section className="flex flex-col gap-3">
          <h3 className="font-hand text-2xl font-semibold text-fg">Something to read</h3>
          <p className="text-[17px] leading-[1.6] text-fg">{summary.read}</p>
        </section>
      )}
      {showTomorrow && (
        <section className="flex flex-col gap-3">
          <h3 className="font-hand text-2xl font-semibold text-fg">Tomorrow</h3>
          {unfinishedTitles.length > 0 && (
            <ul className="flex flex-col gap-2">
              {unfinishedTitles.map((title) => (
                <li key={title} className="font-hand text-xl leading-snug text-fg">
                  {title}
                </li>
              ))}
            </ul>
          )}
          {summary.tomorrowNudge && (
            <p className="text-base leading-relaxed text-fg">{summary.tomorrowNudge}</p>
          )}
        </section>
      )}
      <p className="font-hand text-xl text-fg">{signOffFor(date)}</p>
      {summary.createdAt && (
        <p className="text-xs text-fg-soft">{writtenTime(summary.createdAt)}</p>
      )}
    </>
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
                est. {n.est_minutes} min · took {n.actual_minutes ?? n.est_minutes} min
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
