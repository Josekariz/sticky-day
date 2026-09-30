"use client";

import { useState } from "react";
import { AboutNote } from "./AboutNote";

export function ContactNote() {
  const [sent, setSent] = useState(false);

  return (
    <AboutNote title="Say hi" color="pink" rotation={2} delay={0.3}>
      {sent ? (
        <p className="py-6 text-center font-hand text-2xl">Got it. Thanks!</p>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          className="flex flex-col gap-2"
        >
          <label className="sr-only" htmlFor="c-name">Your name</label>
          <input
            id="c-name"
            required
            placeholder="Your name"
            className="h-10 rounded-lg border border-black/20 bg-white/50 px-3 font-hand text-lg outline-none placeholder:text-ink-soft focus:border-black/50"
          />
          <label className="sr-only" htmlFor="c-msg">Message</label>
          <textarea
            id="c-msg"
            required
            rows={3}
            placeholder="What's on your mind?"
            className="resize-none rounded-lg border border-black/20 bg-white/50 px-3 py-2 font-hand text-lg outline-none placeholder:text-ink-soft focus:border-black/50"
          />
          <button type="submit" className="h-10 self-end rounded-lg bg-ink px-4 text-sm font-semibold text-on-ink">
            Send
          </button>
        </form>
      )}
    </AboutNote>
  );
}
