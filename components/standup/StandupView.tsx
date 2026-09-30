"use client";

import { useState } from "react";

const FAKE = {
  yesterday: {
    done: ["Reply to client email", "Review PR #42", "Book dentist"],
    carried: ["Finish XML markup for Act 12"],
  },
  today: ["Finish XML markup for Act 12", "Write TikTok script", "Gym", "Update portfolio link"],
  blockers: ["Waiting on the validator fix before Act 12 can ship"],
};

function toText() {
  const y = FAKE.yesterday;
  return [
    `Yesterday: ${y.done.join(", ")}.${y.carried.length ? ` Didn't get to: ${y.carried.join(", ")}.` : ""}`,
    `Today: ${FAKE.today.join(", ")}.`,
    FAKE.blockers.length ? `Blocked: ${FAKE.blockers.join("; ")}.` : "No blockers.",
  ].join("\n");
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

export function StandupView() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(toText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-frame bg-surface p-6">
      <Section title="Yesterday · done" items={FAKE.yesterday.done} muted />
      <Section title="Yesterday · carried over" items={FAKE.yesterday.carried} />
      <Section title="Today" items={FAKE.today} />
      <Section title="Blockers" items={FAKE.blockers} />

      <div className="flex items-center gap-3 border-t border-frame pt-4">
        <button onClick={copy} className="h-11 rounded-xl bg-fg px-5 text-sm font-semibold text-bg">
          {copied ? "Copied" : "Copy as text"}
        </button>
        <span className="text-xs text-fg-soft">Paste it into Slack, a standup doc, wherever.</span>
      </div>
    </div>
  );
}
