"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dayHeading, formatSummaryTime, writtenCaption } from "@/lib/core/date";
import type { StoredSummary } from "@/lib/ai/tasks/summarize";

export type DoneLine = {
  title: string;
  estMinutes: number;
  actualMinutes: number;
};

export type SummaryBlock = {
  date: string;
  dayId: string;
  summary: StoredSummary | null;
  done: DoneLine[];
  carried: string[];
  summaryTime: string;
};

function toText(data: SummaryBlock): string {
  if (!data.summary) return "";
  const lines = [
    dayHeading(data.date),
    "",
    data.summary.recap,
    "",
    "DONE",
    ...(data.done.length
      ? data.done.map((n) => `• ${n.title} (${n.estMinutes} → ${n.actualMinutes})`)
      : ["• (none)"]),
    "",
    "CARRIED OVER",
    ...(data.carried.length ? data.carried.map((t) => `• ${t}`) : ["• (none)"]),
  ];
  if (data.summary.createdAt) {
    lines.push("", writtenCaption(data.summary.createdAt));
  }
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

  async function writeNow() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId: data.dayId, force: true }),
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
          onClick={() => void writeNow()}
          className="self-start text-sm text-fg-soft underline underline-offset-2 disabled:opacity-60"
        >
          {busy ? "Writing…" : "Write it now"}
        </button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-frame bg-surface p-6">
      <h2 className="font-hand text-3xl font-bold">{dayHeading(data.date)}</h2>
      <p className="text-base leading-relaxed text-fg">{data.summary.recap}</p>

      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-fg-soft">Done</h3>
        <ul className="flex flex-col gap-1.5">
          {data.done.length === 0 && <li className="text-sm text-fg-soft">Nothing here.</li>}
          {data.done.map((n) => (
            <li key={n.title} className="flex items-baseline gap-2 text-base">
              <span className="text-fg-soft">•</span>
              <span>
                {n.title}{" "}
                <span className="text-fg-soft">
                  ({n.estMinutes} → {n.actualMinutes})
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-fg-soft">Carried over</h3>
        <ul className="flex flex-col gap-1.5">
          {data.carried.length === 0 && <li className="text-sm text-fg-soft">Nothing here.</li>}
          {data.carried.map((t) => (
            <li key={t} className="flex items-baseline gap-2 text-base">
              <span className="text-fg-soft">•</span>
              {t}
            </li>
          ))}
        </ul>
      </section>

      {data.summary.createdAt && (
        <p className="text-xs text-fg-soft">{writtenCaption(data.summary.createdAt)}</p>
      )}

      <div className="flex items-center gap-3 border-t border-frame pt-4">
        <button onClick={() => void copy()} className="h-11 rounded-xl bg-fg px-5 text-sm font-semibold text-bg">
          {copied ? "Copied" : "Copy as text"}
        </button>
        <span className="text-xs text-fg-soft">Paste it into Slack, a standup doc, wherever.</span>
      </div>
    </div>
  );
}
