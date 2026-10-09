"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

const AI_NOTICE = "Your notes go to an AI to be split. Keep passwords and money out.";
const QUICK_NOTICE = "Quick split, right here in your browser. Nothing is sent anywhere. Sign in and the AI does it properly.";
const NOTICE_DISMISSED_KEY = "sticky-day:ai-notice-dismissed";

const noSubscribe = () => () => {};
function readNoticeNotDismissed() {
  try {
    return localStorage.getItem(NOTICE_DISMISSED_KEY) !== "1";
  } catch {
    return true;
  }
}

export function BrainDump({
  onSubmit,
  quick = false,
}: {
  onSubmit: (text: string) => Promise<string | null>;
  quick?: boolean; // the guest board: split by rules in the browser, no AI
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Server snapshot is "hidden" so people who dismissed it never see it flash.
  const noticeNotDismissed = useSyncExternalStore(noSubscribe, readNoticeNotDismissed, () => false);
  const [dismissedNow, setDismissedNow] = useState(false);
  const showNotice = quick || (noticeNotDismissed && !dismissedNow);
  const notice = quick ? QUICK_NOTICE : AI_NOTICE;

  function dismissNotice() {
    setDismissedNow(true);
    try {
      localStorage.setItem(NOTICE_DISMISSED_KEY, "1");
    } catch {
      // Storage blocked: it stays hidden until the next reload.
    }
  }

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
          aria-describedby="dump-ai-notice"
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
          title={notice}
          className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-fg pl-4 pr-5 text-sm font-semibold leading-none text-bg disabled:opacity-60 md:w-auto md:min-w-40"
        >
          {busy ? (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center gap-0.5" aria-hidden>
              <span className="h-1 w-1 animate-bounce rounded-full bg-bg [animation-delay:-0.3s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-bg [animation-delay:-0.15s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-bg" />
            </span>
          ) : (
            !quick && (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2.5l2.3 7.2 7.2 2.3-7.2 2.3-2.3 7.2-2.3-7.2L2.5 12l7.2-2.3z" />
              </svg>
            )
          )}
          <span>{busy ? "Thinking" : "Break it down"}</span>
        </button>
      </form>
      {showNotice && (
        <div className="flex items-start gap-1 px-1">
          <p id="dump-ai-notice" className="text-xs text-fg-soft">
            {notice}{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-fg">
              Privacy
            </Link>
          </p>
          {!quick && <button
            type="button"
            onClick={dismissNotice}
            aria-label="Dismiss AI notice"
            className="-my-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-fg-soft hover:text-fg"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>}
        </div>
      )}
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
