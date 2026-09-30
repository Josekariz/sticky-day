"use client";

import { useState } from "react";

export function BrainDump({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim()) return;
    onSubmit(text);
    setText("");
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="flex items-center gap-3 rounded-2xl border border-frame bg-surface px-4 py-2"
    >
      <label htmlFor="dump" className="sr-only">What do you want to get done today?</label>
      <input
        id="dump"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What do you want to get done today?"
        className="flex-1 min-w-0 bg-transparent font-hand text-2xl outline-none placeholder:text-fg-soft"
      />
      <button
        type="button"
        disabled
        title="Dictation coming soon"
        aria-label="Dictate (coming soon)"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-fg-soft opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <path d="M12 17v4" />
        </svg>
      </button>
      <button
        type="submit"
        disabled={!text.trim()}
        className="h-11 shrink-0 rounded-xl bg-fg px-5 text-sm font-semibold text-bg disabled:opacity-40"
      >
        Break it down
      </button>
    </form>
  );
}
