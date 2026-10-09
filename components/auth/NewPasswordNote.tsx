"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { fieldClass } from "./EmailSignIn";

/** Where a reset-password email lands. Without a session the link was expired or already used. */
export function NewPasswordNote({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) {
      setError("Those two passwords don’t match.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push("/profile");
  }

  return (
    <motion.div
      className="sticky-note relative flex w-full max-w-sm flex-col gap-4 p-8 text-ink"
      style={{ backgroundColor: "var(--paper-mint)", ["--paper" as string]: "var(--paper-mint)" }}
      initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
      animate={{ scale: 1, rotate: 1.5, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <h1 className="relative font-hand text-5xl font-bold leading-none">
        {signedIn ? "New password" : "Link expired"}
      </h1>

      {signedIn ? (
        <form onSubmit={save} className="relative flex flex-col gap-2">
          <label className="sr-only" htmlFor="new-password">New password</label>
          <input
            id="new-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoFocus
            autoComplete="new-password"
            placeholder="New password (8+ characters)"
            className={fieldClass}
          />
          <label className="sr-only" htmlFor="new-password-again">Type it again</label>
          <input
            id="new-password-again"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Type it again"
            className={fieldClass}
          />
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 h-12 rounded-xl bg-ink text-sm font-semibold text-on-ink disabled:opacity-50"
          >
            {busy ? "One moment…" : "Save password"}
          </button>
        </form>
      ) : (
        <>
          <p className="relative text-lg leading-snug">
            That reset link has expired or was already used. Ask for a new one from the sign-in note.
          </p>
          <Link
            href="/"
            className="relative flex h-12 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-on-ink"
          >
            Back to sign in
          </Link>
        </>
      )}
    </motion.div>
  );
}
