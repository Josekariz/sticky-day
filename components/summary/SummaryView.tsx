"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  dayHeading,
  formatSummaryTime,
  storyYouHeading,
  writtenTime,
} from "@/lib/core/date";
import { paperVar, type Note } from "@/lib/core/types";
import { signOffFor } from "@/lib/core/themes";
import type { StoredSummary } from "@/lib/ai/tasks/summarize";
import { StoredSummarySchema } from "@/lib/ai/tasks/summarize";
import { RecapDone } from "@/components/summary/RecapDone";

function calendarDayHref(date: string): string {
  const m = date.slice(0, 7);
  return `/calendar?m=${m}&day=${date}`;
}

export type SummaryBlock = {
  date: string;
  /** Calendar today in the user's timezone — for Today/Yesterday headings. */
  today: string;
  dayId: string;
  firstName: string | null;
  timezone: string;
  /** Time-of-day line fixed at page load (server). */
  greeting: string;
  summary: StoredSummary | null;
  doneNotes: Note[];
  /** On the clipboard right now — still today. */
  focusNotes: Note[];
  /** Left on the board — these carry to tomorrow. */
  unfinishedNotes: Note[];
  summaryTime: string;
  /** True when any note on the day changed after the summary was written. */
  stale: boolean;
};

function toText(data: SummaryBlock): string {
  if (!data.summary) return "";
  const s = data.summary;
  const you = storyYouHeading(data.date, data.today);
  const lines = [
    data.greeting,
    dayHeading(data.date),
    "",
    you,
    s.story,
    "",
    ...(data.doneNotes.length ? data.doneNotes.map((n) => `• ${n.title}`) : []),
    ...(data.focusNotes.length ? data.focusNotes.map((n) => `• ${n.title} (still on it)`) : []),
    "",
    "Something to read",
    s.read,
  ];
  if (data.unfinishedNotes.length > 0) {
    lines.push("", "Tomorrow", ...data.unfinishedNotes.map((n) => `• ${n.title}`));
    if (s.tomorrowNudge) lines.push("", s.tomorrowNudge);
  }
  lines.push("", signOffFor(data.date));
  if (s.createdAt) lines.push("", writtenTime(s.createdAt, data.timezone));
  return lines.join("\n");
}

function NoteLine({ note, tick, mark }: { note: Note; tick?: boolean; mark?: string }) {
  return (
    <li className="flex items-center gap-2.5 font-hand text-[20px] leading-snug text-fg">
      <span
        className="size-2.5 shrink-0 rounded-[2px]"
        style={{ backgroundColor: paperVar(note.color) }}
        aria-hidden
      />
      <span className="min-w-0">{note.title}</span>
      {mark && (
        <span className="shrink-0 text-[11px] font-semibold tracking-wide text-fg-soft">{mark}</span>
      )}
      {tick && (
        <svg
          className="ml-0.5 shrink-0 text-fg-soft"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </li>
  );
}

export function SummaryView({
  data,
  variant = "day",
}: {
  data: SummaryBlock;
  /** Recap shows a calendar disclaimer; no Write it now. */
  variant?: "day" | "recap";
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openNotes = [...data.focusNotes, ...data.unfinishedNotes];
  const isRecap = variant === "recap";

  async function copy() {
    if (!data.summary) return;
    await navigator.clipboard.writeText(toText(data));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function writeNow(force: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId: data.dayId, force }),
      });
      if (!res.ok) {
        const err = ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong";
        throw new Error(err);
      }
      const parsed = StoredSummarySchema.safeParse(await res.json());
      if (!parsed.success) throw new Error("Something went wrong");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!data.summary) {
    return (
      <div className="mx-auto flex w-full max-w-[35rem] flex-col gap-10">
        <header className="flex flex-col gap-1">
          <h1 className="font-hand text-5xl font-bold">{data.greeting}</h1>
          <p className="text-sm text-fg-soft">{dayHeading(data.date)}</p>
        </header>
        {openNotes.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="font-hand text-2xl font-semibold text-fg">Today you have</h2>
            <ul className="flex flex-col gap-2">
              {openNotes.map((n) => (
                <NoteLine
                  key={n.id}
                  note={n}
                  mark={n.status === "focus" ? "still on it" : undefined}
                />
              ))}
            </ul>
          </section>
        )}
        <div className="flex flex-col gap-4 rounded-2xl border border-frame bg-surface p-6">
          <p className="text-base text-fg">
            Writes itself at {formatSummaryTime(data.summaryTime)}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void writeNow(true)}
            className="self-start text-sm text-fg-soft underline underline-offset-2 disabled:opacity-60"
          >
            {busy ? "Writing…" : "Write it now"}
          </button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </div>
    );
  }

  const s = data.summary;
  const showTomorrow = data.unfinishedNotes.length > 0;
  const youHeading = storyYouHeading(data.date, data.today);

  return (
    <div className="mx-auto flex w-full max-w-[35rem] flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-hand text-5xl font-bold">{data.greeting}</h1>
        <p className="text-sm text-fg-soft">{dayHeading(data.date)}</p>
        {isRecap && (
          <p className="mt-2 text-sm leading-relaxed text-fg-soft">
            You can always find this again on the{" "}
            <Link
              href={calendarDayHref(data.date)}
              className="underline underline-offset-2 hover:text-fg"
            >
              calendar for this day
            </Link>
            .
          </p>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-hand text-2xl font-semibold text-fg">{youHeading}</h2>
        {s.story && <p className="text-base leading-relaxed text-fg">{s.story}</p>}
        {(data.doneNotes.length > 0 || data.focusNotes.length > 0) && (
          <ul className="flex flex-col gap-2">
            {data.doneNotes.map((n) => (
              <NoteLine key={n.id} note={n} tick />
            ))}
            {data.focusNotes.map((n) => (
              <NoteLine key={n.id} note={n} mark="still on it" />
            ))}
          </ul>
        )}
      </section>

      {s.read && (
        <section className="flex flex-col gap-3">
          <h2 className="font-hand text-2xl font-semibold text-fg">Something to read</h2>
          <p className="text-[17px] leading-[1.6] text-fg">{s.read}</p>
        </section>
      )}

      {showTomorrow && (
        <section className="flex flex-col gap-4">
          <h2 className="font-hand text-2xl font-semibold text-fg">Tomorrow</h2>
          {data.unfinishedNotes.length > 0 && (
            <ul className="flex flex-col gap-2">
              {data.unfinishedNotes.map((n) => (
                <NoteLine key={n.id} note={n} />
              ))}
            </ul>
          )}
          {s.tomorrowNudge && (
            <p className="text-base leading-relaxed text-fg">{s.tomorrowNudge}</p>
          )}
        </section>
      )}

      <p className="font-hand text-xl text-fg">{signOffFor(data.date)}</p>

      <div className="flex flex-col gap-2">
        {s.createdAt && (
          <p className="text-xs text-fg-soft">{writtenTime(s.createdAt, data.timezone)}</p>
        )}
        {!isRecap && data.stale && (
          <p className="text-sm text-fg-soft">
            Things changed since this was written ·{" "}
            <button
              type="button"
              disabled={busy}
              onClick={() => void writeNow(true)}
              className="underline underline-offset-2 disabled:opacity-60"
            >
              {busy ? "Writing…" : "Write it again"}
            </button>
          </p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex h-11 w-fit items-center justify-center rounded-xl border border-frame px-4 text-sm font-semibold"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        {isRecap && <RecapDone dayId={data.dayId} />}
      </div>
    </div>
  );
}
