"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  email: string;
  /** Arrived from a reset-password email: say so and focus the field. */
  fromReset: boolean;
};

export function PasswordCard({ email, fromReset }: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) {
      setError("Those two passwords don’t match.");
      setMessage(null);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    const { error } = await createClient().auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    formEl.reset();
    setMessage("Saved. You can now sign in with your email and this password.");
  }

  return (
    <section id="password" className="flex flex-col gap-4 rounded-2xl border border-frame bg-surface p-6">
      <div>
        <div className="font-semibold">{fromReset ? "Choose a new password" : "Password"}</div>
        <div className="text-sm text-fg-soft">
          Used with “Sign in with email” as {email}. Signed up with Google? Set one here to use either.
        </div>
      </div>
      <form onSubmit={save} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">New password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            autoFocus={fromReset}
            className="h-11 rounded-xl border border-frame bg-bg px-3 outline-none focus:border-fg"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Type it again</span>
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="h-11 rounded-xl border border-frame bg-bg px-3 outline-none focus:border-fg"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-xl bg-fg px-5 text-sm font-semibold text-bg disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save password"}
          </button>
          {message && <span role="status" className="text-sm text-fg-soft">{message}</span>}
          {error && <span role="alert" className="text-sm font-semibold text-danger">{error}</span>}
        </div>
      </form>
    </section>
  );
}
