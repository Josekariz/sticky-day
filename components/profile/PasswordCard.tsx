"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendPasswordReset } from "@/components/auth/sendPasswordReset";

const fieldClass = "h-11 rounded-xl border border-frame bg-bg px-3 outline-none focus:border-fg";

export function PasswordCard({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function close(note: string | null) {
    setOpen(false);
    setError(null);
    setMessage(note);
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const current = String(form.get("current") ?? "");
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) {
      setError("Those two new passwords don’t match.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    // Supabase doesn't check the old password on update, so prove it by signing in with it.
    const { error: wrong } = await supabase.auth.signInWithPassword({ email, password: current });
    if (wrong) {
      setError("That isn’t your current password.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    close("Saved. Use it next time you sign in with email.");
  }

  async function forgot() {
    setSaving(true);
    const { error } = await sendPasswordReset(email);
    setSaving(false);
    if (error) setError(error.message);
    else close(`Reset link sent to ${email}.`);
  }

  return (
    <section id="password" className="flex flex-col gap-4 rounded-2xl border border-frame bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 basis-48">
          <div className="font-semibold">Password</div>
          <div role="status" className="text-sm text-fg-soft">
            {message ?? "For “Sign in with email”. Only used Google? Choose Forgot password to set one."}
          </div>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setMessage(null);
            }}
            className="h-11 shrink-0 rounded-xl border border-frame px-5 text-sm font-semibold"
          >
            Change password
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label htmlFor="current-password" className="text-sm font-semibold">Current password</label>
              <button
                type="button"
                onClick={forgot}
                disabled={saving}
                className="text-xs text-fg-soft underline underline-offset-2 hover:text-fg"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="current-password"
              name="current"
              type="password"
              required
              autoComplete="current-password"
              autoFocus
              className={fieldClass}
            />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">New password</span>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Type it again</span>
            <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
          </label>
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-xl bg-fg px-5 text-sm font-semibold text-bg disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save password"}
            </button>
            <button
              type="button"
              onClick={() => close(null)}
              disabled={saving}
              className="text-sm text-fg-soft underline underline-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
