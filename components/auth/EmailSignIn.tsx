"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { sendPasswordReset } from "./sendPasswordReset";

export type EmailMode = "signIn" | "signUp" | "reset";

type Props = {
  mode: EmailMode;
  onModeChange: (mode: EmailMode) => void;
  onBack: () => void;
};

const TITLE: Record<EmailMode, string> = {
  signIn: "Sign in",
  signUp: "Create account",
  reset: "Reset password",
};

const SUBMIT: Record<EmailMode, string> = {
  signIn: "Sign in",
  signUp: "Create account",
  reset: "Send reset link",
};

export const fieldClass =
  "h-11 rounded-lg border border-black/20 bg-white/50 px-3 text-[15px] outline-none placeholder:text-ink-soft focus:border-black/50";

export function EmailSignIn({ mode, onModeChange, onBack }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null); // "check your email" text, once sent

  function switchTo(next: EmailMode) {
    setError(null);
    onModeChange(next);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setError(null);
    const supabase = createClient();

    if (mode === "signIn") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      router.push("/board");
      return;
    }

    if (mode === "reset") {
      const { error } = await sendPasswordReset(email);
      setBusy(false);
      if (error) setError(error.message);
      else setSent("If that email has an account, a reset link is on its way.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // With email confirmation on there is no session yet; the link finishes sign-up.
    if (data.session) router.push("/board");
    else setSent("Check your email for a link to finish signing up.");
  }

  return (
    <motion.div
      className="sticky-note relative flex w-full max-w-sm flex-col gap-4 p-8 text-ink"
      style={{ backgroundColor: "var(--paper-mint)", ["--paper" as string]: "var(--paper-mint)" }}
      initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
      animate={{ scale: 1, rotate: 1.5, opacity: 1 }}
      exit={{ scale: 0.6, rotate: 8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <h1 className="relative font-hand text-5xl font-bold leading-none">{TITLE[mode]}</h1>

      {sent ? (
        <p role="status" className="relative text-lg leading-snug">{sent}</p>
      ) : (
        <form onSubmit={submit} className="relative flex flex-col gap-2">
          {mode === "reset" && (
            <p className="mb-1 text-sm leading-snug">
              We’ll email you a link. It signs you in and lets you pick a new password.
            </p>
          )}
          <label className="sr-only" htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="Email"
            className={fieldClass}
          />
          {mode !== "reset" && (
            <>
              <label className="sr-only" htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                name="password"
                type="password"
                required
                minLength={mode === "signUp" ? 8 : undefined}
                autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                placeholder={mode === "signUp" ? "Password (8+ characters)" : "Password"}
                className={fieldClass}
              />
            </>
          )}
          {mode === "signIn" && (
            <button
              type="button"
              onClick={() => switchTo("reset")}
              className="self-end text-xs font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
            >
              Forgot password?
            </button>
          )}
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 h-12 rounded-xl bg-ink text-sm font-semibold text-on-ink disabled:opacity-50"
          >
            {busy ? "One moment…" : SUBMIT[mode]}
          </button>
        </form>
      )}

      <div className="relative flex justify-between text-xs font-semibold text-ink-soft">
        <button type="button" onClick={onBack} className="underline underline-offset-2 hover:text-ink">
          ← Back
        </button>
        {!sent && (
          <button
            type="button"
            onClick={() => switchTo(mode === "signIn" ? "signUp" : "signIn")}
            className="underline underline-offset-2 hover:text-ink"
          >
            {mode === "signIn" ? "New here? Create an account" : "Have an account? Sign in"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
