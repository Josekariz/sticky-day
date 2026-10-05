"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAccountCard({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const warningId = useId();
  const inputId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasOpen = useRef(false);

  const matches = typed.trim().toLowerCase() === email.trim().toLowerCase();

  function cancel() {
    setOpen(false);
    setTyped("");
    setError(null);
  }

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) triggerRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        setOpen(false);
        setTyped("");
        setError(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy]);

  async function deleteAccount() {
    if (!matches || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account/delete", { method: "POST" }).catch(() => null);
    if (res?.status === 204) {
      router.replace("/?deleted=1");
      router.refresh();
      return;
    }
    setBusy(false);
    setError("Couldn't delete your account. Try again.");
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-danger/30 bg-surface p-6">
      <div className="font-semibold">Delete account</div>
      <p id={warningId} className="text-sm text-fg-soft">
        This deletes every note, every day, every summary, the AI log, your profile and the
        link to your Google sign-in. It cannot be undone.
      </p>

      {!open ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="h-11 self-start rounded-xl border border-danger px-5 text-sm font-semibold text-danger"
        >
          Delete my account…
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            deleteAccount();
          }}
          className="flex flex-col gap-3"
        >
          <label htmlFor={inputId} className="text-sm font-semibold">
            Type your email to confirm <span className="font-normal text-fg-soft">{email}</span>
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="email"
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            aria-describedby={warningId}
            disabled={busy}
            className="h-11 rounded-xl border border-frame bg-bg px-3 outline-none focus:border-danger"
          />
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!matches || busy}
              className="h-11 rounded-xl bg-danger px-5 text-sm font-semibold text-bg disabled:opacity-40"
            >
              {busy ? "Deleting…" : "Delete everything"}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="text-sm text-fg-soft underline-offset-4 hover:underline disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        </form>
      )}
    </section>
  );
}
