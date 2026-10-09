"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function BrainDump({
  onSubmit,
}: {
  onSubmit: (text: string) => Promise<string | null>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(t);
  }, [message]);

  async function submit() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const warning = await onSubmit(text);
      setMessage(warning);
      setText("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={(e) => { e.preventDefault(); void submit(); }}
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-frame bg-surface px-4 py-2 md:flex-nowrap"
      >
        <label htmlFor="dump" className="sr-only">What do you want to get done today?</label>
        <input
          id="dump"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on today?"
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
          disabled={!text.trim() || busy}
          className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-fg px-5 text-sm font-semibold text-bg disabled:opacity-60 md:w-auto"
        >
          {busy && (
            <span className="flex gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-bg [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-bg [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-bg" />
            </span>
          )}
          {busy ? "Thinking" : "Break it down"}
        </button>
      </form>
      <AnimatePresence>
        {message && (
          <motion.p
            key={message}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="px-1 text-sm text-fg-soft"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
