"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dayHeading, formatSummaryTime, writtenTime } from "@/lib/core/date";
import type { Note } from "@/lib/core/types";
import type { StoredSummary } from "@/lib/ai/tasks/summarize";
import { StickyNote } from "@/components/board/StickyNote";

export type SummaryBlock = {
  date: string;
  dayId: string;
  summary: StoredSummary | null;
  doneNotes: Note[];
  unfinishedNotes: Note[];
  summaryTime: string;
  /** True when a note's created_at is after the summary was written. */
  stale: boolean;
};

function toText(data: SummaryBlock): string {
  if (!data.summary) return "";
  const s = data.summary;
  const lines = [
    dayHeading(data.date),
    "",
    s.story,
    "",
    "What you did",
    ...(data.doneNotes.length ? data.doneNotes.map((n) => `• ${n.title}`) : ["• (none)"]),
    "",
    s.read,
  ];
  if (data.unfinishedNotes.length || s.tomorrowNudge) {
    lines.push(
      "",
      "Tomorrow",
      ...data.unfinishedNotes.map((n) => `• ${n.title}`),
    );
    if (s.tomorrowNudge) lines.push("", s.tomorrowNudge);
  }
  if (s.createdAt) lines.push("", writtenTime(s.createdAt));
  return lines.join("\n");
}

export function SummaryView({ data }: { data: SummaryBlock }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!data.summary) {
    return (
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
    );
  }

  const s = data.summary;
  const showTomorrow = data.unfinishedNotes.length > 0 || !!s.tomorrowNudge;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-hand text-5xl font-bold">Your day</h1>
        <p className="text-sm text-fg-soft">{dayHeading(data.date)}</p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-fg-soft">What you did</h2>
        {data.doneNotes.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {data.doneNotes.map((n) => (
              <StickyNote key={n.id} note={n} readOnly faded />
            ))}
          </div>
        ) : (
          <p className="text-sm text-fg-soft">Nothing finished yet.</p>
        )}
        {s.story && <p className="text-base leading-relaxed text-fg">{s.story}</p>}
      </section>

      {s.read && (
        <section className="py-2">
          <p className="text-lg leading-relaxed text-fg">{s.read}</p>
        </section>
      )}

      {showTomorrow && (
        <section className="flex flex-col gap-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-fg-soft">Tomorrow</h2>
          {data.unfinishedNotes.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {data.unfinishedNotes.map((n) => (
                <StickyNote key={n.id} note={n} readOnly />
              ))}
            </div>
          )}
          {s.tomorrowNudge && (
            <p className="text-base leading-relaxed text-fg">{s.tomorrowNudge}</p>
          )}
        </section>
      )}

      <div className="flex flex-col gap-2">
        {s.createdAt && (
          <p className="text-xs text-fg-soft">{writtenTime(s.createdAt)}</p>
        )}
        {data.stale && (
          <p className="text-sm text-fg-soft">
            Things changed since this was written.{" "}
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

      <div>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-frame px-4 text-sm font-semibold"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
