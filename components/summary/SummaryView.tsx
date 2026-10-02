"use client";

import { useState } from "react";

export type SummaryData = {
  yesterdayDone: string[];
  yesterdayCarried: string[];
  yesterdaySummary: string | null;
  today: string[];
  blockers: string[];
};

function toText(data: SummaryData) {
  const yDone = data.yesterdayDone;
  const yCarried = data.yesterdayCarried;
  return [
    data.yesterdaySummary,
    `Yesterday: ${yDone.length ? yDone.join(", ") : "nothing done"}.${yCarried.length ? ` Didn't get to: ${yCarried.join(", ")}.` : ""}`,
    `Today: ${data.today.length ? data.today.join(", ") : "nothing on the board yet"}.`,
    data.blockers.length ? `Blocked: ${data.blockers.join("; ")}.` : "No blockers.",
  ]
    .filter(Boolean)
    .join("\n");
}

function Section({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-fg-soft">{title}</h2>
      <ul className="flex flex-col gap-1.5">
        {items.map((t) => (
          <li key={t} className={`flex items-baseline gap-2 text-base ${muted ? "text-fg-soft line-through" : ""}`}>
            <span className="text-fg-soft">•</span>
            {t}
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-fg-soft">Nothing here.</li>}
      </ul>
    </section>
  );
}

export function SummaryView({ data }: { data: SummaryData }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(toText(data));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-frame bg-surface p-6">
      {data.yesterdaySummary && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-fg-soft">Yesterday · recap</h2>
          <p className="text-base leading-relaxed text-fg">{data.yesterdaySummary}</p>
        </section>
      )}
      <Section title="Yesterday · done" items={data.yesterdayDone} muted />
      <Section title="Yesterday · carried over" items={data.yesterdayCarried} />
      <Section title="Today" items={data.today} />
      <Section title="Blockers" items={data.blockers} />

      <div className="flex items-center gap-3 border-t border-frame pt-4">
        <button onClick={copy} className="h-11 rounded-xl bg-fg px-5 text-sm font-semibold text-bg">
          {copied ? "Copied" : "Copy as text"}
        </button>
        <span className="text-xs text-fg-soft">Paste it into Slack, a standup doc, wherever.</span>
      </div>
    </div>
  );
}
