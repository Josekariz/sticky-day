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
  onAddOne,
  quick = false,
}: {
  onSubmit: (text: string) => Promise<string | null>;
  /** One sticky from the text as typed; no AI. */
  onAddOne: (text: string) => Promise<string | null>;
  quick?: boolean; // the guest board: split by rules in the browser, no AI
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"split" | "one" | null>(null);
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

  async function run(kind: "split" | "one", action: (text: string) => Promise<string | null>) {
    if (!text.trim() || busy) return;
    setBusy(kind);
    setMessage(null);
    try {
      const warning = await action(text);
      setMessage(warning);
      setText("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={(e) => { e.preventDefault(); void run("split", onSubmit); }}
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-frame bg-surface px-4 py-2 md:flex-nowrap"
      >
        <label htmlFor="dump" className="sr-only">What do you want to get done today?</label>
        <input
          id="dump"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-describedby="dump-ai-notice"
          placeholder="What's on today?"
          className="min-w-0 flex-1 rounded-lg bg-transparent font-hand text-2xl outline-none placeholder:text-fg-soft focus-visible:shadow-[0_0_0_2px_var(--focus-gap),0_0_0_4px_var(--focus)]"
        />
        <button
          type="button"
          disabled
          title="Dictation coming soon"
          aria-label="Dictate (coming soon)"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-fg-soft opacity-40 md:h-10 md:w-10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <path d="M12 17v4" />
          </svg>
        </button>
        <div className="dump-paper-hover relative flex h-11 w-full shrink-0 md:w-auto">
          <button
            type="submit"
            disabled={!text.trim() || busy}
            title={notice}
            className="group relative flex h-11 min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-l-xl bg-fg pl-4 pr-4 text-sm font-semibold leading-none text-bg after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-[var(--dump-hover)] after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100 disabled:pointer-events-none disabled:opacity-60 md:min-w-40"
          >
            {busy === "split" ? (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center gap-0.5" aria-hidden>
                <span className="h-1 w-1 animate-bounce rounded-full bg-bg [animation-delay:-0.3s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-bg [animation-delay:-0.15s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-bg" />
              </span>
            ) : (
              !quick && (
                <svg className="h-4 w-4 shrink-0 group-hover:text-[var(--dump-hover)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2.5l2.3 7.2 7.2 2.3-7.2 2.3-2.3 7.2-2.3-7.2L2.5 12l7.2-2.3z" />
                </svg>
              )
            )}
            <span>{busy === "split" ? "Thinking" : "Break it down"}</span>
          </button>
          <button
            type="button"
            disabled={!text.trim() || busy}
            title="Add as one note"
            aria-label="Add as one note"
            onClick={() => void run("one", onAddOne)}
            className="group relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-r-xl bg-fg text-bg before:absolute before:inset-y-2.5 before:left-0 before:w-px before:bg-bg/20 disabled:pointer-events-none disabled:opacity-60"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full transition-colors duration-200 group-hover:bg-bg/10">
              <svg
                className="group-hover:text-[var(--dump-hover)]"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </button>
        </div>
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
            className="-my-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-fg-soft hover:text-fg md:h-6 md:w-6"
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
