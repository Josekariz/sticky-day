"use client";

import { useState } from "react";
import { AboutNote } from "./AboutNote";
import { CONTACT_EMAIL_MAX, CONTACT_MESSAGE_MAX, CONTACT_NAME_MAX } from "@/lib/core/contact";

type Status = "idle" | "sending" | "sent" | "error";

const fieldClass =
  "rounded-lg border border-black/20 bg-white/50 px-3 font-hand text-lg outline-none placeholder:text-ink-soft focus:border-black/50";

export function ContactNote() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        message: form.get("message"),
        website: form.get("website"),
      }),
    }).catch(() => null);

    if (res?.ok) {
      setStatus("sent");
      return;
    }
    const data: { error?: unknown } | null = await res?.json().catch(() => null) ?? null;
    setError(typeof data?.error === "string" ? data.error : "Couldn't send that. Try again in a moment.");
    setStatus("error");
  }

  return (
    <AboutNote title="Say hi" color="pink" rotation={2} delay={0.3} still>
      {status === "sent" ? (
        <p className="py-6 text-center font-hand text-2xl">Got it. Thanks!</p>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-2">
          <label className="sr-only" htmlFor="c-name">Your name</label>
          <input
            id="c-name"
            name="name"
            required
            maxLength={CONTACT_NAME_MAX}
            placeholder="Your name"
            className={`h-10 ${fieldClass}`}
          />
          <label className="sr-only" htmlFor="c-email">Email (optional, if you’d like a reply)</label>
          <input
            id="c-email"
            name="email"
            type="email"
            maxLength={CONTACT_EMAIL_MAX}
            placeholder="Email, if you’d like a reply"
            className={`h-10 ${fieldClass}`}
          />
          <label className="sr-only" htmlFor="c-msg">Message</label>
          <textarea
            id="c-msg"
            name="message"
            required
            rows={3}
            maxLength={CONTACT_MESSAGE_MAX}
            placeholder="What's on your mind?"
            className={`resize-none py-2 ${fieldClass}`}
          />
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="c-website">Website</label>
            <input id="c-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          {status === "error" && <p role="alert" className="text-sm">{error}</p>}
          <button
            type="submit"
            disabled={status === "sending"}
            className="h-10 self-end rounded-lg bg-ink px-4 text-sm font-semibold text-on-ink disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </AboutNote>
  );
}
